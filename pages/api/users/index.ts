import isEmpty from "lodash/isEmpty";
import { NextApiRequest, NextApiResponse } from "next";
import { DefaultWireguard as wg, User } from "../../../wireguard";

interface ErrorResponse {
  error: any;
}

interface SuccessResponse {
  data: User[] | User;
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) => {
  if (req.method === "GET") {
    try {
      const users = await wg.getUsers();
      res.status(200).json({ data: users });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ error: e.message });
      } else {
        res.status(400).json({ error: e });
      }
    }
  } else if (req.method === "POST") {
    const { name } = req.body;
    if (isEmpty(name) || typeof name !== "string") {
      res.status(400).json({ error: "name cannot be empty" });
      return;
    }
    try {
      const user = await wg.createUser({ name: name.trim() });
      res.status(200).json({ data: user });
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ error: e.message });
      } else {
        res.status(400).json({ error: e });
      }
    }
  } else {
    res.status(400).json({ error: `invalid method` });
  }
};
