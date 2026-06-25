/*
  Warnings:

  - You are about to drop the column `price` on the `RoomType` table. All the data in the column will be lost.
  - Added the required column `priceWeekday` to the `RoomType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceWeekend` to the `RoomType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoomType" DROP COLUMN "price";
ALTER TABLE "RoomType" ADD COLUMN "priceWeekday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RoomType" ADD COLUMN "priceWeekend" INTEGER NOT NULL DEFAULT 0;