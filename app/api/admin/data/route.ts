// app/api/admin/data/route.ts
// ===== PART 1: IMPORTS =====
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Booking } from '@/lib/types';
import { getAdminSession } from '@/lib/auth/admin';
import {
  generateBookingId,
  generateUnitId,
  isDateRangeAvailable,
  groupConsecutiveDates,
  getAvailabilityMode,
} from '@/lib/utils/availability';
import { normalizeDate, parseDate, isDateInRange } from '@/lib/utils/date';
import {
  PropertySchema,
  PromoSchema,
  FAQSchema,
  AboutSchema,
  HomeSchema,
  SiteSchema,
  AppearanceSchema,
  AvailabilityBookingSchema,
} from '@/lib/schemas';
import { z, ZodError } from 'zod';

// ============ HELPERS: SERIALIZE PROPERTY (Prisma row -> JSON shape lama) ============


function serializeProperty(p: any) {
  // Serialize roomTypes for hotel
  let roomTypes = [];
  if (p.type === 'hotel' && p.roomTypes) {
    roomTypes = p.roomTypes.map((rt: any) => ({
      id: rt.roomTypeId,
      nameId: rt.nameId,
      nameEn: rt.nameEn,
      capacity: rt.capacity,
      priceWeekday: rt.priceWeekday,
      priceWeekend: rt.priceWeekend,
      images: rt.images || [],
      rooms: (rt.rooms || []).map((r: any) => ({
        id: r.roomId,
        roomNumber: r.roomNumber,
      })),
    }));
  }

  // Serialize units for non-hotel
  let units = [];
  if (p.type !== 'hotel' && p.units) {
    units = p.units.map((u: any) => ({ unitId: u.unitId, unitName: u.unitName }));
  }

  return {
    id: p.id,
    slug: p.slug,
    nameId: p.nameId,
    nameEn: p.nameEn,
    type: p.type,
    locationId: p.locationId,
    locationEn: p.locationEn,
    capacity: { min: p.capacityMin, max: p.capacityMax },
    pricing:
      p.pricingWeekday != null || p.pricingWeekend != null
        ? { weekday: p.pricingWeekday, weekend: p.pricingWeekend }
        : undefined,
    pricingMode: p.pricingMode ?? undefined,
    monthlyPrice: p.monthlyPrice ?? undefined,
    monthlyPricingWNI: p.monthlyPricingWNI ?? undefined,
    monthlyPricingWNA: p.monthlyPricingWNA ?? undefined,
    extraCharge:
      p.extraChargeAmount != null
        ? { amount: p.extraChargeAmount, unit: p.extraChargeUnit }
        : undefined,
    deposit: p.deposit ?? undefined,
    description: p.description,
    descriptionEn: p.descriptionEn,
    image: p.image,
    images: p.images,
    imagesCategorized: p.imagesCategorized ?? [],
    facilities: p.facilities ?? [],
    rules: p.rules,
    rulesEn: p.rulesEn,
    mapsUrl: p.mapsUrl,
    notes: p.notes ?? undefined,
    notesEn: p.notesEn ?? undefined,
    isGroupFriendly: p.isGroupFriendly,
    minGroupSize: p.minGroupSize ?? undefined,
    units: units,
    roomTypes: roomTypes,
    version: p.version ?? 1,
  };
}

// ============ HELPERS: SERIALIZE AVAILABILITY ============

async function serializeAvailabilityForProperty(propertyId: string) {
  const { rows: propertyRows } = await pool.query('SELECT * FROM "Property" WHERE id = $1', [propertyId]);
  const propertyBase = propertyRows[0];
  if (!propertyBase) return null;

  const { rows: units } = await pool.query('SELECT * FROM "PropertyUnit" WHERE "propertyId" = $1', [propertyId]);
  const { rows: roomTypes } = await pool.query('SELECT * FROM "RoomType" WHERE "propertyId" = $1', [propertyId]);
  const roomTypeIds = roomTypes.map((rt: any) => rt.id);
  const { rows: rooms } = roomTypeIds.length
    ? await pool.query('SELECT * FROM "Room" WHERE "roomTypeId" = ANY($1)', [roomTypeIds])
    : { rows: [] };
  const roomIds = rooms.map((r: any) => r.id);
  const unitIds = units.map((u: any) => u.id);

  const { rows: unitBookings } = unitIds.length
    ? await pool.query('SELECT * FROM "Booking" WHERE "unitId" = ANY($1)', [unitIds])
    : { rows: [] };
  const { rows: roomBookings } = roomIds.length
    ? await pool.query('SELECT * FROM "Booking" WHERE "roomId" = ANY($1)', [roomIds])
    : { rows: [] };
  const { rows: propertyBookings } = await pool.query(
    'SELECT * FROM "Booking" WHERE "propertyId" = $1 AND "unitId" IS NULL AND "roomId" IS NULL',
    [propertyId]
  );

  const bookingsByUnit: Record<string, any[]> = {};
  for (const b of unitBookings) {
    if (!bookingsByUnit[b.unitId]) bookingsByUnit[b.unitId] = [];
    bookingsByUnit[b.unitId].push(b);
  }
  const bookingsByRoom: Record<string, any[]> = {};
  for (const b of roomBookings) {
    if (!bookingsByRoom[b.roomId]) bookingsByRoom[b.roomId] = [];
    bookingsByRoom[b.roomId].push(b);
  }
  const roomsByRoomType: Record<string, any[]> = {};
  for (const r of rooms) {
    if (!roomsByRoomType[r.roomTypeId]) roomsByRoomType[r.roomTypeId] = [];
    roomsByRoomType[r.roomTypeId].push({ ...r, bookings: bookingsByRoom[r.id] || [] });
  }

  const property = {
    ...propertyBase,
    units: units.map((u: any) => ({ ...u, bookings: bookingsByUnit[u.id] || [] })),
    roomTypes: roomTypes.map((rt: any) => ({ ...rt, rooms: roomsByRoomType[rt.id] || [] })),
    bookings: propertyBookings,
  };
  if (!property) return null;

  const mode = getAvailabilityMode(property.type);

  if (mode === 'property') {
    return {
      mode: 'property' as const,
      bookings: property.bookings.map(toBookingShape),
    };
  }

  if (property.type === 'kos') {
    // Kos: flat units
    return {
      mode: 'unit' as const,
      units: property.units.map((u: any) => ({
        unitId: u.unitId,
        unitName: u.unitName,
        bookings: u.bookings.map(toBookingShape),
      })),
    };
  }

  if (property.type === 'hotel') {
    // Hotel: roomTypes with nested rooms
    return {
      mode: 'unit' as const,
      roomTypes: property.roomTypes.map((rt: any) => ({
        roomTypeId: rt.roomTypeId,
        roomTypeName: rt.nameId,
        priceWeekday: rt.priceWeekday,
        priceWeekend: rt.priceWeekend,
        capacity: rt.capacity,
        images: rt.images,
        rooms: rt.rooms.map((r: any) => ({
          roomId: r.roomId,
          roomNumber: r.roomNumber,
          bookings: r.bookings.map(toBookingShape),
        })),
      })),
    };
  }

  // Apartemen/Rumah: fallback
  return {
    mode: 'unit' as const,
    units: property.units.map((u: any) => ({
      unitId: u.unitId,
      unitName: u.unitName,
      bookings: u.bookings.map(toBookingShape),
    })),
  };
}

