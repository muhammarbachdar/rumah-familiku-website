-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "locationEn" TEXT NOT NULL,
    "capacityMin" INTEGER NOT NULL,
    "capacityMax" INTEGER NOT NULL,
    "pricingWeekday" INTEGER,
    "pricingWeekend" INTEGER,
    "pricingMode" TEXT,
    "monthlyPrice" INTEGER,
    "monthlyPricingWNI" INTEGER,
    "monthlyPricingWNA" INTEGER,
    "extraChargeAmount" INTEGER,
    "extraChargeUnit" TEXT,
    "deposit" INTEGER,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "images" TEXT[],
    "highlights" TEXT[],
    "highlightsEn" TEXT[],
    "rules" TEXT[],
    "rulesEn" TEXT[],
    "notes" TEXT,
    "notesEn" TEXT,
    "isGroupFriendly" BOOLEAN NOT NULL DEFAULT false,
    "minGroupSize" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyUnit" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promo" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionId" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "validUntil" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoProperty" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "roomId" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "categoryEn" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "answerIdContent" TEXT NOT NULL,
    "answerEnContent" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "About" (
    "id" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "missionEn" TEXT NOT NULL,
    "ctaTitle" TEXT NOT NULL,
    "ctaTitleEn" TEXT NOT NULL,
    "ctaDesc" TEXT NOT NULL,
    "ctaDescEn" TEXT NOT NULL,
    "values" TEXT[],
    "whyChooseUs" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "About_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeContent" (
    "id" TEXT NOT NULL,
    "heroTitleId" TEXT NOT NULL,
    "heroTitleEn" TEXT NOT NULL,
    "heroSubtitleId" TEXT NOT NULL,
    "heroSubtitleEn" TEXT NOT NULL,
    "heroCtaPrimaryId" TEXT NOT NULL,
    "heroCtaPrimaryEn" TEXT NOT NULL,
    "heroCtaSecondaryId" TEXT NOT NULL,
    "heroCtaSecondaryEn" TEXT NOT NULL,
    "heroImage" TEXT NOT NULL,
    "propertyTypes" TEXT[],
    "whyUs" TEXT[],
    "reviews" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "logoText" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "instagramUrl" TEXT NOT NULL,
    "footerTagline" TEXT NOT NULL,
    "copyrightText" TEXT NOT NULL,
    "navLinks" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppearanceSetting" (
    "id" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppearanceSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyUnit_unitId_key" ON "PropertyUnit"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyUnit_propertyId_unitName_key" ON "PropertyUnit"("propertyId", "unitName");

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_roomTypeId_key" ON "RoomType"("roomTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomId_key" ON "Room"("roomId");

-- AddForeignKey
ALTER TABLE "PropertyUnit" ADD CONSTRAINT "PropertyUnit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoProperty" ADD CONSTRAINT "PromoProperty_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoProperty" ADD CONSTRAINT "PromoProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PropertyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
