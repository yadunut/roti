import { isEmpty, isNil } from "lodash";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { DefaultWireguard as wg, User } from "../wireguard";

interface Props {
  users: User[];
  error: string;
}

export default function Home({ users, error }: Props): JSX.Element {
  const handleDeleteButtonPress = (user: User) => async () => {
    const confirmation = confirm(
      `are you sure you wish to delete ${user.name}`
    );
    if (confirmation) {
      const deletedUser = await fetch(`/api/users/${user._id}`, {
        method: "DELETE",
      });
      console.log(`deleted ${JSON.stringify(deletedUser)}`);
      location.reload();
    }
  };
  return (
    <div>
      <Head>
        <title>Wireguard</title>
        <meta name="description" content="Wireguard Manager" />
      </Head>

      <main>
        <h1>Wireguard</h1>
        <h2>
          <Link href="/add">Add</Link>
        </h2>
        {!isNil(error) && <h2>{error}</h2>}

        <table>
          <thead>
            <tr>
              <td>name</td>
              <td>IP</td>
              <td colSpan={3}>action</td>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr>
                <td>
                  <Link href={`/${user._id}`}>{user.name}</Link>
                </td>
                <td>{user.hostID}</td>
                <td>
                  <button>
                    <Link href={`/${user._id}`}>
                      <a>edit</a>
                    </Link>
                  </button>
                  <button onClick={handleDeleteButtonPress(user)}>
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  type JSONResponse = {
    data?: User[];
    error?: string;
  };
  try {
    const users = await wg.getUsers();
    return { props: { users } };
  } catch (e) {
    if (e instanceof Error) {
      return { props: { error: e.message } };
    } else {
      return { props: { error: e } };
    }
  }
};
