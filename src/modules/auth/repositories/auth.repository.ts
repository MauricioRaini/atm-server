import { prisma } from "@/config/prisma";
import { User } from "@prisma/client";

export class AuthRepository {
  /**
   * Retrieves a user by their account number.
   * @param accountNumber - The user's account number.
   * @returns User object or null if not found.
   */
  async getUserByAccountNumber(accountNumber: string) {
    return prisma.user.findUnique({
      where: { accountNumber },
    });
  }

  /**
   * Retrieves a user by their card number.
   * @param cardNumber - The card number associated with the user.
   * @returns User object or null if not found.
   */
  async getUserByCardNumber(cardNumber: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        account: {
          cards: { some: { number: cardNumber } },
        },
      },
      include: { account: { include: { cards: true } } },
    });
  }

  /**
   * Updates the failed login attempts count for a user.
   * @param userId - The user's ID.
   * @param attempts - The number of failed attempts.
   */
  async setFailedAttempts(userId: string, attempts: number) {
    await prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: attempts },
    });
  }

  /**
   * Blocks a user by setting a blockedUntil timestamp.
   * @param userId - The user's ID.
   * @param blockedUntil - The timestamp until the user is blocked (or null to unblock).
   */
  async setBlockedUntil(userId: string, blockedUntil: Date | null) {
    await prisma.user.update({
      where: { id: userId },
      data: { blockedUntil },
    });
  }

  /**
   * Updates the user's PIN hash.
   * @param userId - The user's ID.
   * @param newPinHash - The new hashed PIN.
   */
  async updateUserPin(userId: string, newPinHash: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash: newPinHash },
    });
  }
}
