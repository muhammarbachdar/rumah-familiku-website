/*
  Warnings:

  - Changed the type of `values` on the `About` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `whyChooseUs` on the `About` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `propertyTypes` on the `HomeContent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `whyUs` on the `HomeContent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `reviews` on the `HomeContent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `navLinks` on the `SiteSetting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "About" DROP COLUMN "values",
ADD COLUMN     "values" JSONB NOT NULL,
DROP COLUMN "whyChooseUs",
ADD COLUMN     "whyChooseUs" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "HomeContent" DROP COLUMN "propertyTypes",
ADD COLUMN     "propertyTypes" JSONB NOT NULL,
DROP COLUMN "whyUs",
ADD COLUMN     "whyUs" JSONB NOT NULL,
DROP COLUMN "reviews",
ADD COLUMN     "reviews" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "SiteSetting" DROP COLUMN "navLinks",
ADD COLUMN     "navLinks" JSONB NOT NULL;
