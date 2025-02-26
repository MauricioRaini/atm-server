import { AuthController } from "../modules/auth/controllers/auth.controller";
import { AuthService } from "../modules/auth/services/auth.service";
import { AuthRepository } from "../modules/auth/repositories/auth.repository";
import { HashMiddleware } from "../modules/auth/middlewares/hash.middleware";

const authRepository = new AuthRepository();
const hashMiddleware = new HashMiddleware();
const authService = new AuthService(authRepository, hashMiddleware);
export const authController = new AuthController(authService);
