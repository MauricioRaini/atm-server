import { prisma } from "../config/prisma";
import { beforeAll, afterAll } from "@jest/globals";

beforeAll(async () => {
  await prisma.user.deleteMany({
    where: { accountNumber: "TEST12" },
  });
  await prisma.user.create({
    data: {
      id: "test-user-123",
      accountNumber: "TEST12",
      firstName: "Test",
      lastName: "User",
      email: "test.user@example.com",
      pinHash: "hashedPin",
      failedAttempts: 0,
      blockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { accountNumber: "TEST12" },
  });
});

describe("Prisma Setup", () => {
  it("should do something minimal", () => {
    expect(true).toBe(true);
  });
});
