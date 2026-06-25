// migrate-sqlite-to-postgres.mjs
//
// Script SEKALI PAKAI untuk memindahkan data dari data/dev.db (SQLite)
// ke database Postgres yang baru, lewat Prisma Client yang sudah
// terhubung ke Postgres (lib/prisma.ts).
//
// Cara pakai:
//   node migrate-sqlite-to-postgres.mjs
//
// Setelah berhasil dan sudah diverifikasi datanya benar di Postgres,
// file ini boleh dihapus — tidak perlu jadi bagian permanen project.
import 'dotenv/config';
import Database from 'better-sqlite3';
import { prisma } from './lib/prisma'; // sesuaikan path jika lib/prisma.ts tidak otomatis ter-resolve

const db = new Database('data/dev.db');

// Helper: parse kolom yang masih berupa JSON string di SQLite
function parseJsonField(value, fallback = []) {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Helper: convert SQLite boolean (0/1) ke boolean asli jika perlu
function toBool(value) {
  if (typeof value === 'boolean') return value;
  return value === 1 || value === '1' || value === true;
}

async function main() {
  console.log('Mulai migrasi data dari data/dev.db ke Postgres...\n');

  // ===== 1. AdminUser =====
  const adminUsers = db.prepare('SELECT * FROM AdminUser').all();
  for (const u of adminUsers) {
    await prisma.adminUser.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        username: u.username,
        password: u.password, // sudah hash, dipindah apa adanya
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
      update: {},
    });
  }
  console.log(`AdminUser: ${adminUsers.length} baris dipindah`);

  // ===== 2. Property =====
  const properties = db.prepare('SELECT * FROM Property').all();
  for (const p of properties) {
    await prisma.property.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        slug: p.slug,
        nameId: p.nameId,
        nameEn: p.nameEn,
        type: p.type,
        locationId: p.locationId,
        locationEn: p.locationEn,
        capacityMin: p.capacityMin,
        capacityMax: p.capacityMax,
        pricingWeekday: p.pricingWeekday,
        pricingWeekend: p.pricingWeekend,
        pricingMode: p.pricingMode,
        monthlyPrice: p.monthlyPrice,
        monthlyPricingWNI: p.monthlyPricingWNI,
        monthlyPricingWNA: p.monthlyPricingWNA,
        extraChargeAmount: p.extraChargeAmount,
        extraChargeUnit: p.extraChargeUnit,
        deposit: p.deposit,
        description: p.description,
        descriptionEn: p.descriptionEn,
        image: p.image,
        images: parseJsonField(p.images),
        highlights: parseJsonField(p.highlights),
        highlightsEn: parseJsonField(p.highlightsEn),
        rules: parseJsonField(p.rules),
        rulesEn: parseJsonField(p.rulesEn),
        notes: p.notes,
        notesEn: p.notesEn,
        isGroupFriendly: toBool(p.isGroupFriendly),
        minGroupSize: p.minGroupSize,
        version: p.version,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
      update: {},
    });
  }
  console.log(`Property: ${properties.length} baris dipindah`);

  // ===== 3. PropertyUnit (FK: propertyId) =====
  const propertyUnits = db.prepare('SELECT * FROM PropertyUnit').all();
  for (const pu of propertyUnits) {
    await prisma.propertyUnit.upsert({
      where: { id: pu.id },
      create: {
        id: pu.id,
        unitId: pu.unitId,
        unitName: pu.unitName,
        propertyId: pu.propertyId,
        createdAt: new Date(pu.createdAt),
        updatedAt: new Date(pu.updatedAt),
      },
      update: {},
    });
  }
  console.log(`PropertyUnit: ${propertyUnits.length} baris dipindah`);

  // ===== 4. RoomType (FK: propertyId) =====
  const roomTypes = db.prepare('SELECT * FROM RoomType').all();
  for (const rt of roomTypes) {
    await prisma.roomType.upsert({
      where: { id: rt.id },
      create: {
        id: rt.id,
        roomTypeId: rt.roomTypeId,
        nameId: rt.nameId,
        nameEn: rt.nameEn,
        capacity: rt.capacity,
        price: rt.price,
        image: rt.image,
        propertyId: rt.propertyId,
        createdAt: new Date(rt.createdAt),
        updatedAt: new Date(rt.updatedAt),
      },
      update: {},
    });
  }
  console.log(`RoomType: ${roomTypes.length} baris dipindah`);

  // ===== 5. Room (FK: roomTypeId) =====
  const rooms = db.prepare('SELECT * FROM Room').all();
  for (const r of rooms) {
    await prisma.room.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        roomId: r.roomId,
        roomNumber: r.roomNumber,
        roomTypeId: r.roomTypeId,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      },
      update: {},
    });
  }
  console.log(`Room: ${rooms.length} baris dipindah`);

  // ===== 6. Promo =====
  const promos = db.prepare('SELECT * FROM Promo').all();
  for (const pr of promos) {
    await prisma.promo.upsert({
      where: { id: pr.id },
      create: {
        id: pr.id,
        titleId: pr.titleId,
        titleEn: pr.titleEn,
        descriptionId: pr.descriptionId,
        descriptionEn: pr.descriptionEn,
        image: pr.image,
        validUntil: pr.validUntil,
        active: toBool(pr.active),
        version: pr.version,
        createdAt: new Date(pr.createdAt),
        updatedAt: new Date(pr.updatedAt),
      },
      update: {},
    });
  }
  console.log(`Promo: ${promos.length} baris dipindah`);

  // ===== 7. PromoProperty (FK: promoId, propertyId) — biasanya kosong, tapi tetap dihandle =====
  const promoProperties = db.prepare('SELECT * FROM PromoProperty').all();
  for (const pp of promoProperties) {
    await prisma.promoProperty.upsert({
      where: { id: pp.id },
      create: {
        id: pp.id,
        promoId: pp.promoId,
        propertyId: pp.propertyId,
        createdAt: new Date(pp.createdAt),
      },
      update: {},
    });
  }
  console.log(`PromoProperty: ${promoProperties.length} baris dipindah`);

  // ===== 8. Booking (FK: propertyId, unitId, roomId) =====
  const bookings = db.prepare('SELECT * FROM Booking').all();
  for (const b of bookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        propertyId: b.propertyId,
        unitId: b.unitId,
        roomId: b.roomId,
        startDate: b.startDate,
        endDate: b.endDate,
        note: b.note,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      },
      update: {},
    });
  }
  console.log(`Booking: ${bookings.length} baris dipindah`);

  // ===== 9. About (field JSON: values, whyChooseUs) =====
  const abouts = db.prepare('SELECT * FROM About').all();
  for (const a of abouts) {
    await prisma.about.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        mission: a.mission,
        missionEn: a.missionEn,
        ctaTitle: a.ctaTitle,
        ctaTitleEn: a.ctaTitleEn,
        ctaDesc: a.ctaDesc,
        ctaDescEn: a.ctaDescEn,
        values: parseJsonField(a.values),
        whyChooseUs: parseJsonField(a.whyChooseUs),
        version: a.version,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      },
      update: {},
    });
  }
  console.log(`About: ${abouts.length} baris dipindah`);

  // ===== 10. AppearanceSetting =====
  const appearances = db.prepare('SELECT * FROM AppearanceSetting').all();
  for (const ap of appearances) {
    await prisma.appearanceSetting.upsert({
      where: { id: ap.id },
      create: {
        id: ap.id,
        primaryColor: ap.primaryColor,
        accentColor: ap.accentColor,
        backgroundColor: ap.backgroundColor,
        version: ap.version,
        createdAt: new Date(ap.createdAt),
        updatedAt: new Date(ap.updatedAt),
      },
      update: {},
    });
  }
  console.log(`AppearanceSetting: ${appearances.length} baris dipindah`);

  // ===== 11. FAQ =====
  const faqs = db.prepare('SELECT * FROM FAQ').all();
  for (const f of faqs) {
    await prisma.fAQ.upsert({
      where: { id: f.id },
      create: {
        id: f.id,
        categoryId: f.categoryId,
        categoryEn: f.categoryEn,
        questionId: f.questionId,
        questionEn: f.questionEn,
        answerIdContent: f.answerIdContent,
        answerEnContent: f.answerEnContent,
        version: f.version,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      },
      update: {},
    });
  }
  console.log(`FAQ: ${faqs.length} baris dipindah`);

  // ===== 12. HomeContent (field JSON: propertyTypes, whyUs, reviews) =====
  const homeContents = db.prepare('SELECT * FROM HomeContent').all();
  for (const h of homeContents) {
    await prisma.homeContent.upsert({
      where: { id: h.id },
      create: {
        id: h.id,
        heroTitleId: h.heroTitleId,
        heroTitleEn: h.heroTitleEn,
        heroSubtitleId: h.heroSubtitleId,
        heroSubtitleEn: h.heroSubtitleEn,
        heroCtaPrimaryId: h.heroCtaPrimaryId,
        heroCtaPrimaryEn: h.heroCtaPrimaryEn,
        heroCtaSecondaryId: h.heroCtaSecondaryId,
        heroCtaSecondaryEn: h.heroCtaSecondaryEn,
        heroImage: h.heroImage,
        propertyTypes: parseJsonField(h.propertyTypes),
        whyUs: parseJsonField(h.whyUs),
        reviews: parseJsonField(h.reviews),
        version: h.version,
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      },
      update: {},
    });
  }
  console.log(`HomeContent: ${homeContents.length} baris dipindah`);

  // ===== 13. SiteSetting (field JSON: navLinks) =====
  const siteSettings = db.prepare('SELECT * FROM SiteSetting').all();
  for (const s of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        siteName: s.siteName,
        logoText: s.logoText,
        whatsappNumber: s.whatsappNumber,
        email: s.email,
        instagramUrl: s.instagramUrl,
        footerTagline: s.footerTagline,
        copyrightText: s.copyrightText,
        navLinks: parseJsonField(s.navLinks),
        version: s.version,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
      update: {},
    });
  }
  console.log(`SiteSetting: ${siteSettings.length} baris dipindah`);

  console.log('\nMigrasi selesai.');
}

main()
  .catch((err) => {
    console.error('\nMigrasi GAGAL di tengah jalan:', err);
    process.exit(1);
  })
  .finally(async () => {
    db.close();
    await prisma.$disconnect();
  });
