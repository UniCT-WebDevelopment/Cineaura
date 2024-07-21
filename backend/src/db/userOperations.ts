import { conn } from "./index";
import fs from "fs/promises";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserType } from "../types/UserType";
import { QueryError, QueryResult, ResultSetHeader } from "mysql2/promise";
import { generateKeyPairSync } from "crypto";

type KeyPair = {
  privateKey: string;
  publicKey: string;
};

export type UserCompleteInfo = {
  id: number;
  username: string;
  password: string;
  isAdmin: boolean;
};

export const tokenOptions: SignOptions = {
  expiresIn: "2h",
  algorithm: "RS256",
};

// export const registerUserDB = async (user: UserType) => {
//   let keyPair: KeyPair;

//   await generateKeys().then((keys) => (keyPair = keys));

//   return new Promise<number | string>((resolve, reject) => {
//     const sql =
//       "insert into users (username, password, isAdmin) values (?, ?, ?);";
//     conn.query<ResultSetHeader>(
//       sql,
//       [
//         user.username,
//         user.password,
//         true, // true = isAdmin (for now) TODO: change this
//       ],
//       (err, result) => {
//         if (err) reject("Error: registerUserDB");

//         try {
//           resolve(result.affectedRows);
//         } catch {
//           reject(0);
//         }
//       }
//     );
//   });
// };

export const registerUserDB = async (user: UserType): Promise<boolean> => {
  const sql =
    "insert into users (username, password, isAdmin) values (?, ?, ?);";

  return new Promise((resolve, reject) => {
    conn.query<ResultSetHeader>(
      sql,
      [
        user.username,
        user.password,
        true, // true = isAdmin (for now) TODO: change this
      ],
      (err, result) => {
        if (err) {
          console.error("Error: registerUserDB", err);
          resolve(false);
          return;
        }

        try {
          resolve(result.affectedRows > 0);
        } catch (error) {
          console.error("Error processing result: ", error);
          resolve(false);
        }
      }
    );
  });
};

export const generateKeys = (): Promise<KeyPair> => {
  return new Promise((resolve, reject) => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    fs.writeFile("data/privateKey.pem", privateKey);

    fs.writeFile("data/publicKey.pem", publicKey);

    resolve({ privateKey: privateKey, publicKey: publicKey });
  });
};

export async function loadKeys(): Promise<KeyPair> {
  const privateKey = await fs.readFile("data/privateKey.pem", "utf-8");
  const publicKey = await fs.readFile("data/publicKey.pem", "utf-8");

  return { privateKey: privateKey, publicKey: publicKey };
}

// export const getUserKeysByUsername = async (
//   username: string
// ): Promise<KeyPair> => {
//   const sql = "SELECT privateKey, publicKey FROM users WHERE username = ?";
//   return new Promise<KeyPair>((resolve, reject) => {
//     conn.query<any>(sql, [username], (err, results) => {
//       if (err) {
//         reject(err);
//         return;
//       }

//       if (results.length === 0) {
//         reject(new Error("User not found"));
//         return;
//       }

//       resolve({
//         privateKey: results[0].privateKey,
//         publicKey: results[0].publicKey,
//       });
//     });
//   });
// };

export const getUserInfoByUsername = async (
  username: string
): Promise<UserCompleteInfo> => {
  return new Promise<UserCompleteInfo>((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE username = ?";

    conn.query<any>(sql, [username], (err, results) => {
      if (err) {
        reject({ msg: "Error: getUserIdByUsername" });
        return;
      }

      if (results.length === 0) {
        reject({ msg: "User not found" });
        return;
      }

      resolve(results[0]);
    });
  });
};

export const loginUser = async (user: UserType) => {
  return new Promise<string>((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    conn.query<any>(sql, [user.username, user.password], (err, results) => {
      if (err) {
        reject("");
        return;
      }

      if (results.length === 0) {
        reject("");
        return;
      }

      const user: UserCompleteInfo = results[0];
      const token = signToken(user);

      resolve(token);
    });
  });
};

export const signToken = (user: UserCompleteInfo): string => {
  const payload = { id: user.id, isAdmin: user.isAdmin };
  return jwt.sign(payload, user.password, tokenOptions);
};

export const verifyToken = (token: string, publicKey: string) => {
  const payload = jwt.verify(token, publicKey, tokenOptions);
  return payload;
};
