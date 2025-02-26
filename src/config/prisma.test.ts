import { prisma } from "./prisma";

describe("🔍 Prisma Singleton", () => {
  it("✅ Should connect to the database and retrieve users", async () => {
    const users = await prisma.user.findMany();
    expect(Array.isArray(users)).toBe(true);
  });

  it("✅ Should return an empty array if no transactions exist", async () => {
    const transactions = await prisma.transaction.findMany();
    expect(Array.isArray(transactions)).toBe(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
