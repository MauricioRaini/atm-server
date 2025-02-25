import { AuthRepository } from "../repositories/auth.repository";
import { JwtMiddleware } from "../middlewares/jwt.middleware";
import { HashMiddleware } from "../middlewares/hash.middleware";
import {
  AUTH_MESSAGES,
  BLOCK_TIME,
  MAX_FAILED_ATTEMPTS,
  NEW_FAILED_ATTEMPT,
  TOKEN_TTL,
  USER_PUBLIC_FIELDS,
} from "../constants";
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtProvider: JwtMiddleware,
    private readonly hashProvider: HashMiddleware,
  ) {}

  /**
   * Logs in the user by verifying PIN and handling security checks.
   * @param identifier - The account number or card number.
   * @param pin - The user's PIN.
   * @returns Object containing user details, token, and TTL.
   */
  async login(identifier: string, pin: string) {
    const user = await this.authRepository.getUserByAccountNumber(identifier);

    if (!user) {
      throw new Error(AUTH_MESSAGES.UNAUTHORIZED);
    }

    if (user.blockedUntil && user.blockedUntil > new Date()) {
      throw new Error(AUTH_MESSAGES.USER_BLOCKED);
    } else if (user.blockedUntil) {
      await this.authRepository.setBlockedUntil(user.id, null);
    }

    const isPinValid = await this.hashProvider.compare(pin, user.pinHash);
    if (!isPinValid) {
      const updatedFailedAttempts = user.failedAttempts + NEW_FAILED_ATTEMPT;

      if (updatedFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const blockUntil = new Date(Date.now() + BLOCK_TIME);
        await this.authRepository.setBlockedUntil(user.id, blockUntil);
        throw new Error(AUTH_MESSAGES.TOO_MANY_FAILED_ATTEMPTS);
      }

      await this.authRepository.setFailedAttempts(user.id, updatedFailedAttempts);
      throw new Error(AUTH_MESSAGES.UNAUTHORIZED);
    }

    await this.authRepository.setFailedAttempts(user.id, 0);

    const token = this.jwtProvider.generateToken({ userId: user.id });

    const publicUser = {
      [USER_PUBLIC_FIELDS.ID]: user[USER_PUBLIC_FIELDS.ID],
      [USER_PUBLIC_FIELDS.ACCOUNT_NUMBER]: user[USER_PUBLIC_FIELDS.ACCOUNT_NUMBER],
      [USER_PUBLIC_FIELDS.FIRST_NAME]: user[USER_PUBLIC_FIELDS.FIRST_NAME],
      [USER_PUBLIC_FIELDS.LAST_NAME]: user[USER_PUBLIC_FIELDS.LAST_NAME],
      [USER_PUBLIC_FIELDS.BLOCKED_UNTIL]: user[USER_PUBLIC_FIELDS.BLOCKED_UNTIL],
    };

    return {
      user: publicUser,
      token,
      timeToLive: TOKEN_TTL,
    };
  }

  /**
   * Changes the user's PIN after verifying the old PIN.
   * @param userId - The user's ID.
   * @param oldPin - The current PIN.
   * @param newPin - The new PIN to be set.
   */
  async changePin(userId: string, oldPin: string, newPin: string) {
    if (oldPin === newPin) {
      throw new Error(AUTH_MESSAGES.SAME_NEW_OLD_PIN);
    }

    const user = await this.authRepository.getUserByAccountNumber(userId);
    if (!user) {
      throw new Error(AUTH_MESSAGES.UNAUTHORIZED);
    }

    const isOldPinValid = await this.hashProvider.compare(oldPin, user.pinHash);
    if (!isOldPinValid) {
      throw new Error(AUTH_MESSAGES.UNAUTHORIZED);
    }

    const hashedNewPin = await this.hashProvider.hash(newPin);
    await this.authRepository.updateUserPin(userId, hashedNewPin);
  }
}
