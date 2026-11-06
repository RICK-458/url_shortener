import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis.js";

const MINUTE = 60 * 1000;

function makeLimiter(name, windowMs, limit, message, skipSuccessfulRequests = false) {
  return rateLimit({
    windowMs: windowMs,
    limit: limit,
    message: { error: "Too many requests", message: message },
    // only count failed requests when this is true
    skipSuccessfulRequests: skipSuccessfulRequests,
    // tell the browser how many requests are left, using the current header format
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // if redis is down, let the request through instead of blocking everyone
    passOnStoreError: true,
    // keep the counts in redis so they survive a server restart
    store: new RedisStore({
      prefix: `rl:${name}:`,
      sendCommand: (...args) => redis.sendCommand(args),
    }),
  });
}

// 10 failed logins per 15 minutes. correct logins don't count, so real users aren't locked out
export const loginLimiter = makeLimiter(
  "login",
  15 * MINUTE,
  10,
  "too many failed logins, please try again in 15 minutes",
  true
);

export const signupLimiter = makeLimiter(
  "signup",
  60 * MINUTE,
  5,
  "too many signups, please try again in an hour"
);

export const createUrlLimiter = makeLimiter(
  "create-url",
  MINUTE,
  30,
  "too many links created, please wait a minute"
);
