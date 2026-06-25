// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getAdminSession } from '@/lib/auth/admin';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'properties');

// Mapping extension dari MIME type yang sudah divalidasi.
// Jangan ambil extension dari nama file asli (file.name) — itu bisa
// dipalsukan dan tidak selalu konsisten dengan tipe MIME sebenarnya.
const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function POST(request: NextRequest){
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    // Validasi tipe MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.' },
        { status: 400 }
      );
    }

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB.' },
        { status: 400 }
      );
    }

    // Baca file sebagai buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate nama unik — extension diambil dari MIME type yang sudah
    // divalidasi di atas, bukan dari file.name asli.
    const ext = EXT_MAP[file.type] || '.jpg';
    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Buat direktori jika belum ada
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Simpan file
    await writeFile(filePath, buffer);

    // URL publik
    const url = `/uploads/properties/${fileName}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan file di server.' },
      { status: 500 }
    );
  }
}