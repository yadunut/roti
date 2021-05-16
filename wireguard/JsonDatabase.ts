import fs from "fs";
import { isEmpty, isNil } from "lodash";
import { Database, User } from "./index";
export default class JSONDatabase implements Database {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;

    if (!fs.existsSync(filename)) {
      fs.writeFileSync(filename, "[]");
    }
  }
  async validateUser(user: User) {
    const users = (await this.getUsers()).filter((u) => u._id !== user._id);
    if (isEmpty(user.name)) {
      throw new Error("username cannot be empty");
    }

    if (!isEmpty(users.find((u) => u.name === user.name))) {
      throw new Error("User with same name exists");
    }
    if (isNil(user.hostID)) {
      throw new Error("host ID cannot be empty");
    }

    const hostIDs = users.map((user) => user.hostID);

    if (hostIDs.includes(user.hostID)) {
      throw new Error("User cannot have same hostID as another user");
    }
  }

  async createUser(newUser: User): Promise<User> {
    const users = await this.getUsers();
    const hostIDs = users.map((user) => user.hostID);

    if (isNil(newUser.hostID) || isNaN(newUser.hostID)) {
      console.log(`hostid is nil`);
      for (let i = 2; i < 254; i++) {
        if (!hostIDs.includes(i)) {
          newUser.hostID = i;
          break;
        }
      }
      // Only if there are more than 254 users
      if (isNil(newUser.hostID)) {
        throw new Error("more than 254 users");
      }
    }

    await this.validateUser(newUser);

    fs.writeFileSync(
      this.filename,
      JSON.stringify([...users, newUser], null, 2)
    );
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return JSON.parse(fs.readFileSync(this.filename, { encoding: "utf8" }));
  }

  async updateUser(user: User): Promise<User> {
    await this.validateUser(user);
    let users = await this.getUsers();
    users[users.findIndex((u) => u._id === user._id)] = user;
    fs.writeFileSync(this.filename, JSON.stringify(users, null, 2));
    return user;
  }

  async deleteUser(_id: string): Promise<User> {
    const users = await this.getUsers();
    const user = users.find((u) => u._id === _id);
    if (isNil(user)) {
      throw new Error("User not found");
    }
    const filteredUsers = users.filter((u) => u._id !== _id);
    fs.writeFileSync(this.filename, JSON.stringify(filteredUsers, null, 2));
    return user;
  }
}
