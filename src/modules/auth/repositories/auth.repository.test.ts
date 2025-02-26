import { prisma } from "@/config/prisma";
import { AuthRepository } from "./auth.repository";
import { User } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockUser: User = {
  id: "user123",
  accountNumber: "123456",
  firstName: "Peter",
  lastName: "Parker",
  email: "peter.parker@example.com",
  pinHash: "hashedPin",
  failedAttempts: 0,
  blockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as User;

describe("🛠 Auth Repository", () => {
  let authRepository: AuthRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    authRepository = new AuthRepository();
  });

  describe("🔹 Given a user logs in", () => {
    it("✅ Should fetch a user by account number", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const user = await authRepository.getUserByAccountNumber("123456");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { accountNumber: "123456" },
      });
      expect(user).toEqual(mockUser);
    });

    it("✅ Should return null if no user is found by account number", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const user = await authRepository.getUserByAccountNumber("999999");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { accountNumber: "999999" },
      });
      expect(user).toBeNull();
    });

    it("✅ Should update failed attempts count", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        failedAttempts: 2,
      });

      await authRepository.setFailedAttempts("user123", 2);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user123" },
        data: { failedAttempts: 2 },
      });
    });

    it("✅ Should update blockedUntil timestamp", async () => {
      const blockedUntil = new Date(Date.now() + 5 * 60 * 1000);

      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        blockedUntil,
      });

      await authRepository.setBlockedUntil("user123", blockedUntil);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user123" },
        data: { blockedUntil },
      });
    });
  });
});
