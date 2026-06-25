import 'dotenv/config';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

function readJson(filename: string): any {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

async function migrateProperties() {
  const properties = readJson('properties.json');
  if (!properties) return;

  for (const prop of properties) {
    await prisma.property.upsert({
      where: { slug: prop.slug },
      update: {},
      create: {
        id: prop.id,
        slug: prop.slug,
        nameId: prop.nameId,
        nameEn: prop.nameEn,
        type: prop.type,
        locationId: prop.locationId,
        locationEn: prop.locationEn,
        capacityMin: prop.capacity.min,
        capacityMax: prop.capacity.max,
        pricingWeekday: prop.pricing?.weekday,
        pricingWeekend: prop.pricing?.weekend,
        pricingMode: prop.pricingMode,
        monthlyPrice: prop.monthlyPrice,
        monthlyPricingWNI: prop.monthlyPricingWNI,
        monthlyPricingWNA: prop.monthlyPricingWNA,
        extraChargeAmount: prop.extraCharge?.amount,
        extraChargeUnit: prop.extraCharge?.unit,
        deposit: prop.deposit,
        description: prop.description,
        descriptionEn: prop.descriptionEn,
        image: prop.image,
        images: JSON.stringify(prop.images || []),
        highlights: JSON.stringify(prop.highlights || []),
        highlightsEn: JSON.stringify(prop.highlightsEn || []),
        rules: JSON.stringify(prop.rules || []),
        rulesEn: JSON.stringify(prop.rulesEn || []),
        notes: prop.notes,
        notesEn: prop.notesEn,
        isGroupFriendly: prop.isGroupFriendly || false,
        minGroupSize: prop.minGroupSize,
      },
    });

    if (prop.units && prop.units.length > 0) {
      for (const unit of prop.units) {
        await prisma.propertyUnit.upsert({
          where: { unitId: unit.unitId },
          update: { unitName: unit.unitName },
          create: {
            unitId: unit.unitId,
            unitName: unit.unitName,
            propertyId: prop.id,
          },
        });
      }
    }
  }

  console.log(`✅ Properties migrated (${properties.length} item)`);
}

async function migratePromos() {
  const promos = readJson('promos.json');
  if (!promos) return;

  for (const promo of promos) {
    const { propertyIds, ...rest } = promo;

    await prisma.promo.upsert({
      where: { id: promo.id },
      update: {
        titleId: promo.titleId,
        titleEn: promo.titleEn,
        descriptionId: promo.descriptionId,
        descriptionEn: promo.descriptionEn,
        image: promo.image,
        validUntil: promo.validUntil,
        active: promo.active,
      },
      create: {
        id: promo.id,
        titleId: promo.titleId,
        titleEn: promo.titleEn,
        descriptionId: promo.descriptionId,
        descriptionEn: promo.descriptionEn,
        image: promo.image,
        validUntil: promo.validUntil,
        active: promo.active,
      },
    });

    if (propertyIds && propertyIds.length > 0) {
      for (const propertyId of propertyIds) {
        await prisma.promoProperty.upsert({
          where: {
            promoId_propertyId: { promoId: promo.id, propertyId },
          },
          update: {},
          create: { promoId: promo.id, propertyId },
        });
      }
    }
  }

  console.log(`✅ Promos migrated (${promos.length} item)`);
}

async function migrateFAQs() {
  const faqs = readJson('faqs.json');
  if (!faqs) return;

  for (const faq of faqs) {
    await prisma.fAQ.upsert({
      where: { id: faq.id },
      update: {
        categoryId: faq.categoryId,
        categoryEn: faq.categoryEn,
        questionId: faq.questionId,
        questionEn: faq.questionEn,
        answerIdContent: faq.answerIdContent,
        answerEnContent: faq.answerEnContent,
      },
      create: {
        id: faq.id,
        categoryId: faq.categoryId,
        categoryEn: faq.categoryEn,
        questionId: faq.questionId,
        questionEn: faq.questionEn,
        answerIdContent: faq.answerIdContent,
        answerEnContent: faq.answerEnContent,
      },
    });
  }

  console.log(`✅ FAQs migrated (${faqs.length} item)`);
}

async function migrateAbout() {
  const about = readJson('about.json');
  if (!about) return;

  const data = {
    mission: about.mission || '',
    missionEn: about.missionEn || '',
    ctaTitle: about.ctaTitle || '',
    ctaTitleEn: about.ctaTitleEn || '',
    ctaDesc: about.ctaDesc || '',
    ctaDescEn: about.ctaDescEn || '',
    values: JSON.stringify(about.values || []),
    whyChooseUs: JSON.stringify(about.whyChooseUs || []),
  };

  const existing = await prisma.about.findFirst();
  if (existing) {
    await prisma.about.update({ where: { id: existing.id }, data });
  } else {
    await prisma.about.create({ data });
  }

  console.log('✅ About migrated');
}

async function migrateHome() {
  const home = readJson('home.json');
  if (!home) return;

  const data = {
    heroTitleId: home.hero?.titleId || '',
    heroTitleEn: home.hero?.titleEn || '',
    heroSubtitleId: home.hero?.subtitleId || '',
    heroSubtitleEn: home.hero?.subtitleEn || '',
    heroCtaPrimaryId: home.hero?.ctaPrimaryId || '',
    heroCtaPrimaryEn: home.hero?.ctaPrimaryEn || '',
    heroCtaSecondaryId: home.hero?.ctaSecondaryId || '',
    heroCtaSecondaryEn: home.hero?.ctaSecondaryEn || '',
    heroImage: home.hero?.image || '',
    propertyTypes: JSON.stringify(home.propertyTypes || []),
    whyUs: JSON.stringify(home.whyUs || []),
    reviews: JSON.stringify(home.reviews || []),
  };

  const existing = await prisma.homeContent.findFirst();
  if (existing) {
    await prisma.homeContent.update({ where: { id: existing.id }, data });
  } else {
    await prisma.homeContent.create({ data });
  }

  console.log('✅ Home migrated');
}

async function migrateSite() {
  const site = readJson('site.json');
  if (!site) return;

  const data = {
    siteName: site.siteName || 'Rumah Familiku',
    logoText: site.logoText || 'RF',
    whatsappNumber: site.whatsappNumber || '',
    email: site.email || '',
    instagramUrl: site.instagramUrl || '',
    footerTagline: site.footerTagline || '',
    copyrightText: site.copyrightText || '',
    navLinks: JSON.stringify(site.navLinks || []),
  };

  const existing = await prisma.siteSetting.findFirst();
  if (existing) {
    await prisma.siteSetting.update({ where: { id: existing.id }, data });
  } else {
    await prisma.siteSetting.create({ data });
  }

  console.log('✅ Site migrated');
}

async function migrateAppearance() {
  const appearance = readJson('appearance.json');
  if (!appearance) return;

  const data = {
    primaryColor: appearance.primaryColor || '#1B5E20',
    accentColor: appearance.accentColor || '#C9A84C',
    backgroundColor: appearance.backgroundColor || '#FFFFFF',
  };

  const existing = await prisma.appearanceSetting.findFirst();
  if (existing) {
    await prisma.appearanceSetting.update({ where: { id: existing.id }, data });
  } else {
    await prisma.appearanceSetting.create({ data });
  }

  console.log('✅ Appearance migrated');
}

async function migrateAvailability() {
  const availability = readJson('availability.json');
  if (!availability) {
    console.log('ℹ️  availability.json kosong, skip (belum ada data booking)');
    return;
  }

  let count = 0;
  for (const [propertyId, data] of Object.entries(availability) as [string, any][]) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) continue;

    if (data.mode === 'property') {
      for (const booking of data.bookings || []) {
        await prisma.booking.create({
          data: {
            id: booking.id,
            propertyId,
            startDate: booking.startDate,
            endDate: booking.endDate,
            note: booking.note || '',
          },
        });
        count++;
      }
    } else if (data.mode === 'unit' && data.units) {
      for (const unit of data.units) {
        const existingUnit = await prisma.propertyUnit.findUnique({
          where: { unitId: unit.unitId },
        });
        if (!existingUnit) continue;

        for (const booking of unit.bookings || []) {
          await prisma.booking.create({
            data: {
              id: booking.id,
              propertyId,
              unitId: existingUnit.id,
              startDate: booking.startDate,
              endDate: booking.endDate,
              note: booking.note || '',
            },
          });
          count++;
        }
      }
    }
  }

  console.log(`✅ Availability migrated (${count} booking)`);
}

async function createAdminUser() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD_HASH;

  if (!password) {
    console.log('⚠️  ADMIN_PASSWORD_HASH belum diset di .env, skip pembuatan admin user');
    return;
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    console.log('✅ Admin user sudah ada, skip');
    return;
  }

  await prisma.adminUser.create({ data: { username, password } });
  console.log('✅ Admin user dibuat');
}

async function main() {
  console.log('🔄 Mulai migrasi JSON → SQLite...\n');

  await migrateProperties();
  await migratePromos();
  await migrateFAQs();
  await migrateAbout();
  await migrateHome();
  await migrateSite();
  await migrateAppearance();
  await migrateAvailability();
  await createAdminUser();

  console.log('\n✅ Migrasi selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Migrasi gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
