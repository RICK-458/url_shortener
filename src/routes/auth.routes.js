import { Router } from "express";
import {
  signupController,
  loginController,
  googleLoginController,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/google", googleLoginController);

export default router;
