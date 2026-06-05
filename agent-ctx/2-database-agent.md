# Task 2 - Database Agent

## Task: Update Prisma Schema and Seed Database

### Completed Work

1. **Prisma Schema Updated** (`prisma/schema.prisma`)
   - Removed generic `User` and `Post` models
   - Added 4 PRAGA Living models:
     - `Apartment` — Complete unit inventory with typology, pricing, views, features
     - `Amenity` — Building amenities with categories (wellness, social, work, leisure)
     - `Lead` — Sales leads from website, WhatsApp, referrals
     - `AdminUser` — Admin authentication with roles

2. **Seed File Created** (`prisma/seed.ts`)
   - 76 apartments across 5 typologies and 12 floors:
     - 24 Studios (33m², Pisos 1-4)
     - 6 Studio Plus (35m², Pisos 3-4)
     - 20 Apartamento 2H (57m², Pisos 5-8)
     - 24 Apartamento Premium 2H (74m², Pisos 5-12)
     - 2 Penthouse 3H (97m², Pisos 11-12)
   - Realistic COP pricing with floor/unit premiums
   - Some units pre-marked as sold/reserved
   - 10 amenities with descriptions and categories
   - 1 default admin user

3. **Package.json Updated**
   - Added `db:seed` and `prisma:seed` scripts
   - Added `prisma.seed` configuration

4. **Environment Updated**
   - `.env` DATABASE_URL changed to `file:/home/z/my-project/db/dev.db`

5. **Database Operations**
   - `prisma generate` ✅
   - `prisma db push` ✅
   - Seed executed ✅
   - Data verified: 76 apartments, 10 amenities, 1 admin

### Notes for Other Agents
- Use `import { db } from '@/lib/db'` to access PrismaClient
- Apartment features are stored as JSON strings (use `JSON.parse()` on frontend)
- Status values: available, reserved, sold
- Lead status values: new, contacted, qualified, lost
- Lead source values: website, whatsapp, referral
