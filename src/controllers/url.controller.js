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
    const result = await createShortUrl(original_url, custom_code, exp_at, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.status ? err.message : "something went wrong",
    });
  }
}

export async function getAllUrlsController(req, res) {
  try {
    const result = await getAllUrls(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.status ? err.message : "something went wrong",
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
      message: err.status ? err.message : "something went wrong",
    });
  }
}

export async function getUrlDetailsController(req, res) {
  try {
    const result = await getUrlDetails(req.params.code, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.status ? err.message : "something went wrong",
    });
  }
}

export async function deleteUrlController(req, res) {
  try {
    const result = await deleteUrl(req.params.code, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.status ? err.message : "something went wrong",
    });
  }
}

export async function updateExpiryController(req, res) {
  try {
    const result = await updateExpiry(req.params.code, req.body.exp_date, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.status ? err.message : "something went wrong",
    });
  }
}
