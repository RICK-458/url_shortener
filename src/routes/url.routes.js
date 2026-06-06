import { Router } from "express";
import {
  createShortUrlController,
  getAllUrlsController,
  redirectToOriginalController,
  getUrlDetailsController,
  deleteUrlController,
  updateExpiryController,
} from "../controllers/url.controller.js";

const router = Router();

router.post("/", createShortUrlController);
router.get("/urls", getAllUrlsController);
router.get("/:code", redirectToOriginalController);
router.get("/urls/:code", getUrlDetailsController);
router.delete("/urls/:code", deleteUrlController);
router.patch("/urls/:code", updateExpiryController);

export default router;