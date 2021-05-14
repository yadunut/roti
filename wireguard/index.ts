import { spawnSync, execFileSync } from "child_process";
import fs from "fs";
import { isNil } from "lodash";
import isEmpty from "lodash/isEmpty";
import { v4 as uuid } from "uuid";
import JSONDatabase from "./JsonDatabase";

export interface User {
  hostID?: number;
  name: string;
  publicKey: string;
  privateKey: string;
  _id: string;
}

export interface Database {
  createUser(user: User): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(user: User): Promise<User>;
  deleteUser(_id: string): Promise<User>;
}

interface Server {
  port: number;
  privateKey: string;
}

interface Config {
  network: string;
  server: Server;
  configFile: string;
  wireguardServiceScriptFile: string;
}

export class Wireguard {
  private db: Database;
  private config: Config;

  constructor(db: Database, config: Config) {
    this.db = db;
    this.config = config;
  }

  generateKeys(): [string, string] {
    const privKey = spawnSync("wg", ["genkey"], { encoding: "utf8" })
      .output.filter((item) => !isEmpty(item))[0]
      .trim();

    const pubKey = spawnSync("wg", ["pubkey"], {
      encoding: "utf8",
      input: privKey,
    })
      .output.filter((item) => !isEmpty(item))[0]
      .trim();

    return [privKey, pubKey];
  }

  async createUser({ name, hostID }: { name: string; hostID?: number }) {
    const [privKey, pubKey] = this.generateKeys();

    const user = await this.db.createUser({
      name,
      hostID,
      publicKey: pubKey,
      privateKey: privKey,
      _id: uuid(),
    });
    this.updateConfig();
    return user;
  }

  getUsers(): Promise<User[]> {
    return this.db.getUsers();
  }

  async getUser(_id: string): Promise<User | undefined> {
    const users = await this.db.getUsers();
    return users.find((u) => u._id === _id);
  }

  async updateUser(_id: string, newUser: Partial<User>): Promise<User> {
    const oldUser = await this.getUser(_id);
    if (isNil(oldUser)) {
      throw new Error("user not found");
    }
    try {
      const user = await this.db.updateUser({ ...oldUser, ...newUser });
      await this.updateConfig();
      return user;
    } catch (e) {
      throw e;
    }
  }

  async deleteUser(_id: string) {
    const user = await this.db.deleteUser(_id);
    await this.updateConfig();
    return user;
  }

  async regenerateKeys(_id: string): Promise<User> {
    const [privateKey, publicKey] = this.generateKeys();
    return await this.updateUser(_id, { privateKey, publicKey });
  }

  private async updateConfig() {
    const server = this.config.server;
    let config = `[Interface]
Address = ${this.config.network}.1/24
ListenPort=${server.port}
PrivateKey=${server.privateKey}
`;

    (await this.getUsers()).forEach((user) => {
      config += `
### begin ${user.name} ###
[Peer]
PublicKey = ${user.publicKey}
AllowedIPs = ${this.config.network}.${user.hostID}/32
### end ${user.name} ###
`;
    });

    fs.writeFileSync(this.config.configFile, config);
    this.restartWireguard();
  }

  private restartWireguard() {
    console.log(`running: ${this.config.wireguardServiceScriptFile}`);
    console.log(
      execFileSync(`./${this.config.wireguardServiceScriptFile}`, {
        encoding: "utf8",
      }).toString()
    );
  }
}

export function generateUserConfig(user: User): string {
  if (isNil(process.env.NETWORK)) {
    console.error(`NETWORK cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.SERVER_PUBLIC_KEY)) {
    console.error(`SERVER_PUBLIC_KEY cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.SERVER_HOSTNAME)) {
    console.error(`SERVER_HOSTNAME cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.SERVER_PORT)) {
    console.error(`SERVER_PORT cannot be null`);
    process.exit(1);
  }

  return `[Interface]
PrivateKey = ${user.privateKey}
Address = ${process.env.NETWORK}.${user.hostID}/32

[Peer]
PublicKey = ${process.env.SERVER_PUBLIC_KEY}
Endpoint = ${process.env.SERVER_HOSTNAME}:${process.env.SERVER_PORT}
AllowedIPs = 0.0.0.0/0`;
}

function createDefaultWireguard(): Wireguard {
  if (isNil(process.env.NETWORK)) {
    console.error(`NETWORK cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.CONFIG_FILE)) {
    console.error(`CONFIG_FILE cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.SERVER_PORT)) {
    console.error(`SERVER_PORT cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.SERVER_PUBLIC_KEY)) {
    console.error(`SERVER_PUBLIC_KEY cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.SERVER_PRIVATE_KEY)) {
    console.error(`SERVER_PRIVATE_KEY cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.SERVER_HOSTNAME)) {
    console.error(`SERVER_HOSTNAME cannot be null`);
    process.exit(1);
  }
  if (isNil(process.env.WIREGUARD_SERVICE_SCRIPT_FILE)) {
    console.error(`WIREGUARD_SERVICE_SCRIPT_FILE cannot be null`);
    process.exit(1);
  }

  return new Wireguard(new JSONDatabase("clients.json"), {
    network: process.env.NETWORK,
    configFile: process.env.CONFIG_FILE,
    wireguardServiceScriptFile: process.env.WIREGUARD_SERVICE_SCRIPT_FILE,
    server: {
      port: Number(process.env.SERVER_PORT),
      privateKey: process.env.SERVER_PRIVATE_KEY,
    },
  });
}

export const DefaultWireguard = createDefaultWireguard();
