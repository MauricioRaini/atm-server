import bcrypt from "bcrypt";

export class HashMiddleware {
  private saltRounds = 10;

  async hash(pin: string): Promise<string> {
    return bcrypt.hash(pin, this.saltRounds);
  }

  async compare(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }
}
