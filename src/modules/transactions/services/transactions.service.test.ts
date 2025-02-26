import { jest } from "@jest/globals";
import { TRANSACTION_ERROR_MESSAGES } from "../constants";
import { TransactionService } from "./transactions.service";

import { CardBrand } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { TransactionRepository } from "../repositories";

const mockReceiverConvertedAccount = {
  id: "ACC123",
  userId: "USER123",
  overallBalance: 500,
  withdrawalDailyLimit: 300,
  transferDailyLimit: 300,
  defaultCard: "CARD1",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  accountNumber: "ACC123",
};

const mockSenderAccount = {
  id: "ACC123",
  userId: "USER123",
  overallBalance: new Decimal(500),
  withdrawalDailyLimit: new Decimal(300),
  transferDailyLimit: new Decimal(300),
  defaultCard: "CARD1",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const mockExternalReceiverConvertedAccount = {
  id: "ACC999",
  userId: "USER999",
  overallBalance: 400,
  withdrawalDailyLimit: 300,
  transferDailyLimit: 300,
  defaultCard: "CARD9",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  accountNumber: "ACC999",
};

const mockCard1 = {
  id: "CARD1",
  accountId: "ACC123",
  number: "4111111111111111",
  brand: CardBrand.Visa,
  expiry: new Date("2027-12-31"),
  cvvHash: 123,
  balance: new Decimal(200),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const mockCard2 = {
  id: "CARD2",
  accountId: "ACC123",
  number: "5500000000000004",
  brand: CardBrand.MasterCard,
  expiry: new Date("2026-11-30"),
  cvvHash: 456,
  balance: new Decimal(100),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const mockReceiverCard = {
  id: "CARD9",
  accountId: "ACC999",
  number: "6011000990139424",
  brand: CardBrand.Maestro,
  expiry: new Date("2028-10-31"),
  cvvHash: 789,
  balance: new Decimal(150),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

describe("🛠 Transaction Service", () => {
  let transactionService: TransactionService;
  let transactionRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    transactionRepository = {
      getAccountByNumber: jest.fn(),
      getAccountById: jest.fn(),
      getCardById: jest.fn(),
      depositToAccount: jest.fn(),
      updateCardBalance: jest.fn(),
      updateAccountBalance: jest.fn(),
      withdrawFromCard: jest.fn(),
    } as unknown as jest.Mocked<TransactionRepository>;

    transactionService = new TransactionService(transactionRepository);
  });

  describe("🔹 Given a deposit transaction", () => {
    it("✅ Should complete a deposit successfully (returning no DB info) when valid", async () => {
      const accountNumber = "ACC123";
      const depositAmount = 100;
      transactionRepository.getAccountByNumber.mockResolvedValue(mockReceiverConvertedAccount);
      transactionRepository.depositToAccount.mockResolvedValue();
      transactionRepository.updateCardBalance.mockResolvedValue();

      const result = await transactionService.deposit(accountNumber, depositAmount);

      expect(transactionRepository.getAccountByNumber).toHaveBeenCalledWith(accountNumber);
      expect(transactionRepository.depositToAccount).toHaveBeenCalledWith(
        accountNumber,
        depositAmount,
      );
      expect(result).toBeUndefined();
    });

    it("🚫 Should throw InvalidAccountError if receiver account does not exist", async () => {
      transactionRepository.getAccountByNumber.mockResolvedValue(null);
      await expect(transactionService.deposit("NON_EXISTENT", 100)).rejects.toThrow(
        TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT,
      );
    });
  });

  describe("🔹 Given a withdrawal transaction", () => {
    it("✅ Should complete a withdrawal successfully and return updated balances", async () => {
      const accountId = "ACC123";
      const cardId = "CARD1";
      const withdrawalAmount = 100;
      const account = { ...mockSenderAccount, id: accountId };
      const card = { ...mockCard1 };
      transactionRepository.getCardById.mockResolvedValue(card);
      transactionRepository.getAccountById.mockResolvedValue(account);
      transactionRepository.withdrawFromCard.mockResolvedValue();
      transactionRepository.updateAccountBalance.mockResolvedValue();

      const result = await transactionService.withdraw(accountId, cardId, withdrawalAmount);

      expect(transactionRepository.getCardById).toHaveBeenCalledWith(cardId);
      expect(transactionRepository.getAccountById).toHaveBeenCalledWith(accountId);
      expect(transactionRepository.withdrawFromCard).toHaveBeenCalledWith(cardId, withdrawalAmount);
      expect(transactionRepository.updateAccountBalance).toHaveBeenCalledWith(
        accountId,
        account.overallBalance.toNumber() - withdrawalAmount,
      );
      expect(result).toEqual({
        overallBalance: account.overallBalance.toNumber() - withdrawalAmount,
        cardBalance: card.balance.toNumber() - withdrawalAmount,
        remainingWithdrawalLimit: account.withdrawalDailyLimit.toNumber() - withdrawalAmount,
      });
    });

    it("🚫 Should throw an error if withdrawal amount exceeds card balance", async () => {
      const card = { ...mockCard1, balance: new Decimal(50) };
      const account = { ...mockSenderAccount, id: "ACC123" };
      transactionRepository.getCardById.mockResolvedValue(card);
      transactionRepository.getAccountById.mockResolvedValue(account);
      await expect(transactionService.withdraw("ACC123", "CARD1", 100)).rejects.toThrow(
        TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS,
      );
    });

    it("🚫 Should throw an error if withdrawal exceeds daily limit", async () => {
      const account = {
        ...mockSenderAccount,
        id: "ACC123",
        withdrawalDailyLimit: new Decimal(100),
      };
      const card = { ...mockCard1, balance: new Decimal(500) };
      transactionRepository.getCardById.mockResolvedValue(card);
      transactionRepository.getAccountById.mockResolvedValue(account);
      await expect(transactionService.withdraw("ACC123", "CARD1", 150)).rejects.toThrow(
        TRANSACTION_ERROR_MESSAGES.DAILY_WITHDRAWAL_LIMIT_EXCEEDED,
      );
    });
  });

  describe("🔹 Given an internal transfer transaction", () => {
    it("✅ Should complete an internal transfer successfully and return updated card balances", async () => {
      const accountId = "ACC123";
      const senderCardId = "CARD1";
      const recipientCardId = "CARD2";
      const transferAmount = 50;
      const senderCard = { ...mockCard1, balance: new Decimal(300) };
      const recipientCard = { ...mockCard2, balance: new Decimal(100) };

      transactionRepository.getCardById.mockImplementation((cardId: string) => {
        if (cardId === senderCardId) return Promise.resolve(senderCard);
        if (cardId === recipientCardId) return Promise.resolve(recipientCard);
        return Promise.resolve(null);
      });
      transactionRepository.updateCardBalance.mockResolvedValue();

      const result = await transactionService.internalTransfer(
        accountId,
        senderCardId,
        recipientCardId,
        transferAmount,
      );

      expect(transactionRepository.getCardById).toHaveBeenCalledWith(senderCardId);
      expect(transactionRepository.getCardById).toHaveBeenCalledWith(recipientCardId);
      expect(transactionRepository.updateCardBalance).toHaveBeenCalledWith(
        senderCardId,
        senderCard.balance.toNumber() - transferAmount,
      );
      expect(transactionRepository.updateCardBalance).toHaveBeenCalledWith(
        recipientCardId,
        recipientCard.balance.toNumber() + transferAmount,
      );
      expect(result).toEqual({
        senderCardBalance: senderCard.balance.toNumber() - transferAmount,
        recipientCardBalance: recipientCard.balance.toNumber() + transferAmount,
        overallBalance: expect.any(Number),
      });
    });

    it("🚫 Should throw an error if sender card has insufficient funds", async () => {
      const senderCard = { ...mockCard1, balance: new Decimal(30) };
      const recipientCard = { ...mockCard2, balance: new Decimal(100) };
      transactionRepository.getCardById.mockImplementation((cardId: string) => {
        if (cardId === "CARD1") return Promise.resolve(senderCard);
        if (cardId === "CARD2") return Promise.resolve(recipientCard);
        return Promise.resolve(null);
      });
      await expect(
        transactionService.internalTransfer("ACC123", "CARD1", "CARD2", 50),
      ).rejects.toThrow(TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    });
  });

  describe("🔹 Given an external transfer transaction", () => {
    it("✅ Should complete an external transfer successfully and return updated balances", async () => {
      const senderAccount = { ...mockSenderAccount, id: "ACC123" };
      const senderCard = { ...mockCard1, balance: new Decimal(200) };
      const receiverAccount = { ...mockExternalReceiverConvertedAccount };
      const receiverCard = { ...mockReceiverCard };
      const transferAmount = 100;

      transactionRepository.getCardById.mockImplementation((cardId: string) => {
        if (cardId === "CARD1") return Promise.resolve(senderCard);
        if (cardId === "CARD9") return Promise.resolve(receiverCard);
        return Promise.resolve(null);
      });
      transactionRepository.getAccountById.mockResolvedValue(senderAccount);
      transactionRepository.getAccountByNumber.mockResolvedValue(receiverAccount);
      transactionRepository.withdrawFromCard.mockResolvedValue();
      transactionRepository.updateAccountBalance.mockResolvedValue();
      transactionRepository.updateCardBalance.mockResolvedValue();

      const result = await transactionService.externalTransfer(
        "ACC123",
        "CARD1",
        "ACC999",
        transferAmount,
      );

      expect(transactionRepository.getCardById).toHaveBeenCalledWith("CARD1");
      expect(transactionRepository.getAccountById).toHaveBeenCalledWith("ACC123");
      expect(transactionRepository.getAccountByNumber).toHaveBeenCalledWith("ACC999");
      expect(transactionRepository.withdrawFromCard).toHaveBeenCalledWith("CARD1", transferAmount);
      expect(transactionRepository.updateAccountBalance).toHaveBeenCalledWith(
        "ACC123",
        senderAccount.overallBalance.toNumber() - transferAmount,
      );
      expect(transactionRepository.updateCardBalance).toHaveBeenCalledWith(
        "CARD1",
        senderCard.balance.toNumber() - transferAmount,
      );
      expect(transactionRepository.updateCardBalance).toHaveBeenCalledWith(
        "CARD9",
        receiverCard.balance.toNumber() + transferAmount,
      );
      expect(result).toEqual({
        sender: {
          overallBalance: senderAccount.overallBalance.toNumber() - transferAmount,
          cardBalance: senderCard.balance.toNumber() - transferAmount,
          remainingTransferLimit: senderAccount.transferDailyLimit.toNumber() - transferAmount,
        },
        receiver: {
          overallBalance: receiverAccount.overallBalance + transferAmount,
          cardBalance: receiverCard.balance.toNumber() + transferAmount,
        },
      });
    });

    it("🚫 Should throw InvalidAccountError if receiver account does not exist", async () => {
      const senderCard = { ...mockCard1, balance: new Decimal(200) };
      const senderAccount = { ...mockSenderAccount, id: "ACC123" };
      transactionRepository.getCardById.mockResolvedValue(senderCard);
      transactionRepository.getAccountById.mockResolvedValue(senderAccount);
      transactionRepository.getAccountByNumber.mockResolvedValue(null);

      await expect(
        transactionService.externalTransfer("ACC123", "CARD1", "NON_EXISTENT", 100),
      ).rejects.toThrow(TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT);
    });

    it("🚫 Should throw an error if transfer amount exceeds sender card funds", async () => {
      const senderCard = { ...mockCard1, balance: new Decimal(50) };
      const senderAccount = { ...mockSenderAccount, id: "ACC123" };
      const receiverAccount = { ...mockExternalReceiverConvertedAccount };
      transactionRepository.getCardById.mockResolvedValue(senderCard);
      transactionRepository.getAccountById.mockResolvedValue(senderAccount);
      transactionRepository.getAccountByNumber.mockResolvedValue(receiverAccount);

      await expect(
        transactionService.externalTransfer("ACC123", "CARD1", "ACC999", 100),
      ).rejects.toThrow(TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    });

    it("🚫 Should throw an error if transfer exceeds daily transfer limit", async () => {
      const senderAccount = {
        ...mockSenderAccount,
        id: "ACC123",
        transferDailyLimit: new Decimal(50),
      };
      const senderCard = { ...mockCard1, balance: new Decimal(200) };
      const receiverAccount = { ...mockExternalReceiverConvertedAccount };
      const receiverCard = { ...mockReceiverCard };
      transactionRepository.getCardById.mockImplementation((cardId: string) => {
        if (cardId === "CARD1") return Promise.resolve(senderCard);
        if (cardId === "CARD9") return Promise.resolve(receiverCard);
        return Promise.resolve(null);
      });
      transactionRepository.getAccountById.mockResolvedValue(senderAccount);
      transactionRepository.getAccountByNumber.mockResolvedValue(receiverAccount);

      await expect(
        transactionService.externalTransfer("ACC123", "CARD1", "ACC999", 100),
      ).rejects.toThrow(TRANSACTION_ERROR_MESSAGES.DAILY_TRANSFER_LIMIT_EXCEEDED);
    });
  });
});
