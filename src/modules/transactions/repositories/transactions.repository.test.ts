import { prisma } from "@/config/prisma";
import { Account, Card } from "@prisma/client";
import { TransactionRepository } from "./transactions.repository";
import { Decimal } from "@prisma/client/runtime/library";

jest.mock("@/config/prisma", () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    card: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("🛠 Transaction Repository", () => {
  let transactionRepository: TransactionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionRepository = new TransactionRepository();
  });

  describe("getAccountByNumber", () => {
    it("✅ Should return account data when found", async () => {
      const accountData: Account & {
        withdrawalDailyLimit: Decimal;
        transferDailyLimit: Decimal;
        defaultCard: string;
      } = {
        overallBalance: new Decimal(500),
        withdrawalDailyLimit: new Decimal(300),
        transferDailyLimit: new Decimal(300),
        defaultCard: "CARD1",
        id: "ACC123",
        userId: "USER123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma to return the account with a nested user field
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({
        ...accountData,
        user: { accountNumber: "ACC123" },
      });

      const result = await transactionRepository.getAccountByNumber("ACC123");

      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { user: { accountNumber: "ACC123" } },
        include: { user: { select: { accountNumber: true } } },
      });
      expect(result).toEqual({
        ...accountData,
        accountNumber: "ACC123",
        overallBalance: 500,
        withdrawalDailyLimit: 300,
        transferDailyLimit: 300,
      });
    });

    it("🚫 Should return null if account is not found", async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await transactionRepository.getAccountByNumber("NON_EXISTENT");

      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { user: { accountNumber: "NON_EXISTENT" } },
        include: { user: { select: { accountNumber: true } } },
      });
      expect(result).toBeNull();
    });

    it("🚫 Should propagate error if DB fails", async () => {
      (prisma.account.findFirst as jest.Mock).mockRejectedValue(new Error("DB error"));

      await expect(transactionRepository.getAccountByNumber("ACC123")).rejects.toThrow("DB error");
    });
  });

  describe("getAccountById", () => {
    it("✅ Should return account data when found", async () => {
      const accountData: Account = {
        id: "ACC123",
        userId: "USER123",
        overallBalance: new Decimal(500),
        withdrawalDailyLimit: new Decimal(300),
        transferDailyLimit: new Decimal(300),
        defaultCard: "CARD1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(accountData);

      const result = await transactionRepository.getAccountById("ACC123");

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: "ACC123" },
      });
      expect(result).toEqual(accountData);
    });

    it("🚫 Should return null if no account found", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await transactionRepository.getAccountById("NON_EXISTENT");
      expect(result).toBeNull();
    });

    it("🚫 Should propagate errors", async () => {
      (prisma.account.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));
      await expect(transactionRepository.getAccountById("ACC123")).rejects.toThrow("DB error");
    });
  });

  describe("getCardById", () => {
    it("✅ Should return card data when found", async () => {
      const cardData: Card = {
        id: "CARD1",
        accountId: "ACC123",
        number: "4111111111111111",
        brand: "Visa",
        expiry: new Date("2027-12-31"),
        cvvHash: 123,
        balance: new Decimal(200),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(cardData);

      const result = await transactionRepository.getCardById("CARD1");

      expect(prisma.card.findUnique).toHaveBeenCalledWith({
        where: { id: "CARD1" },
      });
      expect(result).toEqual(cardData);
    });

    it("🚫 Should return null if card is not found", async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await transactionRepository.getCardById("NON_EXISTENT");
      expect(result).toBeNull();
    });

    it("🚫 Should propagate errors", async () => {
      (prisma.card.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));
      await expect(transactionRepository.getCardById("CARD1")).rejects.toThrow("DB error");
    });
  });

  describe("depositToAccount", () => {
    it("✅ Should update the account's overall balance successfully", async () => {
      // Mock getAccountByNumber call by having prisma.account.findFirst return a valid account.
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({
        id: "ACC123",
        userId: "USER123",
        overallBalance: new Decimal(500),
        withdrawalDailyLimit: new Decimal(300),
        transferDailyLimit: new Decimal(300),
        defaultCard: "CARD1",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { accountNumber: "ACC123" },
      });
      (prisma.account.update as jest.Mock).mockResolvedValue(undefined);
      await expect(transactionRepository.depositToAccount("ACC123", 100)).resolves.toBeUndefined();
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: "ACC123" },
        data: { overallBalance: { increment: 100 } },
      });
    });

    it("🚫 Should propagate error if update fails", async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({
        id: "ACC123",
        userId: "USER123",
        overallBalance: new Decimal(500),
        withdrawalDailyLimit: new Decimal(300),
        transferDailyLimit: new Decimal(300),
        defaultCard: "CARD1",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { accountNumber: "ACC123" },
      });
      (prisma.account.update as jest.Mock).mockRejectedValue(new Error("Update error"));
      await expect(transactionRepository.depositToAccount("ACC123", 100)).rejects.toThrow(
        "Update error",
      );
    });
  });

  describe("updateCardBalance", () => {
    it("✅ Should update the card's balance successfully", async () => {
      (prisma.card.update as jest.Mock).mockResolvedValue(undefined);
      await expect(transactionRepository.updateCardBalance("CARD1", 300)).resolves.toBeUndefined();
      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: "CARD1" },
        data: { balance: 300 },
      });
    });

    it("🚫 Should propagate error on failure", async () => {
      (prisma.card.update as jest.Mock).mockRejectedValue(new Error("Update error"));
      await expect(transactionRepository.updateCardBalance("CARD1", 300)).rejects.toThrow(
        "Update error",
      );
    });
  });

  describe("updateAccountBalance", () => {
    it("✅ Should update the account's overall balance successfully", async () => {
      (prisma.account.update as jest.Mock).mockResolvedValue(undefined);
      await expect(
        transactionRepository.updateAccountBalance("ACC123", 400),
      ).resolves.toBeUndefined();
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: "ACC123" },
        data: { overallBalance: 400 },
      });
    });

    it("🚫 Should propagate error on failure", async () => {
      (prisma.account.update as jest.Mock).mockRejectedValue(new Error("Update error"));
      await expect(transactionRepository.updateAccountBalance("ACC123", 400)).rejects.toThrow(
        "Update error",
      );
    });
  });

  describe("withdrawFromCard", () => {
    it("✅ Should subtract the specified amount from the card's balance", async () => {
      (prisma.card.update as jest.Mock).mockResolvedValue(undefined);
      await expect(transactionRepository.withdrawFromCard("CARD1", 50)).resolves.toBeUndefined();
      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: "CARD1" },
        data: { balance: { decrement: 50 } },
      });
    });

    it("🚫 Should propagate error on failure", async () => {
      (prisma.card.update as jest.Mock).mockRejectedValue(new Error("Withdrawal error"));
      await expect(transactionRepository.withdrawFromCard("CARD1", 50)).rejects.toThrow(
        "Withdrawal error",
      );
    });
  });
});
