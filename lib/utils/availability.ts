// lib/utils/availability.ts

import { Booking } from '@/lib/types';
import { normalizeDate, parseDate, isDateInRange, isDateBeforeOrEqual, isDateAfterOrEqual, isDateBefore, isDateAfter } from './date';

/**
 * Menentukan mode availability berdasarkan tipe properti
 * hotel & kos → "unit", sisanya → "property"
 */
export function getAvailabilityMode(propertyType: string): "property" | "unit" {
  return (propertyType === 'hotel' || propertyType === 'kos') ? 'unit' : 'property';
}

/**
 * Generate ID unik untuk booking
 */
export function generateBookingId(): string {
  return `bk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate ID unik untuk unit
 */
export function generateUnitId(): string {
  return `unit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Cek apakah suatu range tanggal available (tidak overlap dengan booking existing)
 * Menggunakan date-fns untuk konsistensi timezone
 */
export function isDateRangeAvailable(bookings: Booking[], startDate: string, endDate: string): boolean {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (isDateBeforeOrEqual(end, start)) return false;

  for (const booking of bookings) {
    const bookingStart = normalizeDate(booking.startDate);
    const bookingEnd = normalizeDate(booking.endDate);

    // Cek overlap: start < bookingEnd && end > bookingStart (strict, endDate eksklusif)
    if (isDateBefore(start, bookingEnd) && isDateAfter(end, bookingStart)) {
      return false;
    }
  }
  return true;
}

/**
 * Cek apakah suatu tanggal spesifik available
 */
export function isDateAvailable(bookings: Booking[], date: string): boolean {
  const checkDate = normalizeDate(date);

  for (const booking of bookings) {
    const bookingStart = normalizeDate(booking.startDate);
    const bookingEnd = normalizeDate(booking.endDate);

    if (isDateInRange(checkDate, bookingStart, bookingEnd)) {
      return false;
    }
  }
  return true;
}

/**
 * Expand semua range booking menjadi array tanggal individual
 * Berguna untuk render calendar (highlight tanggal yang dibooking)
 */
export function getBookedDates(bookings: Booking[]): string[] {
  const bookedDates: string[] = [];

  for (const booking of bookings) {
    const start = normalizeDate(booking.startDate);
    const end = normalizeDate(booking.endDate);

    const current = parseDate(start);

    while (true) {
      const currentDate = normalizeDate(current);

      // endDate bersifat exclusive (tanggal checkout tidak diblok)
      if (!isDateBefore(currentDate, end)) {
        break;
      }

      bookedDates.push(currentDate);
      current.setDate(current.getDate() + 1);
    }
  }

  return bookedDates;
}

/**
 * Group tanggal-tanggal yang berurutan menjadi range
 * Input: array tanggal string (YYYY-MM-DD)
 * Output: array range { startDate, endDate } dengan endDate eksklusif
 */
export function groupConsecutiveDates(dates: string[]): { startDate: string; endDate: string }[] {
  if (dates.length === 0) return [];

  const sortedDates = [...dates].sort();
  const result: { startDate: string; endDate: string }[] = [];

  let currentStart = sortedDates[0];
  let currentEnd = normalizeDate(new Date(sortedDates[0]));
  const endDateObj = new Date(currentEnd);
  endDateObj.setDate(endDateObj.getDate() + 1);
  currentEnd = endDateObj.toISOString().split('T')[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = normalizeDate(sortedDates[i - 1]);
    const currDate = normalizeDate(sortedDates[i]);

    // Cek apakah berurutan (selisih 1 hari)
    const prev = new Date(prevDate);
    const curr = new Date(currDate);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      // Masih dalam range yang sama, update endDate
      const endObj = new Date(currDate);
      endObj.setDate(endObj.getDate() + 1);
      currentEnd = endObj.toISOString().split('T')[0];
    } else {
      // Range putus, simpan range sebelumnya
      result.push({
        startDate: currentStart,
        endDate: currentEnd,
      });
      // Mulai range baru
      currentStart = sortedDates[i];
      const endObj = new Date(sortedDates[i]);
      endObj.setDate(endObj.getDate() + 1);
      currentEnd = endObj.toISOString().split('T')[0];
    }
  }

  // Push range terakhir
  result.push({
    startDate: currentStart,
    endDate: currentEnd,
  });

  return result;
}

/**
 * Format tanggal ke display yang lebih user-friendly
 * Menggunakan date-fns untuk konsistensi
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Hitung jumlah malam dari startDate ke endDate (eksklusif)
 */
export function getNights(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

