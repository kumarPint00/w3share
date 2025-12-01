/*
  Warnings:

  - You are about to drop the column `address` on the `ClaimTask` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `ClaimTask` table. All the data in the column will be lost.
  - You are about to drop the column `claimTxHash` on the `ClaimTask` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ClaimTask` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `ClaimTask` table. All the data in the column will be lost.
  - You are about to drop the column `isClaimed` on the `ClaimTask` table. All the data in the column will be lost.
  - You are about to drop the column `itemName` on the `GiftItem` table. All the data in the column will be lost.
  - You are about to drop the column `itemType` on the `GiftItem` table. All the data in the column will be lost.
  - You are about to drop the column `itemValue` on the `GiftItem` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `GiftPack` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `GiftPack` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `GiftPack` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `GiftPack` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `GiftPack` table. All the data in the column will be lost.
  - You are about to drop the `GiftPackClaim` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TokenBalance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[taskId]` on the table `ClaimTask` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[giftIdOnChain]` on the table `GiftPack` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `giftPackId` to the `ClaimTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskId` to the `ClaimTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contract` to the `GiftItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `GiftItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiry` to the `GiftPack` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderAddress` to the `GiftPack` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `GiftPack` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('DRAFT', 'LOCKED', 'CLAIMED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ERC20', 'ERC721');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'CLAIMED', 'FAILED');

-- DropForeignKey
ALTER TABLE "GiftPackClaim" DROP CONSTRAINT "GiftPackClaim_giftPackId_fkey";

-- DropForeignKey
ALTER TABLE "GiftPackClaim" DROP CONSTRAINT "GiftPackClaim_userId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropForeignKey
ALTER TABLE "TokenBalance" DROP CONSTRAINT "TokenBalance_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "TokenBalance" DROP CONSTRAINT "TokenBalance_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";

-- AlterTable
ALTER TABLE "ClaimTask" DROP COLUMN "address",
DROP COLUMN "amount",
DROP COLUMN "claimTxHash",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "isClaimed",
ADD COLUMN     "giftPackId" TEXT NOT NULL,
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "taskId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GiftItem" DROP COLUMN "itemName",
DROP COLUMN "itemType",
DROP COLUMN "itemValue",
ADD COLUMN     "amount" TEXT,
ADD COLUMN     "contract" TEXT NOT NULL,
ADD COLUMN     "tokenId" TEXT,
ADD COLUMN     "type" "AssetType" NOT NULL;

-- AlterTable
ALTER TABLE "GiftPack" DROP COLUMN "amount",
DROP COLUMN "description",
DROP COLUMN "expiresAt",
DROP COLUMN "isActive",
DROP COLUMN "name",
ADD COLUMN     "expiry" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "giftIdOnChain" INTEGER,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "recipientHash" VARCHAR(66),
ADD COLUMN     "senderAddress" VARCHAR(42) NOT NULL,
ADD COLUMN     "status" "GiftStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "GiftPackClaim";

-- DropTable
DROP TABLE "Token";

-- DropTable
DROP TABLE "TokenBalance";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserProfile";

-- CreateTable
CREATE TABLE "ConfigItem" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ConfigItem_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClaimTask_taskId_key" ON "ClaimTask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftPack_giftIdOnChain_key" ON "GiftPack"("giftIdOnChain");

-- AddForeignKey
ALTER TABLE "ClaimTask" ADD CONSTRAINT "ClaimTask_giftPackId_fkey" FOREIGN KEY ("giftPackId") REFERENCES "GiftPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
