/*
  Warnings:

  - You are about to drop the column `recipientHash` on the `GiftPack` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ClaimTask" DROP CONSTRAINT "ClaimTask_giftPackId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GiftItem" DROP CONSTRAINT "GiftItem_giftPackId_fkey";

-- AlterTable
ALTER TABLE "public"."GiftPack" DROP COLUMN "recipientHash";

-- AddForeignKey
ALTER TABLE "public"."GiftItem" ADD CONSTRAINT "GiftItem_giftPackId_fkey" FOREIGN KEY ("giftPackId") REFERENCES "public"."GiftPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClaimTask" ADD CONSTRAINT "ClaimTask_giftPackId_fkey" FOREIGN KEY ("giftPackId") REFERENCES "public"."GiftPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
