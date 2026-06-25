// lib/maps.ts
//
// Helper untuk konversi link Google Maps biasa (hasil copy dari tombol
// Share di Google Maps, format panjang dengan koordinat) menjadi URL
// yang valid untuk dipakai di <iframe> embed.
//
// Contoh input yang didukung:
//   https://www.google.com/maps/place/Nama+Tempat/@-6.2088,106.8456,15z/...
//   https://www.google.com/maps/@-6.2088,106.8456,17z
//
// Contoh output:
//   https://maps.google.com/maps?q=-6.2088,106.8456&z=15&output=embed
//
// Link pendek (maps.app.goo.gl atau goo.gl/maps) TIDAK didukung,
// karena itu link redirect yang tidak bisa diresolve jadi koordinat
// tanpa request ke server Google secara langsung.

export function extractMapsEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Cari pola koordinat: @LAT,LONG,ZOOMz (zoom opsional)
  const match = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+(?:\.\d+)?)z)?/);

  if (!match) return null;

  const [, lat, lng, zoom] = match;
  const zoomLevel = zoom ? Math.round(parseFloat(zoom)) : 15;

  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoomLevel}&output=embed`;
}

// Dipakai di form admin untuk validasi ringan — bukan untuk blokir,
// hanya untuk kasih warning kalau link tidak dikenali formatnya.
export function isValidMapsLinkFormat(rawUrl: string): boolean {
  return extractMapsEmbedUrl(rawUrl) !== null;
}