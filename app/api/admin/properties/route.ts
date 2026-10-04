// app/api/admin/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
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

// ===== HELPERS =====

/**
 * Safe JSON parse dengan fallback
 */
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

function serializeProperty(p: any) {
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
    units: units,
    roomTypes: roomTypes,
    version: p.version ?? 1,
  };
}

async function getProperties(page?: number, limit?: number) {
  const offset = page && limit ? (page - 1) * limit : 0;
  const limitClause = limit ? `LIMIT ${limit}` : '';
  const offsetClause = page && limit ? `OFFSET ${offset}` : '';

  const query = `
    SELECT * FROM "Property" 
    ORDER BY "createdAt" ASC 
    ${limitClause} 
    ${offsetClause}
  `;
  
  const { rows: properties } = await pool.query(query);
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function validateProperty(prop: any): string[] {
  const errors: string[] = [];

  // Capacity
  if (prop.capacity && prop.capacity.min > prop.capacity.max) {
    errors.push('Kapasitas minimum tidak boleh lebih besar dari kapasitas maksimum.');
  }

  // Kos pricing
  if (prop.type === 'kos') {
    if (prop.pricingMode === 'general') {
      if (!prop.monthlyPrice || prop.monthlyPrice <= 0) {
        errors.push('Untuk mode General, harga bulanan wajib diisi dan harus lebih dari 0.');
      }
    } else if (prop.pricingMode === 'wni-wna' || !prop.pricingMode) {
      if (!prop.monthlyPricingWNI || prop.monthlyPricingWNI <= 0) {
        errors.push('Harga untuk WNI wajib diisi dan harus lebih dari 0.');
      }
      if (!prop.monthlyPricingWNA || prop.monthlyPricingWNA <= 0) {
        errors.push('Harga untuk WNA wajib diisi dan harus lebih dari 0.');
      }
    }
  }

  // Room capacity (Hotel)
  if (prop.type === 'hotel' && prop.roomTypes) {
    for (const rt of prop.roomTypes) {
      if (!rt.capacity || rt.capacity <= 0) {
        errors.push(`Kapasitas tipe kamar "${rt.nameId || 'Unnamed'}" wajib diisi dan harus lebih dari 0.`);
      } else if (rt.capacity > (prop.capacity?.max || 10)) {
        errors.push(`Kapasitas tipe kamar "${rt.nameId}" (${rt.capacity}) melebihi kapasitas maksimum properti (${prop.capacity?.max}).`);
      }
    }
  }

  return errors;
}

// ===== GET =====

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const properties = await getProperties(page, limit);
    
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM "Property"');
    const total = parseInt(countRows[0].count, 10);

    return NextResponse.json({
      data: properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/admin/properties error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

// ===== POST =====

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    let prop;
    try {
      prop = PropertySchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: err.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }
      throw err;
    }

    const validationErrors = validateProperty(prop);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationErrors.map((msg) => ({ field: 'custom', message: msg })),
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const propertyId = prop.id || createId();

      const { rows: existingPropRows } = await client.query(
        'SELECT * FROM "Property" WHERE id = $1',
        [propertyId]
      );
      const existingProp = existingPropRows[0];

      if (existingProp && prop.id) {
        if (existingProp.version !== prop.version) {
          throw new Error(
            `Properti "${prop.nameId}" telah diubah oleh admin lain. Silakan refresh dan coba lagi.`
          );
        }
      }

      if (!existingProp && prop.id) {
        throw new Error(`Property dengan ID "${prop.id}" tidak ditemukan.`);
      }

      const baseSlug = prop.slug || generateSlug(prop.nameId);
      let slug = baseSlug;
      let slugSuffix = 1;
      while (true) {
        const { rows: slugCheck } = await client.query(
          'SELECT id FROM "Property" WHERE slug = $1 AND id != $2',
          [slug, propertyId]
        );
        if (slugCheck.length === 0) break;
        slugSuffix += 1;
        slug = `${baseSlug}-${slugSuffix}`;
      }

      if (existingProp && existingProp.type !== prop.type) {
        if (prop.type === 'hotel' && existingProp.type !== 'hotel') {
          await client.query(
            'DELETE FROM "PropertyUnit" WHERE "propertyId" = $1',
            [propertyId]
          );
        }
        if (prop.type !== 'hotel' && existingProp.type === 'hotel') {
          await client.query(
            'DELETE FROM "RoomType" WHERE "propertyId" = $1',
            [propertyId]
          );
        }
      }

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

      const rulesJson = JSON.stringify(basePropertyData.rules);
      const rulesEnJson = JSON.stringify(basePropertyData.rulesEn);
      const imagesCategorizedJson = JSON.stringify(basePropertyData.imagesCategorized);
      const facilitiesJson = JSON.stringify(basePropertyData.facilities);

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
           image = EXCLUDED.image, images = EXCLUDED.images, "imagesCategorized" = EXCLUDED."imagesCategorized",
           facilities = EXCLUDED.facilities, rules = EXCLUDED.rules, "rulesEn" = EXCLUDED."rulesEn",
           notes = EXCLUDED.notes, "notesEn" = EXCLUDED."notesEn",
           "isGroupFriendly" = EXCLUDED."isGroupFriendly", "minGroupSize" = EXCLUDED."minGroupSize",
           version = "Property".version + 1, "updatedAt" = NOW()`,
        [
          propertyId,
          slug,
          basePropertyData.nameId,
          basePropertyData.nameEn,
          basePropertyData.type,
          basePropertyData.locationId,
          basePropertyData.locationEn,
          basePropertyData.mapsUrl,
          basePropertyData.capacityMin,
          basePropertyData.capacityMax,
          basePropertyData.pricingWeekday,
          basePropertyData.pricingWeekend,
          basePropertyData.pricingMode,
          basePropertyData.monthlyPrice,
          basePropertyData.monthlyPricingWNI,
          basePropertyData.monthlyPricingWNA,
          basePropertyData.extraChargeAmount,
          basePropertyData.extraChargeUnit,
          basePropertyData.deposit,
          basePropertyData.description,
          basePropertyData.descriptionEn,
          basePropertyData.image,
          basePropertyData.images,
          imagesCategorizedJson,
          facilitiesJson,
          rulesJson,
          rulesEnJson,
          basePropertyData.notes,
          basePropertyData.notesEn,
          basePropertyData.isGroupFriendly,
          basePropertyData.minGroupSize,
        ]
      );

      // ===== HANDLE UNITS (non-hotel) =====
      if (prop.type !== 'hotel' && prop.units) {
        const { rows: existingUnits } = await client.query(
          'SELECT "unitId" FROM "PropertyUnit" WHERE "propertyId" = $1',
          [propertyId]
        );
        const existingUnitIds = existingUnits.map((u: any) => u.unitId);
        const requestUnitIds = prop.units
          .map((u: any) => u.unitId)
          .filter(Boolean);
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

      // ===== HANDLE ROOMTYPES (hotel) =====
      if (prop.type === 'hotel' && prop.roomTypes) {
        const { rows: existingRoomTypes } = await client.query(
          'SELECT id, "roomTypeId" FROM "RoomType" WHERE "propertyId" = $1',
          [propertyId]
        );
        const existingRoomTypeIds = existingRoomTypes.map(
          (rt: any) => rt.roomTypeId
        );
        const requestRoomTypeIds = prop.roomTypes
          .map((rt: any) => rt.id)
          .filter(Boolean);
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
          const roomTypeId =
            rt.id ||
            `rt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
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
              createId(),
              roomTypeId,
              rt.nameId,
              rt.nameEn,
              rt.capacity || 2,
              rt.priceWeekday || 0,
              rt.priceWeekend || 0,
              rt.images || [],
              propertyId,
            ]
          );
          const roomTypeDbId = roomTypeRows[0].id;

          if (rt.rooms) {
            const { rows: existingRooms } = await client.query(
              'SELECT "roomId" FROM "Room" WHERE "roomTypeId" = $1',
              [roomTypeDbId]
            );
            const existingRoomIds = existingRooms.map((r: any) => r.roomId);
            const requestRoomIds = rt.rooms
              .map((r: any) => r.id)
              .filter(Boolean);
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
              const roomId =
                room.id ||
                `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
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

      await client.query('COMMIT');

      const { rows: newPropertyRows } = await client.query(
        'SELECT * FROM "Property" WHERE id = $1',
        [propertyId]
      );
      const newProperty = newPropertyRows[0];
      const serialized = serializeProperty({
        ...newProperty,
        roomTypes: prop.roomTypes || [],
        units: prop.units || [],
      });

      return NextResponse.json({ success: true, property: serialized });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('POST /api/admin/properties error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create property',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}