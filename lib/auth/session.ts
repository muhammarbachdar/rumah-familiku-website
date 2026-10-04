// lib/auth/session.ts
// Signed session token (HMAC-SHA256) — edge-compatible, pakai Web Crypto API
// (bukan Node 'crypto') supaya bisa diverifikasi langsung di middleware.ts

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

function getSecretKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET wajib di-set di environment variables.');
  }
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function createSessionToken(username: string): Promise<string> {
  const key = await getSecretKey();
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}.${expiresAt}`;
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [username, expiresAtStr, signatureB64] = parts;
  const expiresAt = Number(expiresAtStr);
  if (!username || !expiresAt || Number.isNaN(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  try {
    const key = await getSecretKey();
    const payload = `${username}.${expiresAtStr}`;
    const signature = fromBase64Url(signatureB64);
    const valid = await crypto.subtle.verify('HMAC', key, signature as BufferSource, new TextEncoder().encode(payload));
    return valid ? username : null;
  } catch {
    return null;
  }
}