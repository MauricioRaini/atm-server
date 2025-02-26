/*
  Warnings:

  - You are about to drop the column `balance` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `dailyLimitDeposit` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `dailyLimitWithdraw` on the `Account` table. All the data in the column will be lost.
  - Added the required column `defaultCard` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "balance",
DROP COLUMN "dailyLimitDeposit",
DROP COLUMN "dailyLimitWithdraw",
ADD COLUMN     "defaultCard" TEXT NOT NULL,
ADD COLUMN     "overallBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "transferDailyLimit" DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
ADD COLUMN     "withdrawalDailyLimit" DECIMAL(12,2) NOT NULL DEFAULT 5000.00;
