// lib/prisma.ts
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

/**
 * Konfigurasi SSL — dikontrol eksplisit lewat env var DATABASE_SSL,
 * BUKAN dari NODE_ENV (karena NODE_ENV selalu 'production' saat `npm run build`,
 * termasuk saat build lokal, yang akan salah nyalain SSL ke DB lokal yang tidak support SSL).
 * Set DATABASE_SSL=true di .env production HANYA jika sudah dikonfirmasi
 * database production butuh/support SSL.
 */
const sslConfig = process.env.DATABASE_SSL === 'true'
  ? { rejectUnauthorized: false }
  : false;

export const pool =
  global.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // shared hosting, jangan terlalu besar
    ssl: sslConfig,
    // Tambahan untuk koneksi stabil di shared hosting
    connectionTimeoutMillis: 10000, // 10 detik timeout
    idleTimeoutMillis: 30000, // 30 detik idle timeout
  });

// Event listener untuk error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}