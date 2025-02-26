require("module-alias/register");
import express from "express";
import { transactionRoutes } from "./modules/transactions/routes";
import cors from "cors";
import { authRoutes } from "./modules/auth/routes";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

/* TODO: customize CORS settings once deployment in the FE is done. */
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;
