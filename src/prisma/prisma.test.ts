import { prisma } from "../config/prisma";
import { beforeAll, afterAll } from "@jest/globals";

beforeAll(async () => {
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      id: "user123",
      accountNumber: "123456",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      pinHash: "hashedPin",
      failedAttempts: 0,
      blockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
});

afterAll(async () => {
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
});

describe("Prisma Setup", () => {
  it("should do something minimal", () => {
    expect(true).toBe(true);
  });
});
