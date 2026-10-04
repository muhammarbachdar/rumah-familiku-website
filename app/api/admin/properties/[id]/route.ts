// app/api/admin/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { getAdminSession } from '@/lib/auth/admin';
import { generateUnitId } from '@/lib/utils/availability';
import { normalizeDate } from '@/lib/utils/date';
import { PropertySchema } from '@/lib/schemas';
import { ZodError } from 'zod';

// ===== HELPERS =====

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function validateProperty(prop: any): string[] {
  const errors: string[] = [];

  if (prop.capacity && prop.capacity.min > prop.capacity.max) {
    errors.push('Kapasitas minimum tidak boleh lebih besar dari kapasitas maksimum.');
  }

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const { rows: propertyRows } = await pool.query(
      'SELECT * FROM "Property" WHERE id = $1',
      [id]
    );

    if (!propertyRows || propertyRows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const { rows: units } = await pool.query(
      'SELECT * FROM "PropertyUnit" WHERE "propertyId" = $1',
      [id]
    );
    const { rows: roomTypes } = await pool.query(
      'SELECT * FROM "RoomType" WHERE "propertyId" = $1',
      [id]
    );
    const roomTypeIds = roomTypes.map((rt: any) => rt.id);
    const { rows: rooms } =
      roomTypeIds.length > 0
        ? await pool.query('SELECT * FROM "Room" WHERE "roomTypeId" = ANY($1)', [
            roomTypeIds,
          ])
        : { rows: [] };

    const roomsByRoomType: Record<string, any[]> = {};
    for (const r of rooms) {
      if (!roomsByRoomType[r.roomTypeId]) roomsByRoomType[r.roomTypeId] = [];
      roomsByRoomType[r.roomTypeId].push(r);
    }

    const property = {
      ...propertyRows[0],
      units,
      roomTypes: roomTypes.map((rt: any) => ({
        ...rt,
        rooms: roomsByRoomType[rt.id] || [],
      })),
    };

    return NextResponse.json(serializeProperty(property));
  } catch (error) {
    console.error('GET /api/admin/properties/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

// ===== PUT =====

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (body.id && body.id !== id) {
      return NextResponse.json(
        { error: 'Property ID in URL does not match body' },
        { status: 400 }
      );
    }

    let prop;
    try {
      prop = PropertySchema.parse({ ...body, id });
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

      const { rows: existingRows } = await client.query(
        'SELECT * FROM "Property" WHERE id = $1',
        [id]
      );
      if (!existingRows || existingRows.length === 0) {
        throw new Error('Property not found');
      }
      const existingProp = existingRows[0];

      if (existingProp.version !== prop.version) {
        throw new Error(
          `Properti "${prop.nameId}" telah diubah oleh admin lain. Silakan refresh dan coba lagi.`
        );
      }

      const baseSlug = prop.slug || generateSlug(prop.nameId);
      let slug = baseSlug;
      let slugSuffix = 1;
      while (true) {
        const { rows: slugCheck } = await client.query(
          'SELECT id FROM "Property" WHERE slug = $1 AND id != $2',
          [slug, id]
        );
        if (slugCheck.length === 0) break;
        slugSuffix += 1;
        slug = `${baseSlug}-${slugSuffix}`;
      }

      if (existingProp.type !== prop.type) {
        if (prop.type === 'hotel' && existingProp.type !== 'hotel') {
          await client.query(
            'DELETE FROM "PropertyUnit" WHERE "propertyId" = $1',
            [id]
          );
        }
        if (prop.type !== 'hotel' && existingProp.type === 'hotel') {
          await client.query('DELETE FROM "RoomType" WHERE "propertyId" = $1', [
            id,
          ]);
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
        `UPDATE "Property" SET
           slug = $1, "nameId" = $2, "nameEn" = $3, type = $4,
           "locationId" = $5, "locationEn" = $6, "mapsUrl" = $7,
           "capacityMin" = $8, "capacityMax" = $9,
           "pricingWeekday" = $10, "pricingWeekend" = $11, "pricingMode" = $12,
           "monthlyPrice" = $13, "monthlyPricingWNI" = $14, "monthlyPricingWNA" = $15,
           "extraChargeAmount" = $16, "extraChargeUnit" = $17, deposit = $18,
           description = $19, "descriptionEn" = $20,
           image = $21, images = $22, "imagesCategorized" = $23,
           facilities = $24, rules = $25, "rulesEn" = $26,
           notes = $27, "notesEn" = $28,
           "isGroupFriendly" = $29, "minGroupSize" = $30,
           version = "Property".version + 1, "updatedAt" = NOW()
         WHERE id = $31`,
        [
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
          id,
        ]
      );

      // ===== HANDLE UNITS (non-hotel) =====
      if (prop.type !== 'hotel' && prop.units) {
        const { rows: existingUnits } = await client.query(
          'SELECT "unitId" FROM "PropertyUnit" WHERE "propertyId" = $1',
          [id]
        );
        const existingUnitIds = existingUnits.map((u: any) => u.unitId);
        const requestUnitIds = prop.units
          .map((u: any) => u.unitId)
          .filter(Boolean);
        const unitIdsToDelete = existingUnitIds.filter(
          (uid: string) => !requestUnitIds.includes(uid)
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
            [unitIdsToDelete, id]
          );
        }

        for (const unit of prop.units) {
          const unitId = unit.unitId || generateUnitId();
          await client.query(
            `INSERT INTO "PropertyUnit" (id, "unitId", "unitName", "propertyId", "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,NOW(),NOW())
             ON CONFLICT ("unitId") DO UPDATE SET "unitName" = EXCLUDED."unitName", "propertyId" = EXCLUDED."propertyId", "updatedAt" = NOW()`,
            [createId(), unitId, unit.unitName, id]
          );
        }
      }

      // ===== HANDLE ROOMTYPES (hotel) =====
      if (prop.type === 'hotel' && prop.roomTypes) {
        const { rows: existingRoomTypes } = await client.query(
          'SELECT id, "roomTypeId" FROM "RoomType" WHERE "propertyId" = $1',
          [id]
        );
        const existingRoomTypeIds = existingRoomTypes.map(
          (rt: any) => rt.roomTypeId
        );
        const requestRoomTypeIds = prop.roomTypes
          .map((rt: any) => rt.id)
          .filter(Boolean);
        const roomTypeIdsToDelete = existingRoomTypeIds.filter(
          (rtid: string) => !requestRoomTypeIds.includes(rtid)
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
            [roomTypeIdsToDelete, id]
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
              id,
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
              (rid: string) => !requestRoomIds.includes(rid)
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

      const { rows: updatedRows } = await client.query(
        'SELECT * FROM "Property" WHERE id = $1',
        [id]
      );
      const updatedProperty = updatedRows[0];
      const { rows: units } = await client.query(
        'SELECT * FROM "PropertyUnit" WHERE "propertyId" = $1',
        [id]
      );
      const { rows: roomTypesData } = await client.query(
        'SELECT * FROM "RoomType" WHERE "propertyId" = $1',
        [id]
      );
      const roomTypeIdsData = roomTypesData.map((rt: any) => rt.id);
      const { rows: roomsData } =
        roomTypeIdsData.length > 0
          ? await pool.query('SELECT * FROM "Room" WHERE "roomTypeId" = ANY($1)', [
              roomTypeIdsData,
            ])
          : { rows: [] };

      const roomsByRoomTypeData: Record<string, any[]> = {};
      for (const r of roomsData) {
        if (!roomsByRoomTypeData[r.roomTypeId])
          roomsByRoomTypeData[r.roomTypeId] = [];
        roomsByRoomTypeData[r.roomTypeId].push(r);
      }

      const result = {
        ...updatedProperty,
        units,
        roomTypes: roomTypesData.map((rt: any) => ({
          ...rt,
          rooms: roomsByRoomTypeData[rt.id] || [],
        })),
      };

      return NextResponse.json({
        success: true,
        property: serializeProperty(result),
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('PUT /api/admin/properties/[id] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update property',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ===== DELETE =====

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const today = normalizeDate(new Date());

    const { rows: propRows } = await pool.query(
      'SELECT * FROM "Property" WHERE id = $1',
      [id]
    );
    if (!propRows || propRows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    const property = propRows[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: propBookings } = await client.query(
        'SELECT * FROM "Booking" WHERE "propertyId" = $1 AND "unitId" IS NULL AND "roomId" IS NULL',
        [id]
      );
      const activeBookings = propBookings.filter(
        (b: any) => b.endDate > today
      );
      if (activeBookings.length > 0) {
        return NextResponse.json(
          {
            error: `Properti ini masih memiliki ${activeBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.`,
          },
          { status: 400 }
        );
      }

      const { rows: units } = await client.query(
        'SELECT * FROM "PropertyUnit" WHERE "propertyId" = $1',
        [id]
      );
      for (const unit of units) {
        const { rows: unitBookings } = await client.query(
          'SELECT * FROM "Booking" WHERE "unitId" = $1',
          [unit.id]
        );
        const activeUnitBookings = unitBookings.filter(
          (b: any) => b.endDate > today
        );
        if (activeUnitBookings.length > 0) {
          return NextResponse.json(
            {
              error: `Unit "${unit.unitName}" masih memiliki ${activeUnitBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.`,
            },
            { status: 400 }
          );
        }
      }

      const { rows: roomTypes } = await client.query(
        'SELECT * FROM "RoomType" WHERE "propertyId" = $1',
        [id]
      );
      for (const roomType of roomTypes) {
        const { rows: rooms } = await client.query(
          'SELECT * FROM "Room" WHERE "roomTypeId" = $1',
          [roomType.id]
        );
        for (const room of rooms) {
          const { rows: roomBookings } = await client.query(
            'SELECT * FROM "Booking" WHERE "roomId" = $1',
            [room.id]
          );
          const activeRoomBookings = roomBookings.filter(
            (b: any) => b.endDate > today
          );
          if (activeRoomBookings.length > 0) {
            return NextResponse.json(
              {
                error: `Kamar "${room.roomNumber}" masih memiliki ${activeRoomBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.`,
              },
              { status: 400 }
            );
          }
        }
      }

      await client.query('DELETE FROM "Property" WHERE id = $1', [id]);
      await client.query('COMMIT');

      return NextResponse.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('DELETE /api/admin/properties/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}