import { prisma } from "../src/config/prisma";
import { beforeAll, afterAll } from "@jest/globals";

beforeAll(async () => {
  await prisma.user.deleteMany(); // Ensure clean start

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
  await prisma.user.deleteMany();
});
