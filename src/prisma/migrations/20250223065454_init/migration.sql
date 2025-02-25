-- CreateEnum
CREATE TYPE "CardBrand" AS ENUM ('Visa', 'MasterCard', 'Maestro', 'Plus', 'Star', 'Pulse');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('Withdrawal', 'Deposit', 'Transfer');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Completed', 'Failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "accountNumber" VARCHAR(6) NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "pinHash" VARCHAR(255) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "dailyLimitDeposit" DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
    "dailyLimitWithdraw" DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "number" VARCHAR(16) NOT NULL,
    "brand" "CardBrand" NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "cvvHash" INTEGER NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "senderCardId" TEXT,
    "receiverCardId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_accountNumber_key" ON "User"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Card_number_key" ON "Card"("number");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderCardId_fkey" FOREIGN KEY ("senderCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverCardId_fkey" FOREIGN KEY ("receiverCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
