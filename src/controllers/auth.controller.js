import { signup, login } from "../services/auth.service.js";

export async function signupController(req, res) {
  try {
    const { username, email, password } = req.body;
    const result = await signup(username, email, password);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.status ? err.message : "something went wrong",
    });
  }
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error || "server error",
      message: err.status ? err.message : "something went wrong",
    });
  }
}
