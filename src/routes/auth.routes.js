import { Router } from "express";
import {
  signupController,
  loginController,
} from "../controllers/auth.controller.js";
import { loginLimiter, signupLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/signup", signupLimiter, signupController);
router.post("/login", loginLimiter, loginController);

export default router;
