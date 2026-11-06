import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  // if redis is down, fail right away so we can use postgres instead of waiting
  disableOfflineQueue: true,
});

// without this listener, a lost redis connection would crash the whole server
redis.on("error", (err) => {
  console.error("redis error:", err.message);
});

redis.connect().catch((err) => {
  console.error("could not connect to redis:", err.message);
});

export default redis;