function toBookingShape(b: any): Booking {
  return { id: b.id, startDate: b.startDate, endDate: b.endDate, note: b.note ?? '' };
}

// ============ HELPERS: READ DATA PER TYPE ============

async function getProperties() {
  const { rows: properties } = await pool.query('SELECT * FROM "Property" ORDER BY "createdAt" ASC');
  const { rows: units } = await pool.query('SELECT * FROM "PropertyUnit"');
  const { rows: roomTypes } = await pool.query('SELECT * FROM "RoomType"');
  const { rows: rooms } = await pool.query('SELECT * FROM "Room"');

  const unitsByProperty: Record<string, any[]> = {};
  for (const u of units) {
    if (!unitsByProperty[u.propertyId]) unitsByProperty[u.propertyId] = [];
    unitsByProperty[u.propertyId].push(u);
  }

  const roomsByRoomType: Record<string, any[]> = {};
  for (const r of rooms) {
    if (!roomsByRoomType[r.roomTypeId]) roomsByRoomType[r.roomTypeId] = [];
    roomsByRoomType[r.roomTypeId].push(r);
  }

  const roomTypesByProperty: Record<string, any[]> = {};
  for (const rt of roomTypes) {
    if (!roomTypesByProperty[rt.propertyId]) roomTypesByProperty[rt.propertyId] = [];
    roomTypesByProperty[rt.propertyId].push({
      ...rt,
      rooms: roomsByRoomType[rt.id] || [],
    });
  }

  const assembled = properties.map((p: any) => ({
    ...p,
    units: unitsByProperty[p.id] || [],
    roomTypes: roomTypesByProperty[p.id] || [],
  }));

  return assembled.map(serializeProperty);
}

// ============ HELPERS: VERSION CHECK ============

async function checkVersion(
  type: string,
  id: string,
  clientVersion: number
): Promise<boolean> {
  let record: any = null;
  switch (type) {
    case 'properties': {
      const { rows } = await pool.query('SELECT * FROM "Property" WHERE id = $1', [id]);
      record = rows[0] ?? null;
      break;
    }
    case 'promos': {
      const { rows } = await pool.query('SELECT * FROM "Promo" WHERE id = $1', [id]);
      record = rows[0] ?? null;
      break;
    }
    case 'faqs': {
      const { rows } = await pool.query('SELECT * FROM "FAQ" WHERE id = $1', [id]);
      record = rows[0] ?? null;
      break;
    }
    default:
      return true;
  }

  if (!record) return true;
  return record.version === clientVersion;
}

// ============ HELPERS: DESERIALIZE PROPERTY INPUT ============

function deserializePropertyInput(prop: any) {
  let roomTypesData = undefined;
  if (prop.type === 'hotel' && prop.roomTypes) {
    roomTypesData = {
      deleteMany: {},
      create: prop.roomTypes.map((rt: any) => ({
        roomTypeId: rt.id || `rt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        nameId: rt.nameId,
        nameEn: rt.nameEn,
        capacity: rt.capacity || 2,
        priceWeekday: rt.priceWeekday || 0,
        priceWeekend: rt.priceWeekend || 0,
        images: rt.images || [],
        rooms: {
          create: (rt.rooms || []).map((r: any) => ({
            roomId: r.id || `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            roomNumber: r.roomNumber,
          })),
        },
      })),
    };
  }

  let unitsData = undefined;
  if (prop.type !== 'hotel' && prop.units) {
    unitsData = {
      deleteMany: {},
      create: prop.units.map((u: any) => ({
        unitId: u.unitId || generateUnitId(),
        unitName: u.unitName,
      })),
    };
  }

  return {
    slug: prop.slug,
    nameId: prop.nameId,
    nameEn: prop.nameEn,
    type: prop.type,
    locationId: prop.locationId,
    locationEn: prop.locationEn,
    capacityMin: prop.capacity?.min,
    capacityMax: prop.capacity?.max,
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
    images: prop.images || [],
    facilities: prop.facilities || [],
    rules: prop.rules || [],
    rulesEn: prop.rulesEn || [],
    mapsUrl: prop.mapsUrl || null,
    notes: prop.notes,
    notesEn: prop.notesEn,
    isGroupFriendly: prop.isGroupFriendly || false,
    minGroupSize: prop.minGroupSize,
    version: { increment: 1 },
    roomTypes: roomTypesData,
    units: unitsData,
  };
}

