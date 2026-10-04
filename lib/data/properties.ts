// lib/data/properties.ts
// Data layer untuk Property — dipanggil LANGSUNG (bukan via fetch) baik dari
// Server Component (halaman publik) maupun dari API route (admin, via HTTP untuk client-side).
// Tidak ada auth check di sini — auth check tetap di API route handler untuk request dari client.

import { pool } from '@/lib/prisma';

function safeJsonParse<T>(value: any, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value ?? fallback;
}

export function serializeProperty(p: any) {
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
    imagesCategorized: safeJsonParse(p.imagesCategorized, []),
    facilities: safeJsonParse(p.facilities, []),
    rules: p.rules ?? [],
    rulesEn: p.rulesEn ?? [],
    mapsUrl: p.mapsUrl,
    notes: p.notes ?? undefined,
    notesEn: p.notesEn ?? undefined,
    isGroupFriendly: p.isGroupFriendly,
    minGroupSize: p.minGroupSize ?? undefined,
    units,
    roomTypes,
    version: p.version ?? 1,
  };
}

export async function getPropertiesPaginated(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const query = `
    SELECT * FROM "Property"
    ORDER BY "createdAt" ASC
    LIMIT $1 OFFSET $2
  `;
  const { rows: properties } = await pool.query(query, [limit, offset]);

  const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM "Property"');
  const total = parseInt(countRows[0].count, 10);

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

  return {
    data: assembled.map(serializeProperty),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}