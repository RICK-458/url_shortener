import express from "express";
import cors from "cors";
import urlRoutes from "./routes/url.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", urlRoutes);

export default app;