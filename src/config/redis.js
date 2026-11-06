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

const connecting = redis.connect().catch((err) => {
  console.error("could not connect to redis:", err.message);
});

// give redis up to 1 second to connect, so the rate limiter has it ready at startup.
// if redis is down, the server still starts and keeps trying to connect in the background
await Promise.race([
  connecting,
  new Promise((resolve) => setTimeout(resolve, 1000)),
]);

export default redis;