// ===== PART 3: GET HANDLER =====

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type === 'availability') {
      const propertyId = searchParams.get('propertyId');
      if (propertyId) {
        const avail = await serializeAvailabilityForProperty(propertyId);
        return NextResponse.json(avail);
      }
      const { rows: properties } = await pool.query('SELECT id FROM "Property"');
      const result: Record<string, any> = {};
      for (const p of properties) {
        const avail = await serializeAvailabilityForProperty(p.id);
        if (avail) result[p.id] = avail;
      }
      return NextResponse.json(result);
    }

    switch (type) {
      case 'properties':
        return NextResponse.json(await getProperties());
      case 'promos': {
        const { rows: promos } = await pool.query('SELECT * FROM "Promo" ORDER BY "createdAt" ASC');
        const { rows: links } = await pool.query('SELECT "promoId", "propertyId" FROM "PromoProperty"');
        const linksByPromo: Record<string, string[]> = {};
        for (const link of links) {
          if (!linksByPromo[link.promoId]) linksByPromo[link.promoId] = [];
          linksByPromo[link.promoId].push(link.propertyId);
        }
        return NextResponse.json(
          promos.map((promo: any) => ({
            id: promo.id,
            titleId: promo.titleId,
            titleEn: promo.titleEn,
            descriptionId: promo.descriptionId,
            descriptionEn: promo.descriptionEn,
            image: promo.image,
            validUntil: promo.validUntil,
            active: promo.active,
            propertyIds: linksByPromo[promo.id] || [],
            version: promo.version,
          }))
        );
      }
      case 'faqs': {
        const { rows } = await pool.query('SELECT * FROM "FAQ" ORDER BY "createdAt" ASC');
        return NextResponse.json(rows);
      }
      case 'about': {
        const { rows } = await pool.query('SELECT * FROM "About" LIMIT 1');
        const about = rows[0];
        if (!about) return NextResponse.json(null);
        return NextResponse.json({
          mission: about.mission,
          missionEn: about.missionEn,
          ctaTitle: about.ctaTitle,
          ctaTitleEn: about.ctaTitleEn,
          ctaDesc: about.ctaDesc,
          ctaDescEn: about.ctaDescEn,
          values: about.values,
          whyChooseUs: about.whyChooseUs,
          version: about.version,
        });
      }
      case 'home': {
        const { rows } = await pool.query('SELECT * FROM "HomeContent" LIMIT 1');
        const home = rows[0];
        if (!home) return NextResponse.json(null);
        return NextResponse.json({
          hero: {
            titleId: home.heroTitleId,
            titleEn: home.heroTitleEn,
            subtitleId: home.heroSubtitleId,
            subtitleEn: home.heroSubtitleEn,
            ctaPrimaryId: home.heroCtaPrimaryId,
            ctaPrimaryEn: home.heroCtaPrimaryEn,
            ctaSecondaryId: home.heroCtaSecondaryId,
            ctaSecondaryEn: home.heroCtaSecondaryEn,
            image: home.heroImage,
          },
          propertyTypes: home.propertyTypes,
          whyUs: home.whyUs,
          reviews: home.reviews,
          version: home.version,
        });
      }
      case 'site': {
        const { rows } = await pool.query('SELECT * FROM "SiteSetting" LIMIT 1');
        const site = rows[0];
        if (!site) return NextResponse.json(null);
        return NextResponse.json({
          siteName: site.siteName,
          logoText: site.logoText,
          whatsappNumber: site.whatsappNumber,
          email: site.email,
          instagramUrl: site.instagramUrl,
          footerTagline: site.footerTagline,
          copyrightText: site.copyrightText,
          navLinks: site.navLinks,
          version: site.version,
        });
      }
      case 'appearance': {
        const { rows } = await pool.query('SELECT * FROM "AppearanceSetting" LIMIT 1');
        const appearance = rows[0];
        if (!appearance) return NextResponse.json(null);
        return NextResponse.json({
          primaryColor: appearance.primaryColor,
          accentColor: appearance.accentColor,
          backgroundColor: appearance.backgroundColor,
          version: appearance.version,
        });
      }
      default:
        return NextResponse.json(null);
    }
  } catch (error) {
    console.error('GET /api/admin/data error:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

// ===== PART 4: POST HANDLER =====

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'availability') {
    return handleAvailability(request);
  }

  try {
    const body = await request.json();

    // ===== HANDLE DELETE PROPERTY =====
    if (type === 'properties' && body.action === 'deleteProperty' && body.id) {
      return await handleDeleteProperty(body.id);
    }

    // ===== VALIDATE & PROCESS OTHER TYPES =====
    let validatedBody;
    try {
      switch (type) {
        case 'properties':
          validatedBody = PropertySchema.array().parse(body);
          break;
        case 'promos':
          validatedBody = PromoSchema.array().parse(body);
          break;
        case 'faqs':
          validatedBody = FAQSchema.array().parse(body);
          break;
        case 'about':
          validatedBody = AboutSchema.parse(body);
          break;
        case 'home':
          validatedBody = HomeSchema.parse(body);
          break;
        case 'site':
          validatedBody = SiteSchema.parse(body);
          break;
        case 'appearance':
          validatedBody = AppearanceSchema.parse(body);
          break;
        default:
          return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
      }
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    switch (type) {
      case 'properties': {
        const props = validatedBody as z.infer<typeof PropertySchema>[];
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const prop of props) {
            const propertyId = prop.id || createId();
            const slug = prop.slug || prop.nameId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            // --- cek perubahan type, bersihkan data lama kalau type berubah ---
            const { rows: existingPropRows } = await client.query(
              'SELECT * FROM "Property" WHERE id = $1',
              [propertyId]
            );
            const existingProp = existingPropRows[0];
            if (existingProp && existingProp.type !== prop.type) {
              if (prop.type === 'hotel' && existingProp.type !== 'hotel') {
                await client.query('DELETE FROM "PropertyUnit" WHERE "propertyId" = $1', [propertyId]);
              }
              if (prop.type !== 'hotel' && existingProp.type === 'hotel') {
                await client.query('DELETE FROM "RoomType" WHERE "propertyId" = $1', [propertyId]);
              }
            }

            // --- cek optimistic lock ---
            if (prop.id) {
              const { rows } = await client.query(
                'SELECT version FROM "Property" WHERE id = $1',
                [prop.id]
              );
              const existing = rows[0];
              if (existing && existing.version !== prop.version) {
                throw new Error(`Properti "${prop.nameId}" telah diubah oleh admin lain. Silakan refresh dan coba lagi.`);
              }
            }

            // --- siapkan data dasar property ---
            const basePropertyData: any = {
              slug,
              nameId: prop.nameId,
              nameEn: prop.nameEn,
              type: prop.type,
              locationId: prop.locationId,
              locationEn: prop.locationEn,
              mapsUrl: prop.mapsUrl || null,
              capacityMin: prop.capacity?.min || 0,
              capacityMax: prop.capacity?.max || 1,
              extraChargeAmount: prop.extraCharge?.amount ?? null,
              extraChargeUnit: prop.extraCharge?.unit ?? null,
              deposit: prop.deposit ?? null,
              description: prop.description,
              descriptionEn: prop.descriptionEn,
              image: prop.image,
              images: prop.images || [],
              imagesCategorized: prop.imagesCategorized || [],
              facilities: prop.facilities || [],
              rules: prop.rules || [],
              rulesEn: prop.rulesEn || [],
              notes: prop.notes ?? null,
              notesEn: prop.notesEn ?? null,
              isGroupFriendly: prop.isGroupFriendly || false,
              minGroupSize: prop.minGroupSize ?? null,
            };
            if (prop.type === 'kos') {
              basePropertyData.pricingWeekday = null;
              basePropertyData.pricingWeekend = null;
              basePropertyData.pricingMode = prop.pricingMode ?? null;
              basePropertyData.monthlyPrice = prop.monthlyPrice ?? null;
              basePropertyData.monthlyPricingWNI = prop.monthlyPricingWNI ?? null;
              basePropertyData.monthlyPricingWNA = prop.monthlyPricingWNA ?? null;
            } else {
              basePropertyData.pricingWeekday = prop.pricing?.weekday ?? null;
              basePropertyData.pricingWeekend = prop.pricing?.weekend ?? null;
              basePropertyData.pricingMode = null;
              basePropertyData.monthlyPrice = null;
              basePropertyData.monthlyPricingWNI = null;
              basePropertyData.monthlyPricingWNA = null;
            }

            // --- upsert property ---
            await client.query(
              `INSERT INTO "Property"
                 (id, slug, "nameId", "nameEn", type, "locationId", "locationEn", "mapsUrl",
                  "capacityMin", "capacityMax", "pricingWeekday", "pricingWeekend", "pricingMode",
                  "monthlyPrice", "monthlyPricingWNI", "monthlyPricingWNA",
                  "extraChargeAmount", "extraChargeUnit", deposit, description, "descriptionEn",
                  image, images, "imagesCategorized", facilities, rules, "rulesEn", notes, "notesEn",
                  "isGroupFriendly", "minGroupSize", version, "createdAt", "updatedAt")
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
                       $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,1,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                 slug = EXCLUDED.slug, "nameId" = EXCLUDED."nameId", "nameEn" = EXCLUDED."nameEn",
                 type = EXCLUDED.type, "locationId" = EXCLUDED."locationId", "locationEn" = EXCLUDED."locationEn",
                 "mapsUrl" = EXCLUDED."mapsUrl", "capacityMin" = EXCLUDED."capacityMin",
                 "capacityMax" = EXCLUDED."capacityMax", "pricingWeekday" = EXCLUDED."pricingWeekday",
                 "pricingWeekend" = EXCLUDED."pricingWeekend", "pricingMode" = EXCLUDED."pricingMode",
                 "monthlyPrice" = EXCLUDED."monthlyPrice", "monthlyPricingWNI" = EXCLUDED."monthlyPricingWNI",
                 "monthlyPricingWNA" = EXCLUDED."monthlyPricingWNA", "extraChargeAmount" = EXCLUDED."extraChargeAmount",
                 "extraChargeUnit" = EXCLUDED."extraChargeUnit", deposit = EXCLUDED.deposit,
                 description = EXCLUDED.description, "descriptionEn" = EXCLUDED."descriptionEn",
                 image = EXCLUDED.image, images = EXCLUDED.images, "imagesCategorized" = EXCLUDED."imagesCategorized", facilities = EXCLUDED.facilities,
                 rules = EXCLUDED.rules, "rulesEn" = EXCLUDED."rulesEn", notes = EXCLUDED.notes,
                 "notesEn" = EXCLUDED."notesEn", "isGroupFriendly" = EXCLUDED."isGroupFriendly",
                 "minGroupSize" = EXCLUDED."minGroupSize", version = "Property".version + 1,
                 "updatedAt" = NOW()`,
              [
                propertyId, slug, basePropertyData.nameId, basePropertyData.nameEn, basePropertyData.type,
                basePropertyData.locationId, basePropertyData.locationEn, basePropertyData.mapsUrl,
                basePropertyData.capacityMin, basePropertyData.capacityMax, basePropertyData.pricingWeekday,
                basePropertyData.pricingWeekend, basePropertyData.pricingMode, basePropertyData.monthlyPrice,
                basePropertyData.monthlyPricingWNI, basePropertyData.monthlyPricingWNA,
                basePropertyData.extraChargeAmount, basePropertyData.extraChargeUnit, basePropertyData.deposit,
                basePropertyData.description, basePropertyData.descriptionEn, basePropertyData.image,
                basePropertyData.images, JSON.stringify(basePropertyData.imagesCategorized), JSON.stringify(basePropertyData.facilities), basePropertyData.rules,
                basePropertyData.rulesEn, basePropertyData.notes, basePropertyData.notesEn,
                basePropertyData.isGroupFriendly, basePropertyData.minGroupSize,
              ]
            );

            // --- handling units (non-hotel) ---
            if (prop.type !== 'hotel' && prop.units) {
              const { rows: existingUnits } = await client.query(
                'SELECT "unitId" FROM "PropertyUnit" WHERE "propertyId" = $1',
                [propertyId]
              );
              const existingUnitIds = existingUnits.map((u: any) => u.unitId);
              const requestUnitIds = prop.units.map((u: any) => u.unitId).filter(Boolean);
              const unitIdsToDelete = existingUnitIds.filter(
                (id: string) => !requestUnitIds.includes(id)
              );
              if (unitIdsToDelete.length > 0) {
                const { rows: countRows } = await client.query(
                  'SELECT COUNT(*) FROM "Booking" WHERE "unitId" IN (SELECT id FROM "PropertyUnit" WHERE "unitId" = ANY($1))',
                  [unitIdsToDelete]
                );
                const bookingsOnUnits = parseInt(countRows[0].count, 10);
                if (bookingsOnUnits > 0) {
                  throw new Error(
                    `Tidak dapat menghapus unit karena masih ada ${bookingsOnUnits} booking terkait. Hapus booking terlebih dahulu.`
                  );
                }
                await client.query(
                  'DELETE FROM "PropertyUnit" WHERE "unitId" = ANY($1) AND "propertyId" = $2',
                  [unitIdsToDelete, propertyId]
                );
              }
              for (const unit of prop.units) {
                const unitId = unit.unitId || generateUnitId();
                await client.query(
                  `INSERT INTO "PropertyUnit" (id, "unitId", "unitName", "propertyId", "createdAt", "updatedAt")
                   VALUES ($1,$2,$3,$4,NOW(),NOW())
                   ON CONFLICT ("unitId") DO UPDATE SET "unitName" = EXCLUDED."unitName", "propertyId" = EXCLUDED."propertyId", "updatedAt" = NOW()`,
                  [createId(), unitId, unit.unitName, propertyId]
                );
              }
            }

            // --- handling roomTypes + rooms (hotel) ---
            if (prop.type === 'hotel' && prop.roomTypes) {
              const { rows: existingRoomTypes } = await client.query(
                'SELECT id, "roomTypeId" FROM "RoomType" WHERE "propertyId" = $1',
                [propertyId]
              );
              const existingRoomTypeIds = existingRoomTypes.map((rt: any) => rt.roomTypeId);
              const requestRoomTypeIds = prop.roomTypes.map((rt: any) => rt.id).filter(Boolean);
              const roomTypeIdsToDelete = existingRoomTypeIds.filter(
                (id: string) => !requestRoomTypeIds.includes(id)
              );
              if (roomTypeIdsToDelete.length > 0) {
                const { rows: roomsToDelete } = await client.query(
                  'SELECT id FROM "Room" WHERE "roomTypeId" IN (SELECT id FROM "RoomType" WHERE "roomTypeId" = ANY($1))',
                  [roomTypeIdsToDelete]
                );
                const roomIdsToCheck = roomsToDelete.map((r: any) => r.id);
                if (roomIdsToCheck.length > 0) {
                  const { rows: countRows } = await client.query(
                    'SELECT COUNT(*) FROM "Booking" WHERE "roomId" = ANY($1)',
                    [roomIdsToCheck]
                  );
                  const bookingsOnRooms = parseInt(countRows[0].count, 10);
                  if (bookingsOnRooms > 0) {
                    throw new Error(
                      `Tidak dapat menghapus tipe kamar karena masih ada ${bookingsOnRooms} booking terkait. Hapus booking terlebih dahulu.`
                    );
                  }
                }
                await client.query(
                  'DELETE FROM "RoomType" WHERE "roomTypeId" = ANY($1) AND "propertyId" = $2',
                  [roomTypeIdsToDelete, propertyId]
                );
              }
              for (const rt of prop.roomTypes) {
                const roomTypeId = rt.id || `rt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                const { rows: roomTypeRows } = await client.query(
                  `INSERT INTO "RoomType"
                     (id, "roomTypeId", "nameId", "nameEn", capacity, "priceWeekday", "priceWeekend", images, "propertyId", "createdAt", "updatedAt")
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
                   ON CONFLICT ("roomTypeId") DO UPDATE SET
                     "nameId" = EXCLUDED."nameId", "nameEn" = EXCLUDED."nameEn", capacity = EXCLUDED.capacity,
                     "priceWeekday" = EXCLUDED."priceWeekday", "priceWeekend" = EXCLUDED."priceWeekend",
                     images = EXCLUDED.images, "propertyId" = EXCLUDED."propertyId", "updatedAt" = NOW()
                   RETURNING id`,
                  [
                    createId(), roomTypeId, rt.nameId, rt.nameEn, rt.capacity || 2,
                    rt.priceWeekday || 0, rt.priceWeekend || 0, rt.images || [], propertyId,
                  ]
                );
                const roomTypeDbId = roomTypeRows[0].id;

                if (rt.rooms) {
                  const { rows: existingRooms } = await client.query(
                    'SELECT "roomId" FROM "Room" WHERE "roomTypeId" = $1',
                    [roomTypeDbId]
                  );
                  const existingRoomIds = existingRooms.map((r: any) => r.roomId);
                  const requestRoomIds = rt.rooms.map((r: any) => r.id).filter(Boolean);
                  const roomIdsToDelete = existingRoomIds.filter(
                    (id: string) => !requestRoomIds.includes(id)
                  );
                  if (roomIdsToDelete.length > 0) {
                    const { rows: countRows } = await client.query(
                      'SELECT COUNT(*) FROM "Booking" WHERE "roomId" IN (SELECT id FROM "Room" WHERE "roomId" = ANY($1))',
                      [roomIdsToDelete]
                    );
                    const bookingsOnRooms = parseInt(countRows[0].count, 10);
                    if (bookingsOnRooms > 0) {
                      throw new Error(
                        `Tidak dapat menghapus kamar karena masih ada ${bookingsOnRooms} booking terkait. Hapus booking terlebih dahulu.`
                      );
                    }
                    await client.query(
                      'DELETE FROM "Room" WHERE "roomId" = ANY($1) AND "roomTypeId" = $2',
                      [roomIdsToDelete, roomTypeDbId]
                    );
                  }
                  for (const room of rt.rooms) {
                    const roomId = room.id || `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                    await client.query(
                      `INSERT INTO "Room" (id, "roomId", "roomNumber", "roomTypeId", "createdAt", "updatedAt")
                       VALUES ($1,$2,$3,$4,NOW(),NOW())
                       ON CONFLICT ("roomId") DO UPDATE SET "roomNumber" = EXCLUDED."roomNumber", "roomTypeId" = EXCLUDED."roomTypeId", "updatedAt" = NOW()`,
                      [createId(), roomId, room.roomNumber || '001', roomTypeDbId]
                    );
                  }
                }
              }
            }
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        return NextResponse.json({ success: true });
      }

      case 'promos': {
        const promos = validatedBody as z.infer<typeof PromoSchema>[];
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const promo of promos) {
            const promoId = promo.id || createId();
            if (promo.id) {
              const { rows } = await client.query(
                'SELECT version FROM "Promo" WHERE id = $1',
                [promo.id]
              );
              const existing = rows[0];
              if (existing && existing.version !== promo.version) {
                throw new Error(`Promo "${promo.titleId}" telah diubah oleh admin lain. Silakan refresh dan coba lagi.`);
              }
            }
            await client.query(
              `INSERT INTO "Promo"
                 (id, "titleId", "titleEn", "descriptionId", "descriptionEn",
                  image, "validUntil", active, version, "createdAt", "updatedAt")
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                 "titleId" = EXCLUDED."titleId",
                 "titleEn" = EXCLUDED."titleEn",
                 "descriptionId" = EXCLUDED."descriptionId",
                 "descriptionEn" = EXCLUDED."descriptionEn",
                 image = EXCLUDED.image,
                 "validUntil" = EXCLUDED."validUntil",
                 active = EXCLUDED.active,
                 version = "Promo".version + 1,
                 "updatedAt" = NOW()`,
              [
                promoId, promo.titleId, promo.titleEn, promo.descriptionId,
                promo.descriptionEn, promo.image, promo.validUntil, promo.active,
              ]
            );
            if (promo.propertyIds) {
              await client.query('DELETE FROM "PromoProperty" WHERE "promoId" = $1', [promoId]);
              for (const pid of promo.propertyIds) {
                await client.query(
                  'INSERT INTO "PromoProperty" (id, "promoId", "propertyId", "createdAt") VALUES ($1,$2,$3,NOW())',
                  [createId(), promoId, pid]
                );
              }
            }
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        return NextResponse.json({ success: true });
      }

      case 'faqs': {
        const faqs = validatedBody as z.infer<typeof FAQSchema>[];
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const faq of faqs) {
            const faqId = faq.id || createId();
            if (faq.id) {
              const { rows } = await client.query(
                'SELECT version FROM "FAQ" WHERE id = $1',
                [faq.id]
              );
              const existing = rows[0];
              if (existing && existing.version !== faq.version) {
                throw new Error(`FAQ "${faq.questionId}" telah diubah oleh admin lain. Silakan refresh dan coba lagi.`);
              }
            }
            await client.query(
              `INSERT INTO "FAQ"
                 (id, "categoryId", "categoryEn", "questionId", "questionEn",
                  "answerIdContent", "answerEnContent", "version", "createdAt", "updatedAt")
               VALUES ($1,$2,$3,$4,$5,$6,$7,1,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                 "categoryId" = EXCLUDED."categoryId",
                 "categoryEn" = EXCLUDED."categoryEn",
                 "questionId" = EXCLUDED."questionId",
                 "questionEn" = EXCLUDED."questionEn",
                 "answerIdContent" = EXCLUDED."answerIdContent",
                 "answerEnContent" = EXCLUDED."answerEnContent",
                 "version" = "FAQ"."version" + 1,
                 "updatedAt" = NOW()`,
              [
                faqId, faq.categoryId, faq.categoryEn, faq.questionId,
                faq.questionEn, faq.answerIdContent, faq.answerEnContent,
              ]
            );
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        return NextResponse.json({ success: true });
      }

      case 'about': {
        const about = validatedBody as z.infer<typeof AboutSchema>;

        const baseData = {
          mission: about.mission || '',
          missionEn: about.missionEn || '',
          ctaTitle: about.ctaTitle || '',
          ctaTitleEn: about.ctaTitleEn || '',
          ctaDesc: about.ctaDesc || '',
          ctaDescEn: about.ctaDescEn || '',
          values: (about.values || []),
          whyChooseUs: (about.whyChooseUs || []),
        };

        const { rows: existingRows } = await pool.query(
          'SELECT id, version FROM "About" LIMIT 1'
        );
        const existing = existingRows[0];
        if (existing) {
          await pool.query(
            `UPDATE "About" SET
               mission = $1, "missionEn" = $2, "ctaTitle" = $3, "ctaTitleEn" = $4,
               "ctaDesc" = $5, "ctaDescEn" = $6, values = $7, "whyChooseUs" = $8,
               version = $9, "updatedAt" = NOW()
             WHERE id = $10`,
            [
              baseData.mission, baseData.missionEn, baseData.ctaTitle, baseData.ctaTitleEn,
              baseData.ctaDesc, baseData.ctaDescEn, JSON.stringify(baseData.values),
              JSON.stringify(baseData.whyChooseUs), existing.version + 1, existing.id,
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO "About"
               (id, mission, "missionEn", "ctaTitle", "ctaTitleEn", "ctaDesc", "ctaDescEn",
                values, "whyChooseUs", version, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,NOW(),NOW())`,
            [
              createId(), baseData.mission, baseData.missionEn, baseData.ctaTitle,
              baseData.ctaTitleEn, baseData.ctaDesc, baseData.ctaDescEn,
              JSON.stringify(baseData.values), JSON.stringify(baseData.whyChooseUs),
            ]
          );
        }
        return NextResponse.json({ success: true });
      }

      case 'home': {
        const home = validatedBody as z.infer<typeof HomeSchema>;

        const baseData = {
          heroTitleId: home.hero?.titleId || '',
          heroTitleEn: home.hero?.titleEn || '',
          heroSubtitleId: home.hero?.subtitleId || '',
          heroSubtitleEn: home.hero?.subtitleEn || '',
          heroCtaPrimaryId: home.hero?.ctaPrimaryId || '',
          heroCtaPrimaryEn: home.hero?.ctaPrimaryEn || '',
          heroCtaSecondaryId: home.hero?.ctaSecondaryId || '',
          heroCtaSecondaryEn: home.hero?.ctaSecondaryEn || '',
          heroImage: home.hero?.image || '',
          propertyTypes: (home.propertyTypes || []),
          whyUs: (home.whyUs || []),
          reviews: (home.reviews || []),
        };

        const { rows: existingRows } = await pool.query(
          'SELECT id, version FROM "HomeContent" LIMIT 1'
        );
        const existing = existingRows[0];
        if (existing) {
          await pool.query(
            `UPDATE "HomeContent" SET
               "heroTitleId" = $1, "heroTitleEn" = $2, "heroSubtitleId" = $3, "heroSubtitleEn" = $4,
               "heroCtaPrimaryId" = $5, "heroCtaPrimaryEn" = $6, "heroCtaSecondaryId" = $7,
               "heroCtaSecondaryEn" = $8, "heroImage" = $9, "propertyTypes" = $10,
               "whyUs" = $11, reviews = $12, version = $13, "updatedAt" = NOW()
             WHERE id = $14`,
            [
              baseData.heroTitleId, baseData.heroTitleEn, baseData.heroSubtitleId, baseData.heroSubtitleEn,
              baseData.heroCtaPrimaryId, baseData.heroCtaPrimaryEn, baseData.heroCtaSecondaryId,
              baseData.heroCtaSecondaryEn, baseData.heroImage, JSON.stringify(baseData.propertyTypes),
              JSON.stringify(baseData.whyUs), JSON.stringify(baseData.reviews),
              existing.version + 1, existing.id,
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO "HomeContent"
               (id, "heroTitleId", "heroTitleEn", "heroSubtitleId", "heroSubtitleEn",
                "heroCtaPrimaryId", "heroCtaPrimaryEn", "heroCtaSecondaryId", "heroCtaSecondaryEn",
                "heroImage", "propertyTypes", "whyUs", reviews, version, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,NOW(),NOW())`,
            [
              createId(), baseData.heroTitleId, baseData.heroTitleEn, baseData.heroSubtitleId,
              baseData.heroSubtitleEn, baseData.heroCtaPrimaryId, baseData.heroCtaPrimaryEn,
              baseData.heroCtaSecondaryId, baseData.heroCtaSecondaryEn, baseData.heroImage,
              JSON.stringify(baseData.propertyTypes), JSON.stringify(baseData.whyUs),
              JSON.stringify(baseData.reviews),
            ]
          );
        }
        return NextResponse.json({ success: true });
      }

      case 'site': {
        const site = validatedBody as z.infer<typeof SiteSchema>;

        const baseData = {
          siteName: site.siteName || '',
          logoText: site.logoText || 'RF',
          whatsappNumber: site.whatsappNumber || '',
          email: site.email || '',
          instagramUrl: site.instagramUrl || '',
          footerTagline: site.footerTagline || '',
          copyrightText: site.copyrightText || '',
          navLinks: (site.navLinks || []),
        };

        const { rows: existingRows } = await pool.query(
          'SELECT id, version FROM "SiteSetting" LIMIT 1'
        );
        const existing = existingRows[0];
        if (existing) {
          await pool.query(
            `UPDATE "SiteSetting" SET
               "siteName" = $1, "logoText" = $2, "whatsappNumber" = $3, "email" = $4,
               "instagramUrl" = $5, "footerTagline" = $6, "copyrightText" = $7,
               "navLinks" = $8, "version" = $9, "updatedAt" = NOW()
             WHERE id = $10`,
            [
              baseData.siteName, baseData.logoText, baseData.whatsappNumber,
              baseData.email, baseData.instagramUrl, baseData.footerTagline,
              baseData.copyrightText, JSON.stringify(baseData.navLinks),
              existing.version + 1, existing.id,
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO "SiteSetting"
               (id, "siteName", "logoText", "whatsappNumber", "email", "instagramUrl",
                "footerTagline", "copyrightText", "navLinks", "version", "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,NOW(),NOW())`,
            [
              createId(), baseData.siteName, baseData.logoText, baseData.whatsappNumber,
              baseData.email, baseData.instagramUrl, baseData.footerTagline,
              baseData.copyrightText, JSON.stringify(baseData.navLinks),
            ]
          );
        }
        return NextResponse.json({ success: true });
      }

      case 'appearance': {
        const appearance = validatedBody as z.infer<typeof AppearanceSchema>;

        const baseData = {
          primaryColor: appearance.primaryColor || '#1B5E20',
          accentColor: appearance.accentColor || '#C9A84C',
          backgroundColor: appearance.backgroundColor || '#FFFFFF',
        };

        const { rows: existingRows } = await pool.query(
          'SELECT id, version FROM "AppearanceSetting" LIMIT 1'
        );
        const existing = existingRows[0];
        if (existing) {
          await pool.query(
            `UPDATE "AppearanceSetting" SET
               "primaryColor" = $1, "accentColor" = $2, "backgroundColor" = $3,
               version = $4, "updatedAt" = NOW()
             WHERE id = $5`,
            [
              baseData.primaryColor, baseData.accentColor, baseData.backgroundColor,
              existing.version + 1, existing.id,
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO "AppearanceSetting"
               (id, "primaryColor", "accentColor", "backgroundColor", version, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,1,NOW(),NOW())`,
            [createId(), baseData.primaryColor, baseData.accentColor, baseData.backgroundColor]
          );
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/admin/data error:', error);
    return NextResponse.json(
      { error: 'Failed to write data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ===== HELPER: DELETE PROPERTY =====
async function handleDeleteProperty(propertyId: string): Promise<NextResponse> {
  try {
    const { rows: propRows } = await pool.query('SELECT * FROM "Property" WHERE id = $1', [propertyId]);
    const property = propRows[0];
    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 });
    }
    const today = normalizeDate(new Date());

    const { rows: propBookings } = await pool.query(
      'SELECT * FROM "Booking" WHERE "propertyId" = $1 AND "unitId" IS NULL AND "roomId" IS NULL',
      [propertyId]
    );
    const activeBookings = propBookings.filter((b: any) => b.endDate > today);
    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: `Properti ini masih memiliki ${activeBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.` },
        { status: 400 }
      );
    }

    const { rows: units } = await pool.query('SELECT * FROM "PropertyUnit" WHERE "propertyId" = $1', [propertyId]);
    for (const unit of units) {
      const { rows: unitBookings } = await pool.query('SELECT * FROM "Booking" WHERE "unitId" = $1', [unit.id]);
      const activeUnitBookings = unitBookings.filter((b: any) => b.endDate > today);
      if (activeUnitBookings.length > 0) {
        return NextResponse.json(
          { error: `Unit "${unit.unitName}" masih memiliki ${activeUnitBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.` },
          { status: 400 }
        );
      }
    }

    const { rows: roomTypes } = await pool.query('SELECT * FROM "RoomType" WHERE "propertyId" = $1', [propertyId]);
    for (const roomType of roomTypes) {
      const { rows: rooms } = await pool.query('SELECT * FROM "Room" WHERE "roomTypeId" = $1', [roomType.id]);
      for (const room of rooms) {
        const { rows: roomBookings } = await pool.query('SELECT * FROM "Booking" WHERE "roomId" = $1', [room.id]);
        const activeRoomBookings = roomBookings.filter((b: any) => b.endDate > today);
        if (activeRoomBookings.length > 0) {
          return NextResponse.json(
            { error: `Kamar "${room.roomNumber}" masih memiliki ${activeRoomBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.` },
            { status: 400 }
          );
        }
      }
    }

    await pool.query('DELETE FROM "Property" WHERE id = $1', [propertyId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete property error:', error);
    return NextResponse.json({ error: 'Gagal menghapus properti' }, { status: 500 });
  }
}

// ===== PART 5: AVAILABILITY HANDLER =====

async function handleAvailability(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    let validated;
    try {
      validated = AvailabilityBookingSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    const { action, propertyId, unitId, roomTypeId, roomId, startDate, endDate, dates, note, bookingId, unitName } =
      validated;

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    }

    const { rows: propertyRowsX } = await pool.query('SELECT * FROM "Property" WHERE id = $1', [propertyId]);
    const property = propertyRowsX[0] ?? null;
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const mode = getAvailabilityMode(property.type);

    // ========== ACTION: addBooking (property mode) ==========
    if (action === 'addBooking' && mode === 'property') {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
      }

      try {
        const client = await pool.connect();
        let created: any;
        try {
          await client.query('BEGIN');
          const { rows: existing } = await client.query(
            'SELECT * FROM "Booking" WHERE "propertyId" = $1 AND "unitId" IS NULL AND "roomId" IS NULL',
            [propertyId]
          );
          if (!isDateRangeAvailable(existing.map(toBookingShape), startDate, endDate)) {
            throw new Error('Tanggal overlap dengan booking yang sudah ada');
          }
          const bookingId = generateBookingId();
          const { rows } = await client.query(
            `INSERT INTO "Booking" (id, "propertyId", "startDate", "endDate", note, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *`,
            [bookingId, propertyId, startDate, endDate, note || '']
          );
          created = rows[0];
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        return NextResponse.json({ success: true, booking: toBookingShape(created) });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to add booking' }, { status: 400 });
      }
    }

    // ========== ACTION: addBooking (unit mode - Kos) ==========
    if (action === 'addBooking' && mode === 'unit' && property.type === 'kos') {
      if (!unitId) {
        return NextResponse.json({ error: 'unitId is required for kos' }, { status: 400 });
      }
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
      }

      try {
        const client = await pool.connect();
        let created: any;
        try {
          await client.query('BEGIN');
          const { rows: unitRows } = await client.query('SELECT * FROM "PropertyUnit" WHERE "unitId" = $1', [unitId]);
          const unit = unitRows[0];
          if (!unit) throw new Error('Unit not found');
          if (unit.propertyId !== propertyId) {
            throw new Error('Unit tidak sesuai dengan properti yang diberikan');
          }
          const { rows: existing } = await client.query('SELECT * FROM "Booking" WHERE "unitId" = $1', [unit.id]);
          if (!isDateRangeAvailable(existing.map(toBookingShape), startDate, endDate)) {
            throw new Error('Tanggal overlap dengan booking yang sudah ada di unit ini');
          }
          const bookingId = generateBookingId();
          const { rows } = await client.query(
            `INSERT INTO "Booking" (id, "propertyId", "unitId", "startDate", "endDate", note, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
            [bookingId, propertyId, unit.id, startDate, endDate, note || '']
          );
          created = rows[0];
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        return NextResponse.json({ success: true, booking: toBookingShape(created) });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to add booking' }, { status: 400 });
      }
    }

    // ========== ACTION: addBooking (unit mode - Hotel) ==========
    if (action === 'addBooking' && mode === 'unit' && property.type === 'hotel') {
      if (!roomId) {
        return NextResponse.json({ error: 'roomId is required for hotel' }, { status: 400 });
      }
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
      }

      try {
        const client = await pool.connect();
        let created: any;
        try {
          await client.query('BEGIN');
          const { rows: roomRows } = await client.query(
            `SELECT r.*, rt."propertyId" as "rt_propertyId"
             FROM "Room" r JOIN "RoomType" rt ON r."roomTypeId" = rt.id
             WHERE r."roomId" = $1`,
            [roomId]
          );
          const room = roomRows[0];
          if (!room) throw new Error('Room not found');
          if (room.rt_propertyId !== propertyId) {
            throw new Error('Room tidak sesuai dengan properti yang diberikan');
          }
          const { rows: existing } = await client.query('SELECT * FROM "Booking" WHERE "roomId" = $1', [room.id]);
          if (!isDateRangeAvailable(existing.map(toBookingShape), startDate, endDate)) {
            throw new Error('Tanggal overlap dengan booking yang sudah ada di kamar ini');
          }
          const bookingId = generateBookingId();
          const { rows } = await client.query(
            `INSERT INTO "Booking" (id, "propertyId", "roomId", "startDate", "endDate", note, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
            [bookingId, propertyId, room.id, startDate, endDate, note || '']
          );
          created = rows[0];
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        return NextResponse.json({ success: true, booking: toBookingShape(created) });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to add booking' }, { status: 400 });
      }
    }

    // ========== ACTION: addBookingDates ==========
    if (action === 'addBookingDates') {
      if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return NextResponse.json({ error: 'dates array is required' }, { status: 400 });
      }

      try {
        const client = await pool.connect();
        let newBookings: any[] = [];
        try {
          await client.query('BEGIN');
          let existingBookings: any[] = [];
          let roomDbId: string | null = null;
          let unitDbId: string | null = null;
          if (property.type === 'hotel') {
            if (!roomId) throw new Error('roomId is required for hotel');
            const { rows } = await client.query('SELECT * FROM "Room" WHERE "roomId" = $1', [roomId]);
            const room = rows[0];
            if (!room) throw new Error('Room not found');
            roomDbId = room.id;
            const { rows: eb } = await client.query('SELECT * FROM "Booking" WHERE "roomId" = $1', [roomDbId]);
            existingBookings = eb;
          } else if (property.type === 'kos') {
            if (!unitId) throw new Error('unitId is required for kos');
            const { rows } = await client.query('SELECT * FROM "PropertyUnit" WHERE "unitId" = $1', [unitId]);
            const unit = rows[0];
            if (!unit) throw new Error('Unit not found');
            unitDbId = unit.id;
            const { rows: eb } = await client.query('SELECT * FROM "Booking" WHERE "unitId" = $1', [unitDbId]);
            existingBookings = eb;
          } else {
            const { rows: eb } = await client.query(
              'SELECT * FROM "Booking" WHERE "propertyId" = $1 AND "unitId" IS NULL AND "roomId" IS NULL',
              [propertyId]
            );
            existingBookings = eb;
          }
          const existingShape = existingBookings.map(toBookingShape);
          const ranges = groupConsecutiveDates(dates);
          for (const range of ranges) {
            if (!isDateRangeAvailable(existingShape, range.startDate, range.endDate)) {
              throw new Error(`Tanggal ${range.startDate} s/d ${range.endDate} overlap dengan booking yang sudah ada`);
            }
          }
          for (const range of ranges) {
            const bookingId = generateBookingId();
            const { rows } = await client.query(
              `INSERT INTO "Booking" (id, "propertyId", "unitId", "roomId", "startDate", "endDate", note, "createdAt", "updatedAt")
               VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING *`,
              [bookingId, propertyId, unitDbId, roomDbId, range.startDate, range.endDate, note || '']
            );
            newBookings.push(rows[0]);
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        return NextResponse.json({ success: true, bookings: newBookings.map(toBookingShape) });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to add booking dates' }, { status: 400 });
      }
    }

    // ========== ACTION: deleteBooking ==========
    if (action === 'deleteBooking') {
      if (!bookingId) {
        return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
      }

      const { rows: existingRows } = await pool.query('SELECT * FROM "Booking" WHERE id = $1', [bookingId]);
      const existing = existingRows[0];
      if (!existing) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      await pool.query('DELETE FROM "Booking" WHERE id = $1', [bookingId]);
      return NextResponse.json({ success: true });
    }

    // ========== ACTION: addUnit (Kos only) ==========
    if (action === 'addUnit') {
      if (property.type !== 'kos') {
        return NextResponse.json({ error: 'addUnit hanya untuk properti tipe Kos' }, { status: 400 });
      }
      if (!unitName) {
        return NextResponse.json({ error: 'unitName is required' }, { status: 400 });
      }

      try {
        const newUnitId = generateUnitId();
        const { rows } = await pool.query(
          `INSERT INTO "PropertyUnit" (id, "unitId", "unitName", "propertyId", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING *`,
          [createId(), newUnitId, unitName, propertyId]
        );
        const newUnit = rows[0];

        return NextResponse.json({
          success: true,
          unit: { unitId: newUnit.unitId, unitName: newUnit.unitName },
        });
      } catch (error: any) {
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'Nama unit sudah digunakan untuk properti ini.' },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // ========== ACTION: deleteUnit (Kos only) ==========
    if (action === 'deleteUnit') {
      if (property.type !== 'kos') {
        return NextResponse.json({ error: 'deleteUnit hanya untuk properti tipe Kos' }, { status: 400 });
      }
      if (!unitId) {
        return NextResponse.json({ error: 'unitId is required' }, { status: 400 });
      }

      const { rows: unitRows } = await pool.query('SELECT * FROM "PropertyUnit" WHERE "unitId" = $1', [unitId]);
      const unit = unitRows[0];
      if (!unit) {
        return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
      }

      const { rows: unitBookings } = await pool.query('SELECT * FROM "Booking" WHERE "unitId" = $1', [unit.id]);
      const today = normalizeDate(new Date());
      const activeBookings = unitBookings.filter((b: any) => b.endDate > today);

      if (activeBookings.length > 0) {
        return NextResponse.json(
          {
            error: `Unit ini masih memiliki ${activeBookings.length} booking aktif (termasuk yang belum mulai). Hapus booking terlebih dahulu.`,
          },
          { status: 400 }
        );
      }

      await pool.query('DELETE FROM "PropertyUnit" WHERE "unitId" = $1', [unitId]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: 'Failed to process availability request' },
      { status: 500 }
    );
  }
}