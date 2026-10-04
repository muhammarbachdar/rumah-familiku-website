// scripts/generate-password-hash.ts
import bcrypt from 'bcryptjs';

/**
 * Script untuk generate password hash untuk admin
 * 
 * Cara menjalankan:
 * pnpm tsx scripts/generate-password-hash.ts <password>
 * 
 * Output:
 * Hash: $2a$10$...
 * 
 * Copy hash tersebut ke .env sebagai ADMIN_PASSWORD_HASH
 */

async function generateHash() {
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Usage: pnpm tsx scripts/generate-password-hash.ts <password>');
    console.error('   Example: pnpm tsx scripts/generate-password-hash.ts admin123');
    process.exit(1);
  }

  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    const hashB64 = Buffer.from(hash, 'utf-8').toString('base64');

    console.log('');
    console.log('✅ Password hash generated!');
    console.log('');
    console.log('📝 Copy this to your .env file:');
    console.log('');
    console.log(`ADMIN_PASSWORD_HASH_B64=${hashB64}`);
    console.log('');
    console.log('🔑 Password yang dimasukkan:', password);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to generate hash:', error);
    process.exit(1);
  }
}

generateHash()