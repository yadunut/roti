import axios from "axios";
import { isNil } from "lodash";
import { FormEventHandler, useState } from "react";
import styled from "styled-components";
import { User } from "../wireguard";

export default function Add() {
  const [user, setUser] = useState<Partial<User>>({});
  const [error, setError] = useState<string>("");
  const handleFormSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/users", user);
      window.location.href = window.location.origin;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data.error);
      } else {
        throw e;
      }
    }
  };
  return (
    <div>
      <h1>Add User</h1>
      {!isNil(error) && <h2>{error}</h2>}
      <form onSubmit={handleFormSubmit}>
        <Label>
          name:
          <input
            type="text"
            required
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
        </Label>
        <Label>
          hostID:
          <input
            type="number"
            value={user.hostID}
            min={2}
            max={254}
            onChange={(e) =>
              setUser({ ...user, hostID: Number(e.target.value) })
            }
          />
        </Label>
        <input type="submit" />
      </form>
    </div>
  );
}

const Label = styled.label`
  display: block;
`;
