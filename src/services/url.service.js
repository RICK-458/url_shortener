import db from "../config/db.js";
import redis from "../config/redis.js";
import { nanoid } from "nanoid";

const CACHE_SECONDS = 3600; // keep a link in redis for 1 hour

// only allow real http/https links, so nobody can save "javascript:..." or junk
function isValidUrl(text) {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
}

export async function createShortUrl(original_url, custom_code, exp_at, user_id) {
  if (typeof original_url !== "string" || !original_url.trim()) {
    throw { status: 400, error: "Bad request", message: "please enter a url" };
  }

  original_url = original_url.trim();
  if (!isValidUrl(original_url)) {
    throw { status: 400, error: "Bad request", message: "url must start with http:// or https://" };
  }

  // letters, numbers, - and _ only, so a code can't break the link or hit /urls or /auth
  if (custom_code && !/^[a-zA-Z0-9_-]{3,30}$/.test(custom_code)) {
    throw { status: 400, error: "Bad request", message: "custom code must be 3-30 letters, numbers, - or _" };
  }
  if (custom_code === "urls" || custom_code === "auth") {
    throw { status: 400, error: "Bad request", message: "that custom code is reserved" };
  }

  if (exp_at && isNaN(new Date(exp_at))) {
    throw { status: 400, error: "Bad request", message: "invalid expiry date" };
  }

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

// returns the saved link from redis, or null if it isn't there or redis is down
async function getCachedUrl(code) {
  try {
    const cached = await redis.get(`url:${code}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    return null;
  }
}

async function saveUrlToCache(code, row) {
  try {
    await redis.set(`url:${code}`, JSON.stringify(row), { EX: CACHE_SECONDS });
  } catch (err) {
    console.error("could not save to redis:", err.message);
  }
}

// call this whenever a link changes, so redis never keeps the old version
async function removeUrlFromCache(code) {
  try {
    await redis.del(`url:${code}`);
  } catch (err) {
    console.error("could not remove from redis:", err.message);
  }
}

async function saveClicksToDb(code, clicks) {
  await db.query(
    "UPDATE urls SET clicks = clicks + $1, last_accessed = now() WHERE custom_code = $2",
    [clicks, code]
  );
}

// count the click in redis because it's fast. if redis is down, use postgres
async function countClick(code) {
  try {
    await redis.hIncrBy("clicks", code, 1);
  } catch (err) {
    await saveClicksToDb(code, 1);
  }
}

// moves the waiting click counts from redis to postgres. index.js runs this every 10 seconds
export async function saveClicks() {
  let clicks;

  try {
    // multi runs both together, so no click can sneak in between reading and deleting
    const replies = await redis.multi().hGetAll("clicks").del("clicks").exec();
    clicks = replies[0];
  } catch (err) {
    return; // redis is down, so there is nothing we can read right now
  }

  for (const code in clicks) {
    try {
      await saveClicksToDb(code, Number(clicks[code]));
    } catch (err) {
      // postgres failed, so put the count back and try again next time
      console.error("could not save clicks:", err.message);
      await redis.hIncrBy("clicks", code, Number(clicks[code])).catch(() => {});
    }
  }
}

export async function redirectToOriginal(code) {
  let row = await getCachedUrl(code);

  if (!row) {
    const result = await db.query(
      "SELECT original_url, exp_at FROM urls WHERE custom_code = $1",
      [code]
    );

    row = result.rows[0];
    if (!row) {
      throw { status: 404, error: "Not found", message: "url not found" };
    }

    await saveUrlToCache(code, row);
  }

  // exp_at comes back from redis as text, so turn it into a date before comparing
  if (row.exp_at && new Date(row.exp_at) < new Date()) {
    throw { status: 410, error: "Gone", message: "this link has expired" };
  }

  await countClick(code);

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

  await removeUrlFromCache(code);

  return { message: "Deleted succesfully" };
}

export async function updateExpiry(code, exp_date, user_id) {
  if (exp_date && isNaN(new Date(exp_date))) {
    throw { status: 400, error: "Bad request", message: "invalid expiry date" };
  }

  const result = await db.query(
    "UPDATE urls SET exp_at = $1 WHERE custom_code = $2 AND user_id = $3",
    [exp_date, code, user_id]
  );

  if (result.rowCount === 0) {
    throw { status: 404, error: "Not found", message: "code not found" };
  }

  await removeUrlFromCache(code);

  return { message: "Updated succesfully" };
}
