/*
  Warnings:

  - You are about to drop the `GiftPackItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GiftPackItem" DROP CONSTRAINT "GiftPackItem_giftPackId_fkey";

-- DropTable
DROP TABLE "GiftPackItem";

-- CreateTable
CREATE TABLE "GiftItem" (
    "id" TEXT NOT NULL,
    "giftPackId" TEXT NOT NULL,
    "itemName" VARCHAR(100) NOT NULL,
    "itemType" VARCHAR(50) NOT NULL,
    "itemValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_giftPackId_fkey" FOREIGN KEY ("giftPackId") REFERENCES "GiftPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
