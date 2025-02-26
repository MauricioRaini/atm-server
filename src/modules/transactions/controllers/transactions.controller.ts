import { Request, Response } from "express";
import { TransactionService } from "../services/transactions.service";
import { TRANSACTION_ERROR_MESSAGES } from "../constants";

export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  async deposit(req: Request, res: Response): Promise<void> {
    try {
      const { accountNumber, depositAmount } = req.body;
      if (!accountNumber || depositAmount === undefined) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }
      if (depositAmount <= 0) {
        res.status(400).json({ error: "Deposit amount must be positive" });
        return;
      }
      await this.transactionService.deposit(accountNumber, depositAmount);
      res.status(200).json({ message: "Deposit successful" });
    } catch (error: any) {
      if (error.message === TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT) {
        res.status(404).json({ error: TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT });
      } else {
        res.status(500).json({ error: "Something went wrong. Please try again later." });
      }
    }
  }

  async withdraw(req: Request, res: Response): Promise<void> {
    try {
      const { accountId, cardId, withdrawalAmount } = req.body;
      if (!accountId || !cardId || withdrawalAmount === undefined) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }
      const result = await this.transactionService.withdraw(accountId, cardId, withdrawalAmount);
      res.status(200).json(result);
    } catch (error: any) {
      if (
        error.message === TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS ||
        error.message === TRANSACTION_ERROR_MESSAGES.DAILY_WITHDRAWAL_LIMIT_EXCEEDED
      ) {
        res.status(422).json({ error: error.message });
      } else if (error.message === "Account not found" || error.message === "Card not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Something went wrong. Please try again later." });
      }
    }
  }

  async internalTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { accountId, senderCardId, recipientCardId, transferAmount } = req.body;
      if (!accountId || !senderCardId || !recipientCardId || transferAmount === undefined) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }
      const result = await this.transactionService.internalTransfer(
        accountId,
        senderCardId,
        recipientCardId,
        transferAmount,
      );
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS) {
        res.status(422).json({ error: TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS });
      } else {
        res.status(500).json({ error: "Something went wrong. Please try again later." });
      }
    }
  }

  async externalTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { senderAccountId, senderCardId, receiverAccountNumber, transferAmount } = req.body;
      if (
        !senderAccountId ||
        !senderCardId ||
        !receiverAccountNumber ||
        transferAmount === undefined
      ) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }
      const result = await this.transactionService.externalTransfer(
        senderAccountId,
        senderCardId,
        receiverAccountNumber,
        transferAmount,
      );
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT) {
        res.status(404).json({ error: TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT });
      } else if (
        error.message === TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS ||
        error.message === TRANSACTION_ERROR_MESSAGES.DAILY_TRANSFER_LIMIT_EXCEEDED
      ) {
        res.status(422).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Something went wrong. Please try again later." });
      }
    }
  }
}
