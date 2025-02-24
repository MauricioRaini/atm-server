import { User } from "@prisma/client";

export const mockUser: User = {
  id: "user123",
  firstName: "John",
  lastName: "Doe",
  email: "testEmail@test.com",
  accountNumber: "123456",
  pinHash: "hashedPin",
  failedAttempts: 0,
  blockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
