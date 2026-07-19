import express from "express";
import cors from "cors";
import urlRoutes from "./routes/url.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// auth first, otherwise /auth would get caught by the /:code route below
app.use("/auth", authRoutes);
app.use("/", urlRoutes);

export default app;