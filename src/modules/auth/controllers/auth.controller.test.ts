import { AuthService } from "../services/auth.service";
import { Request, Response } from "express";
import { jest } from "@jest/globals";
import { mockUser } from "../mocks";
import { AUTH_MESSAGES } from "../constants";
import { AuthController } from "./auth.controller";

describe("🛠 Auth Controller", () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      logout: jest.fn(),
      changePin: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    authController = new AuthController(authService);

    jsonMock = jest.fn();

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jsonMock,
    } as Partial<Response>;
  });

  describe("🔹 Given a user logs in", () => {
    beforeEach(() => {
      req = { body: { identifier: "123456", pin: "0000" } };
    });

    it("✅ Should return 200 and token on successful login", async () => {
      authService.login.mockResolvedValue({
        user: mockUser,
        token: "valid.jwt.token",
        timeToLive: 300,
      });

      await authController.login(req as Request, res as Response);

      expect(authService.login).toHaveBeenCalledWith("123456", "0000");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        user: { id: "user123", accountNumber: "123456" },
        token: "valid.jwt.token",
        timeToLive: 300,
      });
    });

    it("🚫 Should return 401 if PIN is incorrect", async () => {
      authService.login.mockRejectedValue(new Error(AUTH_MESSAGES.UNAUTHORIZED));

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: AUTH_MESSAGES.UNAUTHORIZED });
    });

    it("🚫 Should return 403 if user is blocked", async () => {
      authService.login.mockRejectedValue(new Error(AUTH_MESSAGES.USER_BLOCKED));

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: AUTH_MESSAGES.USER_BLOCKED });
    });

    it("🚫 Should return 429 if too many failed attempts", async () => {
      authService.login.mockRejectedValue(new Error(AUTH_MESSAGES.TOO_MANY_FAILED_ATTEMPTS));

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({ error: AUTH_MESSAGES.TOO_MANY_FAILED_ATTEMPTS });
    });

    it("🚫 Should return 500 if an unexpected error occurs", async () => {
      authService.login.mockRejectedValue(new Error());

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Something went wrong. Please try again later.",
      });
    });

    it("🚫 Should return 503 if the service is unavailable", async () => {
      authService.login.mockRejectedValue(new Error(AUTH_MESSAGES.SERVICE_UNAVAILABLE));

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({ error: AUTH_MESSAGES.SERVICE_UNAVAILABLE });
    });
  });

  /* TODO: Implement when full logout service is ready in both FE and BE */
  /*  describe("🔹 Given a user logs out", () => {
    beforeEach(() => {
      req = { body: { token: "valid.jwt.token" } };
    });

    it("✅ Should return 200 on successful logout", async () => {
      await authController.logout(req as Request, res as Response);

      expect(authService.logout).toHaveBeenCalledWith("valid.jwt.token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Logout successful" });
    });

    it("🚫 Should return 401 if token is missing or invalid", async () => {
      authService.logout.mockRejectedValue(new Error(AUTH_MESSAGES.INVALID_TOKEN));

      await authController.logout(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: AUTH_MESSAGES.INVALID_TOKEN });
    });

    it("🚫 Should return 500 if an unexpected error occurs", async () => {
      authService.logout.mockRejectedValue(new Error());

      await authController.logout(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Something went wrong. Please try again later.",
      });
    });
  }); */

  describe("🔹 Given a user changes their PIN", () => {
    beforeEach(() => {
      req = { body: { userId: "user123", oldPin: "0000", newPin: "1234" } };
    });

    it("✅ Should return 200 if PIN is changed successfully", async () => {
      await authController.changePin(req as Request, res as Response);

      expect(authService.changePin).toHaveBeenCalledWith("user123", "0000", "1234");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: "PIN changed successfully" });
    });

    it("🚫 Should return 400 if new PIN is the same as old PIN", async () => {
      authService.changePin.mockRejectedValue(new Error(AUTH_MESSAGES.SAME_NEW_OLD_PIN));

      await authController.changePin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: AUTH_MESSAGES.SAME_NEW_OLD_PIN });
    });

    it("🚫 Should return 401 if old PIN is incorrect", async () => {
      authService.changePin.mockRejectedValue(new Error(AUTH_MESSAGES.UNAUTHORIZED));

      await authController.changePin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: AUTH_MESSAGES.UNAUTHORIZED });
    });

    it("🚫 Should return 500 if an unexpected error occurs", async () => {
      authService.changePin.mockRejectedValue(new Error());

      await authController.changePin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Something went wrong. Please try again later.",
      });
    });
  });
});
