// lib/auth/admin.ts
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { createSessionToken, verifySessionToken } from './session';

const SESSION_COOKIE_NAME = 'rumah-familiku-admin-session';

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

const ADMIN_USERNAME_SAFE: string = ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH_SAFE: string = ADMIN_PASSWORD_HASH;

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME_SAFE) return false;
  return await bcrypt.compare(password, ADMIN_PASSWORD_HASH_SAFE);
}

export async function createAdminSession(username: string): Promise<void> {
  const cookieStore = await cookies();
  const token = await createSessionToken(username);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getAdminSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    return await verifySessionToken(session?.value);
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}