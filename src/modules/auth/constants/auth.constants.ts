export const MAX_FAILED_ATTEMPTS = 3;
export const ACCOUNT_LOCK_TIME = 5 * 60 * 1000;
export const TOKEN_TTL = 5 * 60;
export const BLOCK_TIME = 5 * 60;
export const FIVE_MINUTES_BLOCK = 300000;
export const NEW_FAILED_ATTEMPT = 1;

export const AUTH_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  USER_BLOCKED: "User is blocked",
  TOO_MANY_FAILED_ATTEMPTS: "Too many failed attempts",
  SAME_NEW_OLD_PIN: "New PIN cannot be the same as the old PIN",
};
