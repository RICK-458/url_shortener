import db from "../config/db.js";
import { nanoid } from "nanoid";

let url = [];
let customcode = [];
let originalurl = [];

try {
  const res = await db.query("SELECT * FROM urls");
  url = res.rows;
  customcode = url.map((x) => x.custom_code);
  originalurl = url.map((x) => x.original_url);
} catch (err) {
  console.log("error executing query", err.stack);
}

export async function createShortUrl(original_url, custom_code, exp_at) {
  let code;
  let short_url;

  if (custom_code && !customcode.includes(custom_code)) {
    code = custom_code;
    short_url = `http://localhost:3000/${code}`;
  } else if (!custom_code) {
    code = nanoid(10);
    short_url = `http://localhost:3000/${code}`;
  } else {
    throw { status: 409, error: "Conflict", message: "Custom code already exists" };
  }

  const expiry = exp_at || null;
  const created_at = new Date().toISOString().split("T")[0];

  await db.query(
    "INSERT INTO urls (original_url, custom_code, short_url, clicks, exp_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [original_url, code, short_url, 0, expiry, created_at]
  );

  customcode.push(code);
  originalurl.push(original_url);

  return { shorturl: short_url, code: code, expires_at: expiry };
}

export async function getAllUrls() {
  const result = await db.query("SELECT original_url, custom_code, clicks FROM urls");
  return result.rows;
}

export async function redirectToOriginal(code) {
  if (!customcode.includes(code)) {
    throw { status: 404, error: "Not found", message: "code not found" };
  }

  const result = await db.query(
    "SELECT original_url FROM urls WHERE custom_code = $1",
    [code]
  );

  const originalUrl = result.rows[0]?.original_url;
  if (!originalUrl) {
    throw { status: 404, error: "Not found", message: "url not found" };
  }

  await db.query(
    "UPDATE urls SET clicks = clicks + 1, last_accessed = $1 WHERE custom_code = $2",
    [new Date().toISOString().split("T")[0], code]
  );

  return originalUrl;
}

export async function getUrlDetails(code) {
  const result = await db.query(
    "SELECT * FROM urls WHERE custom_code = $1",
    [code]
  );

  const details = result.rows[0];
  if (!details) {
    throw { status: 404, error: "Not found", message: "url not found" };
  }

  return details;
}

export async function deleteUrl(code) {
  const result = await db.query(
    "DELETE FROM urls WHERE custom_code = $1",
    [code]
  );

  if (result.rowCount === 0) {
    throw { status: 404, error: "Not found", message: "code not found" };
  }

  return { message: "Deleted succesfully" };
}

export async function updateExpiry(code, exp_date) {
  const result = await db.query(
    "UPDATE urls SET exp_at = $1 WHERE custom_code = $2",
    [exp_date, code]
  );

  if (result.rowCount === 0) {
    throw { status: 404, error: "Not found", message: "code not found" };
  }

  return { message: "Updated succesfully" };
}