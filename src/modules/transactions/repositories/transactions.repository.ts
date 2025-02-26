import { prisma } from "@/config/prisma";
import { Account, Card } from "@prisma/client";

export class TransactionRepository {
  async getAccountByNumber(accountNumber: string): Promise<
    | (Omit<Account, "overallBalance" | "withdrawalDailyLimit" | "transferDailyLimit"> & {
        overallBalance: number;
        withdrawalDailyLimit: number;
        transferDailyLimit: number;
        defaultCard: string;
        accountNumber: string;
      })
    | null
  > {
    const account = await prisma.account.findFirst({
      where: {
        user: { accountNumber },
      },
      include: {
        user: { select: { accountNumber: true } },
      },
    });
    if (!account) return null;
    const { user, ...rest } = account;
    return {
      ...rest,
      accountNumber: user.accountNumber,
      overallBalance: rest.overallBalance.toNumber(),
      withdrawalDailyLimit: rest.withdrawalDailyLimit.toNumber(),
      transferDailyLimit: rest.transferDailyLimit.toNumber(),
    };
  }

  async getAccountById(accountId: string): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { id: accountId },
    });
  }

  async getCardById(cardId: string): Promise<Card | null> {
    return prisma.card.findUnique({
      where: { id: cardId },
    });
  }

  async depositToAccount(accountNumber: string, depositAmount: number): Promise<void> {
    // Retrieve the account using the flattened accountNumber.
    const account = await this.getAccountByNumber(accountNumber);
    if (!account) {
      throw new Error("Account not found");
    }
    await prisma.account.update({
      where: { id: account.id },
      data: { overallBalance: { increment: depositAmount } },
    });
  }

  async updateCardBalance(cardId: string, newBalance: number): Promise<void> {
    await prisma.card.update({
      where: { id: cardId },
      data: { balance: newBalance },
    });
  }

  async updateAccountBalance(accountId: string, newOverallBalance: number): Promise<void> {
    await prisma.account.update({
      where: { id: accountId },
      data: { overallBalance: newOverallBalance },
    });
  }

  async withdrawFromCard(cardId: string, amount: number): Promise<void> {
    await prisma.card.update({
      where: { id: cardId },
      data: { balance: { decrement: amount } },
    });
  }
}
