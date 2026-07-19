import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createShortUrlController,
  getAllUrlsController,
  redirectToOriginalController,
  getUrlDetailsController,
  deleteUrlController,
  updateExpiryController,
} from "../controllers/url.controller.js";

const router = Router();

router.post("/", authenticate, createShortUrlController);
router.get("/urls", authenticate, getAllUrlsController);
router.get("/urls/:code", authenticate, getUrlDetailsController);
router.delete("/urls/:code", authenticate, deleteUrlController);
router.patch("/urls/:code", authenticate, updateExpiryController);

// public: anyone clicking a short link gets redirected, no login needed.
// keep this last — /:code matches any single path segment.
router.get("/:code", redirectToOriginalController);

export default router;
