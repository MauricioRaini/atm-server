import express from "express";
import logger from "./config/logger";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("API is running...");
});

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
}

export default app;
