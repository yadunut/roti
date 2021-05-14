import { isNil } from "lodash";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { FormEventHandler, useState } from "react";
import {
  DefaultWireguard as wg,
  generateUserConfig,
  User,
} from "../../wireguard";
import axios from "axios";

interface Props {
  user?: User;
  config?: string;
  error: string;
}

export default function UserScreen({
  user: oldUser,
  error: oldError,
  config: oldConfig,
}: Props) {
  const [user, setUser] = useState(oldUser);
  const [error, setError] = useState<string | null>(oldError);
  const [config, setConfig] = useState(oldConfig);
  const handleFormSubmit: FormEventHandler = async (e) => {
    if (isNil(user)) {
      setError("user is nil");
      return;
    }
    e.preventDefault();
    try {
      await axios.put(`/api/users/${user._id}`, user);
      window.location.href = window.location.href;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data.error);
        console.log(e.response?.data.error);
      } else {
        throw e;
      }
    }
  };
  if (isNil(user)) {
    return (
      <div>
        <h1>Error: User is nil</h1>
      </div>
    );
  }
  return (
    <div>
      {error && <h2>{error}</h2>}
      <form onSubmit={handleFormSubmit}>
        <Label>
          name:
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
        </Label>
        <Label>
          hostID:
          <input
            type="number"
            min={2}
            max={254}
            value={user.hostID}
            onChange={(e) =>
              setUser({ ...user, hostID: Number(e.target.value) })
            }
          />
        </Label>
        <input type="submit" />
      </form>
      <code style={{ whiteSpace: "pre-line", userSelect: "all" }}>
        {config}
      </code>
    </div>
  );
}

const Label = styled.label`
  display: block;
`;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id;
  if (typeof id !== "string") {
    return { props: { error: `invalid id` } };
  }
  const user = await wg.getUser(id);
  if (isNil(user)) {
    return { props: { error: `user ${id} is nil` } };
  }

  const config = await generateUserConfig(user);
  return { props: { user, config } };
};
