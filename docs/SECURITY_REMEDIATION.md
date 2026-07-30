# PRAGA Living — Security Remediation Guide

This document explains the security fixes applied to this codebase and the
manual steps still required by the project owner.

## 🚨 Critical: Secrets exposed in git history

The file `.env` was accidentally committed to git in early commits. It
contained:

- `NEXTAUTH_SECRET` (used to sign admin JWTs — anyone with this can forge admin sessions)
- `ADMIN_PASSWORD_HASH` (bcrypt hash of the admin password)

The `.env` file itself has been removed from the working tree and added to
`.gitignore`, **but the secrets remain in the git history**. Removing them
from the latest commit is not enough — `git log -p` still shows them.

### Manual steps the project owner MUST do

1. **Rotate the exposed secrets immediately** (assume they are public):
   - Generate a new `NEXTAUTH_SECRET`:
     ```bash
     openssl rand -base64 32
     ```
   - Set it as an environment variable in Vercel: Project Settings → Environment Variables.
   - In Supabase Dashboard → Settings → API: rotate both
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
   - Set the new values in Vercel env vars.
   - Re-deploy.

2. **Change the admin password**:
   ```bash
   bun run scripts/hash-password.ts "your-new-strong-password"
   ```
   Copy the output into `ADMIN_PASSWORD_HASH` in Vercel env vars.

3. **Purge git history** (optional but recommended — secrets remain
   accessible via `git log -p` until you do):

   Option A — using `git filter-repo` (recommended):
   ```bash
   # Install
   pip install git-filter-repo

   # From the repo root:
   git filter-repo --invert-paths --path .env
   git filter-repo --invert-paths --path db/

   # Force-push the rewritten history
   git push origin --force --all
   git push origin --force --tags

   # Alert all collaborators — they must re-clone the repo.
   ```

   Option B — using BFG Repo-Cleaner:
   ```bash
   # Download from https://rtyley.github.io/bfg-repo-cleaner/
   java -jar bfg.jar --delete-files .env
   java -jar bfg.jar --delete-folders db
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push origin --force --all
   ```

   **Warning**: rewriting history changes all commit hashes. Anyone with a
   local clone must delete it and re-clone. Open PRs may need rebasing.

4. **Run the new secure Supabase schema**:
   - Open Supabase Dashboard → SQL Editor.
   - Paste the contents of `supabase/schema.sql` and run it.
   - This drops the old insecure RLS policies and creates secure ones.

## Summary of code changes applied

### 1. API routes now require admin authentication

All state-changing endpoints (and sensitive GETs) now call
`requireAdmin()` or `requireAdminWithCsrf()` at the top of the handler:

| Route | Methods protected |
|-------|-------------------|
| `/api/leads` | GET, PUT (POST remains public for form submissions) |
| `/api/apartments` | PUT |
| `/api/quotes` | GET, POST, PUT |
| `/api/quotes/[id]/pdf` | GET |
| `/api/site-config` | POST |
| `/api/floor-plans` | POST |
| `/api/floor-images` | POST, PUT, DELETE |
| `/api/amenities` | PUT |

The helper lives at `src/lib/auth-guard.ts`.

### 2. CSRF protection

`requireAdminWithCsrf()` checks the `Origin` header against the `Host`
header for state-changing requests. Same-origin requests pass; cross-origin
POSTs from a malicious site are rejected with 403.

### 3. Plaintext password fallback removed

`verifyAdmin()` previously accepted plaintext password comparison as a
"legacy" fallback. This neutralized the security benefit of bcrypt hashing.
The fallback has been removed — only bcrypt-hashed passwords are now
accepted, and a console error is logged if a plaintext password is found
in the database.

### 4. Seed passwords now bcrypt-hashed

`prisma/seed.ts` now hashes the admin password with bcrypt (cost factor 12)
before inserting it. The default password remains `praga2024` for dev
convenience, but it can be overridden via `ADMIN_SEED_PASSWORD` env var.

### 5. Supabase RLS policies rewritten

The old schema allowed `anon` to read ALL data including leads, quotes,
and admin users. The new `supabase/schema.sql`:
- Allows `anon` to read public catalog data (apartments, amenities,
  site_config, floor_plans, floor_images).
- Allows `anon` to INSERT leads (form submissions) but NOT read them.
- Denies ALL `anon` access to `quotes` and `admin_users`.
- Writes (except lead inserts) require the `service` role (server-side
  with `SUPABASE_SERVICE_ROLE_KEY`).

### 6. Email templates escape user input

`src/lib/email.ts` now escapes HTML special characters in lead-submitted
fields (name, phone, email, message) before interpolating them into the
email HTML. This prevents XSS in the recipient's email client.

### 7. Quotes persistence fixed

The `/api/quotes` route was using an in-memory `quotesStore` array that
reset on every cold start. It now uses `getQuotes()`, `createQuote()`,
and `updateQuote()` from `src/lib/data.ts`, which persist to Supabase
with an in-memory fallback.

### 8. Rate limiting upgraded

`src/lib/rate-limit.ts` now supports Upstash Redis for distributed rate
limiting (required for serverless). Set `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` env vars to enable it. Falls back to in-memory
when not configured (with a startup warning logged).

### 9. Prisma logging silenced in production

`src/lib/db.ts` no longer logs every query in production. This was
generating massive log volume and slowing every request.

### 10. Singletons used consistently

`/api/amenities/route.ts` was creating a new `PrismaClient` per request
(line 27). It now uses the singleton `db` from `src/lib/db.ts`, which
prevents connection pool exhaustion.

### 11. `.env.example` created

New developers can now copy `.env.example` to `.env.local` and fill in
the required values. All variables are documented with comments explaining
what they do and how to generate them.

## Setup checklist for new deployments

```bash
# 1. Install deps
bun install

# 2. Generate NextAuth secret
openssl rand -base64 32

# 3. Generate admin password hash
bun run scripts/hash-password.ts "your-password"

# 4. Copy .env.example to .env.local and fill in real values
cp .env.example .env.local

# 5. Run the secure Supabase schema
#    Paste supabase/schema.sql into Supabase SQL Editor and run

# 6. Seed the database (local dev)
bun run db:push
bun run db:seed

# 7. Start dev server
bun run dev
```

## Reporting security issues

If you discover a security vulnerability, please email security@pragaliving.com
instead of opening a public GitHub issue.
