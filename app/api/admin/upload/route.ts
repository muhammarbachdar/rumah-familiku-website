// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getAdminSession } from '@/lib/auth/admin';
import fs from 'fs';
import sharp from 'sharp'; // ✅ TAMBAHKAN: import sharp

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 1200; // ✅ TAMBAHKAN: max width
const MAX_HEIGHT = 1200; // ✅ TAMBAHKAN: max height
const JPEG_QUALITY = 80; // ✅ TAMBAHKAN: kualitas kompresi (1-100)

const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR;
  }

  const cwd = /* turbopackIgnore: true */ process.cwd();
  const possiblePaths = [
    path.join(cwd, '../../public', 'uploads', 'properties'),
    path.join(cwd, 'public', 'uploads', 'properties'),
  ];

  for (const p of possiblePaths) {
    try {
      const parentDir = path.dirname(p);
      if (fs.existsSync(parentDir) || fs.existsSync(path.dirname(parentDir))) {
        return p;
      }
    } catch {
      // Ignore error
    }
  }

  return path.join(cwd, 'public', 'uploads', 'properties');
}

const UPLOAD_DIR = getUploadDir();

// ✅ TAMBAHKAN: Fungsi kompresi gambar
async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  let pipeline = sharp(buffer);

  // Resize jika lebih besar dari max
  const metadata = await pipeline.metadata();
  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize(MAX_WIDTH, null, { fit: 'inside', withoutEnlargement: true });
  }
  if (metadata.height && metadata.height > MAX_HEIGHT) {
    pipeline = pipeline.resize(null, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true });
  }

  // Konversi dan kompresi berdasarkan tipe
  switch (mimeType) {
    case 'image/jpeg':
      return pipeline.jpeg({ quality: JPEG_QUALITY, progressive: true }).toBuffer();
    case 'image/webp':
      return pipeline.webp({ quality: JPEG_QUALITY, lossless: false }).toBuffer();
    case 'image/png':
      return pipeline.png({ compressionLevel: 9, quality: JPEG_QUALITY }).toBuffer();
    default:
      return pipeline.toBuffer();
  }
}

export async function POST(request: NextRequest) {
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

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ TAMBAHKAN: Kompresi gambar
    let compressedBuffer: Buffer;
    let finalMimeType = file.type;

    try {
      compressedBuffer = await compressImage(buffer, file.type);
    } catch (compressError) {
      // Jika kompresi gagal, pakai original
      console.warn('Compression failed, using original:', compressError);
      compressedBuffer = buffer;
    }

    const ext = EXT_MAP[file.type] || '.jpg';
    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(filePath, compressedBuffer);

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