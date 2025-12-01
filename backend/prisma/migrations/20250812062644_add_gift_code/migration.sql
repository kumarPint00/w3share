/*
  Warnings:

  - A unique constraint covering the columns `[giftCode]` on the table `GiftPack` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."GiftPack" ADD COLUMN     "giftCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GiftPack_giftCode_key" ON "public"."GiftPack"("giftCode");
