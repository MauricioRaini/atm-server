import { AuthController } from "../modules/auth/controllers/auth.controller";
import { AuthService } from "../modules/auth/services/auth.service";
import { AuthRepository } from "../modules/auth/repositories/auth.repository";
import { JwtMiddleware } from "../modules/auth/middlewares/jwt.middleware";
import { HashMiddleware } from "../modules/auth/middlewares/hash.middleware";

const authRepository = new AuthRepository();
const jwtMiddleware = new JwtMiddleware();
const hashMiddleware = new HashMiddleware();
const authService = new AuthService(authRepository, hashMiddleware);
export const authController = new AuthController(authService);
