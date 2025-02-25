import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const defaultPinHash = hashSync("0000", 10);

  const users = await prisma.user.createMany({
    data: [
      {
        id: "c1f89e00-1a2b-4567-8901-abcdef123456",
        accountNumber: "123456",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@email.com",
        pinHash: defaultPinHash,
      },
      {
        id: "b2d47f00-5c2e-7890-1234-abcdef654321",
        accountNumber: "654321",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@email.com",
        pinHash: defaultPinHash,
      },
    ],
  });

  console.log("✅ Users created!");

  const accounts = await prisma.account.createMany({
    data: [
      {
        id: "a1b2c3d4-5678-90ab-cdef-112233445566",
        userId: "c1f89e00-1a2b-4567-8901-abcdef123456",
        balance: 2000.0,
      },
      {
        id: "d4c3b2a1-8765-09ab-fedc-665544332211",
        userId: "b2d47f00-5c2e-7890-1234-abcdef654321",
        balance: 1500.0,
      },
    ],
  });

  console.log("✅ Accounts created!");

  const cards = await prisma.card.createMany({
    data: [
      {
        id: "card1-uuid",
        accountId: "a1b2c3d4-5678-90ab-cdef-112233445566",
        number: "4111111111111111",
        brand: "Visa",
        expiry: new Date("2027-12-31"),
        cvvHash: 123,
        balance: 1000.0,
      },
      {
        id: "card2-uuid",
        accountId: "a1b2c3d4-5678-90ab-cdef-112233445566",
        number: "5500000000000004",
        brand: "MasterCard",
        expiry: new Date("2026-11-30"),
        cvvHash: 456,
        balance: 1000.0,
      },
      {
        id: "card3-uuid",
        accountId: "d4c3b2a1-8765-09ab-fedc-665544332211",
        number: "6011000990139424",
        brand: "Maestro",
        expiry: new Date("2028-10-31"),
        cvvHash: 789,
        balance: 1500.0,
      },
    ],
  });

  const transactions = await prisma.transaction.createMany({
    data: [
      {
        id: "txn1-uuid",
        senderCardId: "card1-uuid",
        receiverCardId: "card3-uuid",
        amount: 500.0,
        type: "Transfer",
        status: "Completed",
      },
      {
        id: "txn2-uuid",
        senderCardId: "card2-uuid",
        receiverCardId: "card1-uuid",
        amount: 200.0,
        type: "Transfer",
        status: "Completed",
      },
      {
        id: "txn3-uuid",
        senderCardId: "card3-uuid",
        receiverCardId: null,
        amount: 100.0,
        type: "Withdrawal",
        status: "Completed",
      },
      {
        id: "txn4-uuid",
        senderCardId: null,
        receiverCardId: "card2-uuid",
        amount: 300.0,
        type: "Deposit",
        status: "Completed",
      },
    ],
  });

  console.log("✅ Transactions created!");

  console.log("🌱 Database successfully seeded!");
}

main()
  .catch((error) => {
    throw new Error(error("❌ Error seeding database:", error));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
