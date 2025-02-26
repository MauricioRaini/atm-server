import { Request, Response } from "express";
import { jest } from "@jest/globals";
import { TRANSACTION_ERROR_MESSAGES } from "../constants";
import { TransactionService } from "../services";
import { TransactionController } from "./transactions.controller";

let req: Partial<Request>;
let res: Partial<Response>;
let jsonMock: jest.Mock;

describe("🛠 Transaction Controller", () => {
  let transactionController: TransactionController;
  let transactionService: jest.Mocked<TransactionService>;

  beforeEach(() => {
    transactionService = {
      deposit: jest.fn(),
      withdraw: jest.fn(),
      internalTransfer: jest.fn(),
      externalTransfer: jest.fn(),
    } as unknown as jest.Mocked<TransactionService>;

    transactionController = new TransactionController(transactionService);

    jsonMock = jest.fn();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jsonMock,
    } as Partial<Response>;
  });

  // -------------------------------
  // Deposit Endpoint Tests
  // -------------------------------
  describe("Deposit Endpoint", () => {
    beforeEach(() => {
      req = { body: { accountNumber: "ACC123", depositAmount: 100 } };
    });

    it("✅ Should return 200 with a success message on valid deposit", async () => {
      transactionService.deposit.mockResolvedValue();

      await transactionController.deposit(req as Request, res as Response);

      expect(transactionService.deposit).toHaveBeenCalledWith("ACC123", 100);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Deposit successful" });
    });

    it("🚫 Should return 404 if the account is not found", async () => {
      transactionService.deposit.mockRejectedValue(
        new Error(TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT),
      );

      await transactionController.deposit(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT });
    });

    it("🚫 Should return 400 for invalid deposit amount", async () => {
      req = { body: { accountNumber: "ACC123", depositAmount: -50 } };

      await transactionController.deposit(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Deposit amount must be positive" });
    });
  });

  // -------------------------------
  // Withdrawal Endpoint Tests
  // -------------------------------
  describe("Withdrawal Endpoint", () => {
    beforeEach(() => {
      req = { body: { accountId: "ACC123", cardId: "CARD1", withdrawalAmount: 100 } };
    });

    it("✅ Should return 200 with updated balances on valid withdrawal", async () => {
      transactionService.withdraw.mockResolvedValue({
        overallBalance: 400,
        cardBalance: 100,
        remainingWithdrawalLimit: 200,
      });

      await transactionController.withdraw(req as Request, res as Response);

      expect(transactionService.withdraw).toHaveBeenCalledWith("ACC123", "CARD1", 100);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        overallBalance: 400,
        cardBalance: 100,
        remainingWithdrawalLimit: 200,
      });
    });

    it("🚫 Should return 422 if insufficient funds", async () => {
      transactionService.withdraw.mockRejectedValue(
        new Error(TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS),
      );

      await transactionController.withdraw(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        error: TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS,
      });
    });

    it("🚫 Should return 400 if required parameters are missing", async () => {
      req = { body: { accountId: "ACC123" } };

      await transactionController.withdraw(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Missing required parameters" });
    });
  });

  // -------------------------------
  // Internal Transfer Endpoint Tests
  // -------------------------------
  describe("Internal Transfer Endpoint", () => {
    beforeEach(() => {
      req = {
        body: {
          accountId: "ACC123",
          senderCardId: "CARD1",
          recipientCardId: "CARD2",
          transferAmount: 50,
        },
      };
    });

    it("✅ Should return 200 with updated card balances on valid internal transfer", async () => {
      transactionService.internalTransfer.mockResolvedValue({
        senderCardBalance: 250,
        recipientCardBalance: 150,
        overallBalance: 500,
      });

      await transactionController.internalTransfer(req as Request, res as Response);

      expect(transactionService.internalTransfer).toHaveBeenCalledWith(
        "ACC123",
        "CARD1",
        "CARD2",
        50,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        senderCardBalance: 250,
        recipientCardBalance: 150,
        overallBalance: 500,
      });
    });

    it("🚫 Should return 422 if sender card has insufficient funds", async () => {
      transactionService.internalTransfer.mockRejectedValue(
        new Error(TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS),
      );

      await transactionController.internalTransfer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        error: TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS,
      });
    });

    it("🚫 Should return 400 if required parameters are missing", async () => {
      req = { body: { accountId: "ACC123", senderCardId: "CARD1" } };
      await transactionController.internalTransfer(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Missing required parameters" });
    });
  });

  // -------------------------------
  // External Transfer Endpoint Tests
  // -------------------------------
  describe("External Transfer Endpoint", () => {
    beforeEach(() => {
      req = {
        body: {
          senderAccountId: "ACC123",
          senderCardId: "CARD1",
          receiverAccountNumber: "ACC999",
          transferAmount: 100,
        },
      };
    });

    it("✅ Should return 200 with updated sender and receiver balances on valid external transfer", async () => {
      transactionService.externalTransfer.mockResolvedValue({
        sender: { overallBalance: 400, cardBalance: 100, remainingTransferLimit: 200 },
        receiver: { overallBalance: 500, cardBalance: 250 },
      });

      await transactionController.externalTransfer(req as Request, res as Response);

      expect(transactionService.externalTransfer).toHaveBeenCalledWith(
        "ACC123",
        "CARD1",
        "ACC999",
        100,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        sender: { overallBalance: 400, cardBalance: 100, remainingTransferLimit: 200 },
        receiver: { overallBalance: 500, cardBalance: 250 },
      });
    });

    it("🚫 Should return 404 if receiver account is not found", async () => {
      transactionService.externalTransfer.mockRejectedValue(
        new Error(TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT),
      );

      await transactionController.externalTransfer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT });
    });

    it("🚫 Should return 422 if sender has insufficient funds", async () => {
      transactionService.externalTransfer.mockRejectedValue(
        new Error(TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS),
      );

      await transactionController.externalTransfer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        error: TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS,
      });
    });

    it("🚫 Should return 422 if transfer exceeds daily transfer limit", async () => {
      transactionService.externalTransfer.mockRejectedValue(
        new Error(TRANSACTION_ERROR_MESSAGES.DAILY_TRANSFER_LIMIT_EXCEEDED),
      );

      await transactionController.externalTransfer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        error: TRANSACTION_ERROR_MESSAGES.DAILY_TRANSFER_LIMIT_EXCEEDED,
      });
    });

    it("🚫 Should return 400 if required parameters are missing", async () => {
      req = { body: { senderAccountId: "ACC123", senderCardId: "CARD1" } };
      await transactionController.externalTransfer(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Missing required parameters" });
    });
  });
});
