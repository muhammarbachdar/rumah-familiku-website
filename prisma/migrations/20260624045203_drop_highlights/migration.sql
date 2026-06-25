/*
  Warnings:

  - You are about to drop the column `highlights` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `highlightsEn` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "highlights",
DROP COLUMN "highlightsEn";
