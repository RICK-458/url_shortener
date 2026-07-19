import db from "../config/db.js";
import { nanoid } from "nanoid";

export async function createShortUrl(original_url, custom_code, exp_at, user_id) {
  const code = custom_code || nanoid(10);
  const short_url = `http://localhost:3000/${code}`;

  try {
    await db.query(
      "INSERT INTO urls (original_url, custom_code, short_url, exp_at, user_id) VALUES ($1, $2, $3, $4, $5)",
      [original_url, code, short_url, exp_at || null, user_id]
    );
  } catch (err) {
    if (err.code === "23505") {
      throw { status: 409, error: "Conflict", message: "Custom code already exists" };
    }
    throw err;
  }

  return { shorturl: short_url, code: code, expires_at: exp_at || null };
}

export async function getAllUrls(user_id) {
  const result = await db.query(
    "SELECT original_url, custom_code, short_url, clicks, exp_at, created_at FROM urls WHERE user_id = $1 ORDER BY created_at DESC",
    [user_id]
  );
  return result.rows;
}

export async function redirectToOriginal(code) {
  const result = await db.query(
    "SELECT original_url, exp_at FROM urls WHERE custom_code = $1",
    [code]
  );

  const row = result.rows[0];
  if (!row) {
    throw { status: 404, error: "Not found", message: "url not found" };
  }

  if (row.exp_at && row.exp_at < new Date()) {
    throw { status: 410, error: "Gone", message: "this link has expired" };
  }

  await db.query(
    "UPDATE urls SET clicks = clicks + 1, last_accessed = now() WHERE custom_code = $1",
    [code]
  );

  return row.original_url;
}

export async function getUrlDetails(code, user_id) {
  const result = await db.query(
    "SELECT * FROM urls WHERE custom_code = $1 AND user_id = $2",
    [code, user_id]
  );

  const details = result.rows[0];
  if (!details) {
    throw { status: 404, error: "Not found", message: "url not found" };
  }

  return details;
}

export async function deleteUrl(code, user_id) {
  const result = await db.query(
    "DELETE FROM urls WHERE custom_code = $1 AND user_id = $2",
    [code, user_id]
  );

  if (result.rowCount === 0) {
    throw { status: 404, error: "Not found", message: "code not found" };
  }

  return { message: "Deleted succesfully" };
}

export async function updateExpiry(code, exp_date, user_id) {
  const result = await db.query(
    "UPDATE urls SET exp_at = $1 WHERE custom_code = $2 AND user_id = $3",
    [exp_date, code, user_id]
  );

  if (result.rowCount === 0) {
    throw { status: 404, error: "Not found", message: "code not found" };
  }

  return { message: "Updated succesfully" };
}
