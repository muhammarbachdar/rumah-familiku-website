// scripts/generate-password-hash.ts
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: tsx scripts/generate-password-hash.ts <password>');
  console.error('Example: tsx scripts/generate-password-hash.ts "MySecurePass123"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('\n=== Tambahkan ini ke .env.local ===');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('\n=== Contoh .env.local lengkap ===');
  console.log(`ADMIN_USERNAME=admin`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('\n=== Password asli: ***HAPUS DARI MANA-MANA SETELAH DIHASH*** ===');
});