import jwt, { Secret } from "jsonwebtoken";

export class JwtMiddleware {
  private secret: Secret = process.env.JWT_SECRET || "default_secret";
  private expiresIn: string = "15m";

  generateToken(payload: object): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verifyToken(token: string): any {
    return jwt.verify(token, this.secret);
  }
}
