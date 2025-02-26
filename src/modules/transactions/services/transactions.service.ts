import { TRANSACTION_ERROR_MESSAGES } from "../constants";
import { TransactionRepository } from "../repositories";

export class TransactionService {
  constructor(private transactionRepository: TransactionRepository) {}

  async deposit(accountNumber: string, depositAmount: number): Promise<void> {
    if (depositAmount <= 0) {
      throw new Error("Deposit amount must be positive");
    }
    const account = await this.transactionRepository.getAccountByNumber(accountNumber);
    if (!account) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT);
    }
    await this.transactionRepository.depositToAccount(accountNumber, depositAmount);
    await this.transactionRepository.updateCardBalance(account.defaultCard, depositAmount);
    return;
  }

  async withdraw(
    accountId: string,
    cardId: string,
    withdrawalAmount: number,
  ): Promise<{ overallBalance: number; cardBalance: number; remainingWithdrawalLimit: number }> {
    if (withdrawalAmount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }
    const card = await this.transactionRepository.getCardById(cardId);
    if (!card) {
      throw new Error("Card not found");
    }
    const account = await this.transactionRepository.getAccountById(accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    if (card.balance.toNumber() < withdrawalAmount) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }
    if (withdrawalAmount > account.withdrawalDailyLimit.toNumber()) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.DAILY_WITHDRAWAL_LIMIT_EXCEEDED);
    }
    await this.transactionRepository.withdrawFromCard(cardId, withdrawalAmount);
    const newCardBalance = card.balance.toNumber() - withdrawalAmount;
    const newOverallBalance = account.overallBalance.toNumber() - withdrawalAmount;
    await this.transactionRepository.updateAccountBalance(accountId, newOverallBalance);
    const remainingWithdrawalLimit = account.withdrawalDailyLimit.toNumber() - withdrawalAmount;
    return {
      overallBalance: newOverallBalance,
      cardBalance: newCardBalance,
      remainingWithdrawalLimit,
    };
  }

  async internalTransfer(
    accountId: string,
    senderCardId: string,
    recipientCardId: string,
    transferAmount: number,
  ): Promise<{ senderCardBalance: number; recipientCardBalance: number; overallBalance: number }> {
    if (transferAmount <= 0) {
      throw new Error("Transfer amount must be positive");
    }
    const senderCard = await this.transactionRepository.getCardById(senderCardId);
    if (!senderCard) {
      throw new Error("Sender card not found");
    }
    const recipientCard = await this.transactionRepository.getCardById(recipientCardId);
    if (!recipientCard) {
      throw new Error("Recipient card not found");
    }
    if (senderCard.balance.toNumber() < transferAmount) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }
    const newSenderBalance = senderCard.balance.toNumber() - transferAmount;
    const newRecipientBalance = recipientCard.balance.toNumber() + transferAmount;
    await this.transactionRepository.updateCardBalance(senderCardId, newSenderBalance);
    await this.transactionRepository.updateCardBalance(recipientCardId, newRecipientBalance);
    let overallBalance = 0;
    try {
      const account = await this.transactionRepository.getAccountById(accountId);
      overallBalance = account ? account.overallBalance.toNumber() : 0;
    } catch (e) {
      overallBalance = 0;
    }
    return {
      senderCardBalance: newSenderBalance,
      recipientCardBalance: newRecipientBalance,
      overallBalance,
    };
  }

  async externalTransfer(
    senderAccountId: string,
    senderCardId: string,
    receiverAccountNumber: string,
    transferAmount: number,
  ): Promise<{
    sender: { overallBalance: number; cardBalance: number; remainingTransferLimit: number };
    receiver: { overallBalance: number; cardBalance: number };
  }> {
    if (transferAmount <= 0) {
      throw new Error("Transfer amount must be positive");
    }
    const senderCard = await this.transactionRepository.getCardById(senderCardId);
    if (!senderCard) {
      throw new Error("Sender card not found");
    }
    const senderAccount = await this.transactionRepository.getAccountById(senderAccountId);
    if (!senderAccount) {
      throw new Error("Sender account not found");
    }
    if (senderCard.balance.toNumber() < transferAmount) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }
    if (transferAmount > senderAccount.transferDailyLimit.toNumber()) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.DAILY_TRANSFER_LIMIT_EXCEEDED);
    }
    const receiverAccount =
      await this.transactionRepository.getAccountByNumber(receiverAccountNumber);
    if (!receiverAccount) {
      throw new Error(TRANSACTION_ERROR_MESSAGES.INVALID_ACCOUNT);
    }
    const receiverCardId = receiverAccount.defaultCard;
    const receiverCard = await this.transactionRepository.getCardById(receiverCardId);
    if (!receiverCard) {
      throw new Error("Receiver card not found");
    }
    await this.transactionRepository.withdrawFromCard(senderCardId, transferAmount);
    const newSenderCardBalance = senderCard.balance.toNumber() - transferAmount;
    const newSenderOverallBalance = senderAccount.overallBalance.toNumber() - transferAmount;
    await this.transactionRepository.updateAccountBalance(senderAccountId, newSenderOverallBalance);
    await this.transactionRepository.updateCardBalance(senderCardId, newSenderCardBalance);
    const newReceiverCardBalance = receiverCard.balance.toNumber() + transferAmount;
    await this.transactionRepository.updateCardBalance(receiverCardId, newReceiverCardBalance);
    const newReceiverOverallBalance = receiverAccount.overallBalance + transferAmount;
    return {
      sender: {
        overallBalance: newSenderOverallBalance,
        cardBalance: newSenderCardBalance,
        remainingTransferLimit: senderAccount.transferDailyLimit.toNumber() - transferAmount,
      },
      receiver: {
        overallBalance: newReceiverOverallBalance,
        cardBalance: newReceiverCardBalance,
      },
    };
  }
}
