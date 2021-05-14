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

  try {
    const user = await wg.regenerateKeys(id);
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
};
