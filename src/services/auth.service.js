import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function makeToken(user_id) {
  return jwt.sign({ id: user_id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function signup(username, email, password) {
  if (!username || !email || !password) {
    throw { status: 400, error: "Bad request", message: "username, email and password are required" };
  }

  if (password.length < 8) {
    throw { status: 400, error: "Bad request", message: "password must be at least 8 characters" };
  }

  const password_hash = await bcrypt.hash(password, 10);

  let result;
  try {
    result = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, password_hash]
    );
  } catch (err) {
    if (err.code === "23505") {
      throw { status: 409, error: "Conflict", message: "email already registered" };
    }
    throw err;
  }

  const user = result.rows[0];
  return { token: makeToken(user.id), user: user };
}

export async function login(email, password) {
  if (!email || !password) {
    throw { status: 400, error: "Bad request", message: "email and password are required" };
  }

  const result = await db.query(
    "SELECT id, username, email, password_hash FROM users WHERE email = $1",
    [email]
  );

  const user = result.rows[0];
  // same message for every failure so nobody can guess which emails exist
  if (!user || !user.password_hash) {
    throw { status: 401, error: "Unauthorized", message: "wrong email or password" };
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw { status: 401, error: "Unauthorized", message: "wrong email or password" };
  }

  return {
    token: makeToken(user.id),
    user: { id: user.id, username: user.username, email: user.email },
  };
}
