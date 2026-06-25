/*
  Warnings:

  - You are about to drop the column `image` on the `RoomType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RoomType" DROP COLUMN "image",
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
