// ============================================
// Hash a password with bcrypt (cost factor 12)
// ============================================
// Usage:
//   bun run scripts/hash-password.ts
//   bun run scripts/hash-password.ts "my-secret-password"
//
// Prints the bcrypt hash to stdout. Copy it into ADMIN_PASSWORD_HASH
// in your .env file or Vercel environment variables.

import bcrypt from 'bcryptjs'

const password = process.argv[2] || 'praga2024'

if (!process.argv[2]) {
  console.warn('⚠️  No password provided — using default "praga2024" for testing.')
  console.warn('   Pass your real password as the first argument:')
  console.warn('   bun run scripts/hash-password.ts "your-real-password"\n')
}

const hash = bcrypt.hashSync(password, 12)
console.log('Bcrypt hash (cost factor 12):')
console.log(hash)
console.log('\nAdd to .env:')
console.log(`ADMIN_PASSWORD_HASH="${hash}"`)
