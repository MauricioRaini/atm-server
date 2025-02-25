import { authController } from "@/config/dependencies";
import { Router } from "express";

const authRoutes = Router();

authRoutes.post("/login", authController.login);
authRoutes.post("/change-pin", authController.changePin);

export { authRoutes };
