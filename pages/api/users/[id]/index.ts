import { isNil } from "lodash";
import isEmpty from "lodash/isEmpty";
import { NextApiRequest, NextApiResponse } from "next";
import { DefaultWireguard as wg, User } from "../../../../wireguard";

interface ErrorResponse {
  error: any;
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<User | ErrorResponse>
) => {
  const { id } = req.query;
  if (typeof id !== "string") {
    res.status(400).json({ error: "id must be string" });
    return;
  }

  switch (req.method) {
    case "GET": {
      const user = await wg.getUser(id);

      if (isNil(user)) {
        res.status(400).json({ error: "user not found" });
        return;
      }
      res.status(200).json(user);
      return;
    }
    case "PUT": {
      const { name, hostID } = req.body;
      console.log(`name: ${name}, hostID: ${hostID}`);
      let newUser: Partial<User> = {};
      if (!isEmpty(name)) {
        if (typeof name !== "string") {
          res.status(400).json({ error: "name must be string" });
          return;
        }
        newUser.name = name;
      }

      if (!isNil(hostID)) {
        if (isNaN(Number(hostID))) {
          res.status(400).json({ error: "hostID must be a number" });
          return;
        }
        newUser.hostID = Number(hostID);
      }

      try {
        console.log(`newUser: ${JSON.stringify(newUser)}`);
        const user = await wg.updateUser(id, newUser);
        res.status(200).json(user);
        return;
      } catch (e) {
        if (e instanceof Error) {
          res.status(400).json({ error: e.message });
          return;
        } else {
          res.status(400).json({ error: e });
          return;
        }
      }
    }

    case "DELETE": {
      try {
        const user = await wg.deleteUser(id);
        res.status(200).json(user);
      } catch (e) {
        if (e instanceof Error) {
          res.status(400).json({ error: e.message });
          return;
        } else {
          res.status(400).json({ error: e });
          return;
        }
      }
    }

    default: {
      res.status(400).json({ error: "invalid method" });
    }
  }
};
