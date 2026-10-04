// scripts/cleanup-orphan-files.ts
import { pool } from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';

/**
 * Script untuk membersihkan file upload orphan
 * 
 * Cara menjalankan:
 * pnpm tsx -r dotenv/config scripts/cleanup-orphan-files.ts --dry-run
 * 
 * Atau tanpa dry-run (beneran hapus):
 * pnpm tsx -r dotenv/config scripts/cleanup-orphan-files.ts
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'properties');

/**
 * Safe JSON parse dengan fallback
 */
function safeJsonParse<T>(value: any, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    // Skip jika string kosong atau "[]" atau "{}"
    if (value === '' || value === '[]' || value === '{}' || value === '""') {
      return fallback;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value ?? fallback;
}

/**
 * Ekstrak filename dari URL
 */
function extractFilename(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    return path.basename(url);
  } catch {
    return null;
  }
}

async function getUsedFilenames(): Promise<Set<string>> {
  const usedFilenames = new Set<string>();

  try {
    // 1. Cek kolom image (main image)
    const { rows: imageRows } = await pool.query(
      `SELECT image FROM "Property" WHERE image IS NOT NULL AND image != ''`
    );
    for (const row of imageRows) {
      const filename = extractFilename(row.image);
      if (filename) usedFilenames.add(filename);
    }

    // 2. Cek kolom images (array)
    const { rows: imagesRows } = await pool.query(
      `SELECT images FROM "Property" WHERE images IS NOT NULL AND images != '[]' AND images != '""'`
    );
    for (const row of imagesRows) {
      const urls = safeJsonParse<string[]>(row.images, []);
      if (Array.isArray(urls)) {
        for (const url of urls) {
          const filename = extractFilename(url);
          if (filename) usedFilenames.add(filename);
        }
      }
    }

    // 3. Cek kolom imagesCategorized (array of { url, category })
    const { rows: categorizedRows } = await pool.query(
      `SELECT "imagesCategorized" FROM "Property" WHERE "imagesCategorized" IS NOT NULL AND "imagesCategorized" != '[]' AND "imagesCategorized" != '""'`
    );
    for (const row of categorizedRows) {
      type ImageItem = { url: string; category?: string };
      const items = safeJsonParse<ImageItem[]>(row.imagesCategorized, []);
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
            const filename = extractFilename(item.url);
            if (filename) usedFilenames.add(filename);
          }
        }
      }
    }

    // 4. Cek kolom images di RoomType
    const { rows: roomTypeRows } = await pool.query(
      `SELECT images FROM "RoomType" WHERE images IS NOT NULL AND images != '[]' AND images != '""'`
    );
    for (const row of roomTypeRows) {
      const urls = safeJsonParse<string[]>(row.images, []);
      if (Array.isArray(urls)) {
        for (const url of urls) {
          const filename = extractFilename(url);
          if (filename) usedFilenames.add(filename);
        }
      }
    }

  } catch (error) {
    console.error('Error fetching used filenames:', error);
  }

  return usedFilenames;
}

async function cleanupOrphanFiles(dryRun: boolean = false) {
  console.log('🧹 Starting orphan file cleanup...');
  console.log(`📁 Scanning directory: ${UPLOAD_DIR}`);
  console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (tidak menghapus)' : 'LIVE (akan menghapus)'}`);
  console.log('');

  // Check if directory exists
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    console.log('❌ Upload directory does not exist. Nothing to clean.');
    return;
  }

  // Get all files in upload directory
  const files = await fs.readdir(UPLOAD_DIR);
  console.log(`📄 Found ${files.length} files in upload directory`);

  if (files.length === 0) {
    console.log('✅ No files to check.');
    return;
  }

  // Get used filenames from database
  const usedFilenames = await getUsedFilenames();
  console.log(`📊 Found ${usedFilenames.size} files referenced in database`);

  // Find orphan files
  const orphanFiles: string[] = [];
  for (const file of files) {
    if (!usedFilenames.has(file)) {
      orphanFiles.push(file);
    }
  }

  console.log(`🗑️ Found ${orphanFiles.length} orphan files`);

  if (orphanFiles.length === 0) {
    console.log('✅ No orphan files to clean.');
    return;
  }

  // Show orphan files (max 20)
  console.log('');
  console.log('📋 Orphan files:');
  const displayCount = Math.min(orphanFiles.length, 20);
  for (let i = 0; i < displayCount; i++) {
    console.log(`   - ${orphanFiles[i]}`);
  }
  if (orphanFiles.length > 20) {
    console.log(`   ... and ${orphanFiles.length - 20} more files`);
  }

  // Calculate total size
  let totalSize = 0;
  let fileCount = 0;
  for (const file of orphanFiles) {
    try {
      const stat = await fs.stat(path.join(UPLOAD_DIR, file));
      totalSize += stat.size;
      fileCount++;
    } catch {
      // Skip if file already deleted
    }
  }
  console.log('');
  console.log(`📦 Total size to clean: ${(totalSize / 1024 / 1024).toFixed(2)} MB (${fileCount} files)`);

  if (dryRun) {
    console.log('');
    console.log('⚠️ DRY RUN mode - no files were deleted.');
    console.log('   Run without --dry-run to actually delete files.');
    return;
  }

  // Confirm before deleting
  console.log('');
  console.log('⚠️ WARNING: This will permanently delete these files.');
  console.log(`   ${fileCount} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  // Wait 5 seconds for user to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Delete orphan files
  let deletedCount = 0;
  let deletedSize = 0;
  let errorCount = 0;

  for (const file of orphanFiles) {
    try {
      const filePath = path.join(UPLOAD_DIR, file);
      const stat = await fs.stat(filePath);
      await fs.unlink(filePath);
      deletedCount++;
      deletedSize += stat.size;
      
      if (deletedCount % 10 === 0) {
        console.log(`   Deleted ${deletedCount}/${fileCount} files...`);
      }
    } catch (err) {
      errorCount++;
      console.error(`   ❌ Failed to delete ${file}:`, err);
    }
  }

  console.log('');
  console.log('✅ Cleanup complete!');
  console.log(`   Deleted: ${deletedCount} files`);
  console.log(`   Freed space: ${(deletedSize / 1024 / 1024).toFixed(2)} MB`);
  if (errorCount > 0) {
    console.log(`   ⚠️ Errors: ${errorCount} files failed to delete`);
  }
}

// Run script
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    await cleanupOrphanFiles(dryRun);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();