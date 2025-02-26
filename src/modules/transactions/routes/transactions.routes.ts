import { Router } from "express";
import { TransactionController } from "../controllers/transactions.controller";
import { TransactionService } from "../services/transactions.service";
import { TransactionRepository } from "../repositories/transactions.repository";

const transactionRoutes = Router();

const transactionRepository = new TransactionRepository();
const transactionService = new TransactionService(transactionRepository);
const transactionController = new TransactionController(transactionService);

transactionRoutes.post("/deposit", (req, res) => transactionController.deposit(req, res));
transactionRoutes.post("/withdraw", (req, res) => transactionController.withdraw(req, res));
transactionRoutes.post("/internal-transfer", (req, res) =>
  transactionController.internalTransfer(req, res),
);
transactionRoutes.post("/external-transfer", (req, res) =>
  transactionController.externalTransfer(req, res),
);

export { transactionRoutes };
