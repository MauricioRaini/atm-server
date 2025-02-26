import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";

const secret: Secret = process.env.JWT_SECRET || "default_secret";
const expiresIn: string = "15m";

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, secret);
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - No Token Provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Forbidden - Invalid Token" });
  }
};
