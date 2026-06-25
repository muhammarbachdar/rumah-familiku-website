// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, createAdminSession } from '@/lib/auth/admin';

// ===== RATE LIMITING =====
// In-memory rate limiting (cocok untuk VPS/long-running server)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingMinutes = Math.ceil((record.resetAt - now) / 60000);
    return {
      allowed: false,
      message: `Terlalu banyak percobaan login. Coba lagi dalam ${remainingMinutes} menit.`,
    };
  }

  record.count += 1;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // Rate limiting check
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.message },
      { status: 429 }
    );
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi credentials dengan bcrypt
    const isValid = await validateAdminCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Buat session cookie
    await createAdminSession(username);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}