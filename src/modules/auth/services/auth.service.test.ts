import { AuthService } from "../services/auth.service";
import { AuthRepository } from "../repositories/auth.repository";
import { jest } from "@jest/globals";
import { HashMiddleware, JwtMiddleware } from "../middlewares";
import { FIVE_MINUTES_BLOCK, MAX_FAILED_ATTEMPTS, TOKEN_TTL } from "../constants";
import { mockUser } from "../mocks";

describe("🛠 Auth Service", () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtProvider: jest.Mocked<JwtMiddleware>;
  let hashProvider: jest.Mocked<HashMiddleware>;

  beforeEach(() => {
    authRepository = {
      getUserByAccountNumber: jest.fn(),
      getUserByCardNumber: jest.fn(),
      setFailedAttempts: jest.fn(),
      setBlockedUntil: jest.fn(),
      updateUserPin: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    jwtProvider = { generateToken: jest.fn() } as unknown as jest.Mocked<JwtMiddleware>;
    hashProvider = {
      compare: jest.fn(),
      hash: jest.fn(),
    } as unknown as jest.Mocked<HashMiddleware>;

    authService = new AuthService(authRepository, jwtProvider, hashProvider);
  });

  describe("🔹 Given a user logs in", () => {
    it("✅ Should return a token if login is successful", async () => {
      authRepository.getUserByAccountNumber.mockResolvedValue(mockUser);
      hashProvider.compare.mockResolvedValue(true);
      jwtProvider.generateToken.mockReturnValue("valid.jwt.token");

      const result = await authService.login("123456", "000000");

      expect(authRepository.getUserByAccountNumber).toHaveBeenCalledWith("123456");
      expect(hashProvider.compare).toHaveBeenCalledWith("000000", "hashedPin");
      expect(jwtProvider.generateToken).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        user: mockUser,
        token: "valid.jwt.token",
        timeToLive: TOKEN_TTL,
      });

      expect(authRepository.setFailedAttempts).toHaveBeenCalledWith("user123", 0);
    });

    it("🚫 Should return 401 if PIN is incorrect", async () => {
      authRepository.getUserByAccountNumber.mockResolvedValue(mockUser);
      hashProvider.compare.mockResolvedValue(false);

      await expect(authService.login("123456", "wrongPin")).rejects.toThrow("Unauthorized");

      expect(authRepository.setFailedAttempts).toHaveBeenCalledWith("user123", 1);
    });

    it("🚫 Should return 403 if user is blocked", async () => {
      const blockedUser = {
        ...mockUser,
        blockedUntil: new Date(Date.now() + FIVE_MINUTES_BLOCK),
      };
      authRepository.getUserByAccountNumber.mockResolvedValue(blockedUser);

      await expect(authService.login("123456", "000000")).rejects.toThrow("User is blocked");
    });

    it("🚫 Should return 429 if too many failed attempts", async () => {
      const userWithFailedAttempts = {
        ...mockUser,
        failedAttempts: MAX_FAILED_ATTEMPTS,
      };
      authRepository.getUserByAccountNumber.mockResolvedValue(userWithFailedAttempts);

      await expect(authService.login("123456", "wrongPin")).rejects.toThrow(
        "Too many failed attempts",
      );

      expect(authRepository.setBlockedUntil).toHaveBeenCalledWith("user123", expect.any(Date));
    });

    it("✅ Should unblock user if block time has passed", async () => {
      const blockedUser = {
        ...mockUser,
        blockedUntil: new Date(Date.now() - 1),
      };
      authRepository.getUserByAccountNumber.mockResolvedValue(blockedUser);
      hashProvider.compare.mockResolvedValue(true);
      jwtProvider.generateToken.mockReturnValue("valid.jwt.token");

      const result = await authService.login("123456", "000000");

      expect(authRepository.setBlockedUntil).toHaveBeenCalledWith("user123", null);
      expect(result).toEqual({
        user: blockedUser,
        token: "valid.jwt.token",
        timeToLive: TOKEN_TTL,
      });
    });
  });

  describe("🔹 Given a user changes their PIN", () => {
    it("✅ Should update the user's PIN if the old PIN matches", async () => {
      authRepository.getUserByAccountNumber.mockResolvedValue(mockUser);
      hashProvider.compare.mockResolvedValue(true);
      hashProvider.hash.mockResolvedValue("newHashedPin");

      await authService.changePin("user123", "000000", "123456");

      expect(hashProvider.hash).toHaveBeenCalledWith("123456");
      expect(authRepository.updateUserPin).toHaveBeenCalledWith("user123", "newHashedPin");
    });

    it("🚫 Should return 401 if old PIN is incorrect", async () => {
      authRepository.getUserByAccountNumber.mockResolvedValue(mockUser);
      hashProvider.compare.mockResolvedValue(false);

      await expect(authService.changePin("user123", "wrongPin", "123456")).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("🚫 Should return 400 if new PIN is the same as old PIN", async () => {
      await expect(authService.changePin("user123", "000000", "000000")).rejects.toThrow(
        "New PIN cannot be the same as the old PIN",
      );
    });
  });
});
