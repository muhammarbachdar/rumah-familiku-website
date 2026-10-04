// lib/prisma.ts
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

/**
 * Konfigurasi SSL berdasarkan environment
 * - Development: SSL dimatikan
 * - Production: SSL diaktifkan dengan rejectUnauthorized: false
 *   (cocok untuk IDCloudHost yang pakai self-signed certificate)
 */
const sslConfig = process.env.NODE_ENV === 'production' 
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