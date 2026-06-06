import {
  createShortUrl,
  getAllUrls,
  redirectToOriginal,
  getUrlDetails,
  deleteUrl,
  updateExpiry,
} from "../services/url.service.js";

export async function createShortUrlController(req, res) {
  try {
    const { original_url, custom_code, exp_at } = req.body;
    const result = await createShortUrl(original_url, custom_code, exp_at);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.message || "something went wrong",
    });
  }
}

export async function getAllUrlsController(req, res) {
  try {
    const result = await getAllUrls();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.message || "something went wrong",
    });
  }
}

export async function redirectToOriginalController(req, res) {
  try {
    const originalUrl = await redirectToOriginal(req.params.code);
    res.redirect(originalUrl);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.message || "something went wrong",
    });
  }
}

export async function getUrlDetailsController(req, res) {
  try {
    const result = await getUrlDetails(req.params.code);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.message || "something went wrong",
    });
  }
}

export async function deleteUrlController(req, res) {
  try {
    const result = await deleteUrl(req.params.code);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.message || "something went wrong",
    });
  }
}

export async function updateExpiryController(req, res) {
  try {
    const result = await updateExpiry(req.params.code, req.body.exp_date);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.message || "something went wrong",
    });
  }
}