import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { generateToken, verifyToken, authenticateJWT } from "./jwt.middleware";

process.env.JWT_SECRET = "test_secret";

describe("🛠 JWT Middleware", () => {
  describe("generateToken", () => {
    it("✅ Should generate a valid JWT token for a given payload", () => {
      const payload = { userId: "user123" };
      const token = generateToken(payload);

      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      expect(decoded).toMatchObject(payload);
    });
  });

  describe("verifyToken", () => {
    it("✅ Should return the decoded payload for a valid token", () => {
      const payload = { userId: "user123" };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });

      const result = verifyToken(token);
      expect(result).toMatchObject(payload);
    });

    it("🚫 Should throw an error for an invalid token", () => {
      const invalidToken = "invalid.token.value";
      expect(() => verifyToken(invalidToken)).toThrow();
    });
  });

  describe("authenticateJWT", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = { headers: {} };
      jsonMock = jest.fn();
      res = {
        status: jest.fn().mockReturnThis(),
        json: jsonMock,
      } as Partial<Response>;
      next = jest.fn();
    });

    it("🚫 Should return 401 if authorization header is missing", () => {
      authenticateJWT(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Unauthorized - No Token Provided" });
      expect(next).not.toHaveBeenCalled();
    });

    it("🚫 Should return 401 if authorization header does not start with 'Bearer '", () => {
      req.headers = { authorization: "Basic someToken" };

      authenticateJWT(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Unauthorized - No Token Provided" });
      expect(next).not.toHaveBeenCalled();
    });

    it("🚫 Should return 403 if token is invalid", () => {
      req.headers = { authorization: "Bearer invalid.token.value" };

      authenticateJWT(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Forbidden - Invalid Token" });
      expect(next).not.toHaveBeenCalled();
    });

    it("✅ Should call next() if token is valid", () => {
      const payload = { userId: "user123" };
      const validToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });
      req.headers = { authorization: `Bearer ${validToken}` };

      authenticateJWT(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toMatchObject(payload);
    });
  });
});
