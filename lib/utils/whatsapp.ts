// lib/utils/whatsapp.ts

export function getWhatsAppURL(message: string, whatsappNumber?: string): string {
  const number = whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '628787695752';
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function formatPrice(price: number): string {
  if (price == null || isNaN(price)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Generate booking message untuk properti (non-hotel)
 */
export function generateBookingMessage(
  propertyName: string,
  capacity: number,
  locale: string
): string {
  if (locale === 'id') {
    return `Saya ingin booking ${propertyName} untuk ${capacity} orang. Tolong informasikan ketersediaan dan harga terbaru.`;
  }
  return `I want to book ${propertyName} for ${capacity} people. Please inform availability and latest price.`;
}

/**
 * Generate booking message khusus Hotel dengan Tipe Kamar, Check In, Check Out
 * NEW: untuk hotel dengan roomTypes
 */
export function generateHotelBookingMessage(
  hotelName: string,
  roomTypeName: string,
  capacity: number,
  checkIn: string,
  checkOut: string,
  locale: string
): string {
  const checkInDisplay = formatDate(checkIn);
  const checkOutDisplay = formatDate(checkOut);

  if (locale === 'id') {
    return `Saya ingin booking ${hotelName} - ${roomTypeName} untuk ${capacity} orang, Check In ${checkInDisplay}, Check Out ${checkOutDisplay}. Tolong informasikan ketersediaan dan harga terbaru.`;
  }
  return `I want to book ${hotelName} - ${roomTypeName} for ${capacity} people, Check In ${checkInDisplay}, Check Out ${checkOutDisplay}. Please inform availability and latest price.`;
}

export function getShareMessage(
  propertyName: string,
  url: string,
  locale: string
): string {
  if (locale === 'id') {
    return `Lihat properti ini: ${propertyName} - ${url}`;
  }
  return `Check out this property: ${propertyName} - ${url}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Check if promo is active dengan date-fns untuk timezone safety
 */
export function isPromoActive(validUntil: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return validUntil >= today;
}