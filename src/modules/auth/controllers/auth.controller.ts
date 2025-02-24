import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { AUTH_MESSAGES } from "../constants";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Handles user login.
   * @param req - Express request containing identifier and PIN.
   * @param res - Express response.
   */
  async login(req: Request, res: Response) {
    try {
      const { identifier, pin } = req.body;
      const result = await this.authService.login(identifier, pin);

      return res.status(200).json({
        user: { id: result.user.id, accountNumber: result.user.accountNumber },
        token: result.token,
        timeToLive: result.timeToLive,
      });
    } catch (error: any) {
      switch (error.message) {
        case AUTH_MESSAGES.UNAUTHORIZED:
          return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
        case AUTH_MESSAGES.USER_BLOCKED:
          return res.status(403).json({ error: AUTH_MESSAGES.USER_BLOCKED });
        case AUTH_MESSAGES.TOO_MANY_FAILED_ATTEMPTS:
          return res.status(429).json({ error: AUTH_MESSAGES.TOO_MANY_FAILED_ATTEMPTS });
        case AUTH_MESSAGES.SERVICE_UNAVAILABLE:
          return res.status(503).json({ error: AUTH_MESSAGES.SERVICE_UNAVAILABLE });
        default:
          return res.status(500).json({ error: "Something went wrong. Please try again later." });
      }
    }
  }

  /* TODO: Uncomment when full logout service is implemented in both FE and BE */
  /**
   * Handles user logout.
   * @param req - Express request containing the token.
   * @param res - Express response.
   */
  /* async logout(req: Request, res: Response) {
    try {
      const { token } = req.body;
      await this.authService.logout(token);
      return res.status(200).json({ message: "Logout successful" });
    } catch (error: any) {
      if (error.message === AUTH_MESSAGES.INVALID_TOKEN) {
        return res.status(401).json({ error: AUTH_MESSAGES.INVALID_TOKEN });
      }
      return res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
  } */

  /**
   * Handles PIN change.
   * @param req - Express request containing userId, oldPin, and newPin.
   * @param res - Express response.
   */
  async changePin(req: Request, res: Response) {
    try {
      const { userId, oldPin, newPin } = req.body;
      await this.authService.changePin(userId, oldPin, newPin);
      return res.status(200).json({ message: "PIN changed successfully" });
    } catch (error: any) {
      switch (error.message) {
        case AUTH_MESSAGES.SAME_NEW_OLD_PIN:
          return res.status(400).json({ error: AUTH_MESSAGES.SAME_NEW_OLD_PIN });
        case AUTH_MESSAGES.UNAUTHORIZED:
          return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
        default:
          return res.status(500).json({ error: "Something went wrong. Please try again later." });
      }
    }
  }
}
