import express from "express";
import { authRoutes } from "./modules/auth/routes/auth.routes";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;
