import express from "express";
import { authRoutes } from "./modules/auth/routes/auth.routes";

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

export default app;
