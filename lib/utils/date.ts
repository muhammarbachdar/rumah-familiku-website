// lib/utils/date.ts
import { format, parseISO, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Normalize tanggal ke string YYYY-MM-DD tanpa timezone
 */
export function normalizeDate(date: string | Date): string {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/**
 * Parse tanggal dari string dengan aman (pakai parseISO date-fns)
 */
export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Format tanggal untuk display
 */
export function formatDateDisplay(dateStr: string, locale: 'id' | 'en' = 'id'): string {
  const date = parseDate(dateStr);
  const localeMap = { id, en: undefined };
  return format(date, 'dd MMM yyyy', { locale: localeMap[locale] as any });
}

/**
 * Cek apakah tanggal1 <= tanggal2
 */
export function isDateBeforeOrEqual(date1: string, date2: string): boolean {
  const d1 = startOfDay(parseDate(date1));
  const d2 = startOfDay(parseDate(date2));
  return isBefore(d1, d2) || isEqual(d1, d2);
}

/**
 * Cek apakah tanggal1 >= tanggal2
 */
export function isDateAfterOrEqual(date1: string, date2: string): boolean {
  const d1 = startOfDay(parseDate(date1));
  const d2 = startOfDay(parseDate(date2));
  return isAfter(d1, d2) || isEqual(d1, d2);
}

/**
 * Cek apakah dua range tanggal overlap
 */
export function isDateRangeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // start1 < end2 && end1 > start2
  const s1 = parseDate(start1);
  const e1 = parseDate(end1);
  const s2 = parseDate(start2);
  const e2 = parseDate(end2);

  return isBefore(s1, e2) && isAfter(e1, s2);
}

/**
 * Cek apakah suatu tanggal berada dalam range [start, end)
 */
export function isDateInRange(date: string, start: string, end: string): boolean {
  const d = startOfDay(parseDate(date));
  const s = startOfDay(parseDate(start));
  const e = startOfDay(parseDate(end));

  return (isEqual(d, s) || isAfter(d, s)) && isBefore(d, e);
}
export function isDateBefore(date1: string, date2: string): boolean {
  const d1 = startOfDay(parseDate(date1));
  const d2 = startOfDay(parseDate(date2));
  return isBefore(d1, d2);
}

export function isDateAfter(date1: string, date2: string): boolean {
  const d1 = startOfDay(parseDate(date1));
  const d2 = startOfDay(parseDate(date2));
  return isAfter(d1, d2);
}

/**
 * Convert Date object ke string YYYY-MM-DD menggunakan LOCAL time
 * (BUKAN toISOString() yang konversi ke UTC dan bisa geser tanggal)
 */
export function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}