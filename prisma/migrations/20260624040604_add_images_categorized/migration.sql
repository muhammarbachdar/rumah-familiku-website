-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "imagesCategorized" JSONB;

-- AlterTable
ALTER TABLE "RoomType" ALTER COLUMN "priceWeekday" DROP DEFAULT,
ALTER COLUMN "priceWeekend" DROP DEFAULT;
