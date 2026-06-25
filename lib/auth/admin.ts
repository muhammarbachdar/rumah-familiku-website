// lib/auth/admin.ts
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'rumah-familiku-admin-session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 hari

// Credentials dari environment variables (WAJIB di-set, tidak ada fallback)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH_B64 = process.env.ADMIN_PASSWORD_HASH_B64;
const ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH_B64
  ? Buffer.from(ADMIN_PASSWORD_HASH_B64, 'base64').toString('utf-8')
  : undefined;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
  throw new Error(
    'ADMIN_USERNAME dan ADMIN_PASSWORD_HASH_B64 wajib di-set di environment variables.\n' +
    'Generate hash password dengan: pnpm tsx scripts/generate-password-hash.ts <password>'
  );
}

// Type assertion untuk memberi tahu TypeScript bahwa nilai ini pasti string
const ADMIN_USERNAME_SAFE: string = ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH_SAFE: string = ADMIN_PASSWORD_HASH;

/**
 * Validasi kredensial admin menggunakan bcrypt (hash password disimpan di .env)
 */
export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME_SAFE) return false;
  return await bcrypt.compare(password, ADMIN_PASSWORD_HASH_SAFE);
}

/**
 * Buat session cookie untuk admin (httpOnly, secure)
 */
export async function createAdminSession(username: string): Promise<void> {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + SESSION_DURATION);

  cookieStore.set(SESSION_COOKIE_NAME, username, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

/**
 * Hapus session cookie admin (logout)
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Dapatkan session admin saat ini (return username atau null)
 */
export async function getAdminSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    return session?.value || null;
  } catch {
    // Jika cookies() gagal (misal di Server Component), return null
    return null;
  }
}

/**
 * Cek apakah user saat ini adalah admin yang terautentikasi
 * (digunakan di API routes dan Server Components)
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}