// lib/data/availability.ts
// Data layer untuk availability booking. Dipanggil LANGSUNG dari Server Component
// (halaman publik) maupun dari app/api/admin/data/route.ts, tanpa HTTP fetch.

import { pool } from '@/lib/prisma';
import { Booking } from '@/lib/types';
import { getAvailabilityMode } from '@/lib/utils/availability';

export function toBookingShape(b: any): Booking {
  return { id: b.id, startDate: b.startDate, endDate: b.endDate, note: b.note ?? '' };
}

export async function getAvailabilityForProperty(propertyId: string) {
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

  const mode = getAvailabilityMode(property.type);

  if (mode === 'property') {
    return {
      mode: 'property' as const,
      bookings: property.bookings.map(toBookingShape),
    };
  }

  if (property.type === 'kos') {
    return {
      mode: 'unit' as const,
      units: property.units.map((u: any) => ({
        unitId: u.unitId,
        unitName: u.unitName,
        bookings: u.bookings.map(toBookingShape),
      })),
    };
  }

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

export async function getAllAvailability() {
  const { rows: properties } = await pool.query('SELECT id FROM "Property"');
  const result: Record<string, any> = {};
  for (const p of properties) {
    const avail = await getAvailabilityForProperty(p.id);
    if (avail) result[p.id] = avail;
  }
  return result;
}