# HandieHub

HandieHub is a marketplace for products and services, built as a Next.js modular monolith with PostgreSQL.

## Local Setup

Requirements: Node.js 20.19 or later and Docker Compose.

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Open <http://localhost:3000>. The Node.js health endpoint at `/api/health` checks the database connection.

## Database Commands

- `npm run db:generate` regenerates the Prisma Client after schema changes.
- `npm run db:validate` checks the Prisma schema.
- `npm run db:migrate -- --name <name>` creates and applies a local development migration.
- `npm run db:deploy` applies committed migrations in production; do not run `migrate dev` against production.
- `npm run db:studio` opens Prisma Studio.

`npm run build` runs `prisma generate && node scripts/migrate-deploy.mjs && next build`, so pending committed migrations are applied before the app is compiled. Keep migrations forward-only and additive, and make sure the build environment has a `DATABASE_URL` that can run DDL.

The migration step is skipped on Vercel **preview** deployments so a feature-branch preview cannot mutate the shared production database. Production, `vercel dev` and local builds still migrate. Override with `FORCE_MIGRATIONS=1` (run everywhere, e.g. when previews use their own database) or `SKIP_MIGRATIONS=1` (never run).

Set `DATABASE_URL` in local `.env` and in the deployment environment. Use a pooled PostgreSQL connection for serverless runtime traffic; use the provider's direct connection for migrations when required. Never expose database credentials with a `NEXT_PUBLIC_` prefix.

## Architecture Boundaries

- Keep database access in server-only modules under `lib/db` and future data-access modules.
- Throttle unauthenticated endpoints that send email or accept credentials using `lib/security/rateLimit.ts` (a Postgres-backed fixed-window limiter that works across serverless instances).
- Keep Route Handlers thin; authenticate and authorize every operation, and return explicit response DTOs.
- Treat payment-provider events as untrusted until their signatures and transaction state are verified. Make payment and ledger operations idempotent.
- Store money as integer minor units. Convert `BigInt` values to strings at JSON boundaries.
- Run scheduled and retryable work in a durable worker or platform scheduler, not an in-memory timer inside a serverless function.
- Use `npm run build` before deployment; it applies pending migrations and then builds. Vercel must have `DATABASE_URL` configured for build and runtime.
- Pair the app-level throttling in `lib/security/rateLimit.ts` with the platform firewall/WAF. Application limits share the same infrastructure and won't stop volumetric attacks.

## Authentication

- **Sign up does not create a session.** `POST /api/auth/signup` creates the user (email normalized to lower-case) and emails a 10-minute OTP. `POST /api/auth/verify` is what starts the session.
- **Verify, then session.** Successful verification (or password reset, which also marks the email verified) sets two `httpOnly` cookies: a short-lived access token (`JWT_EXPIRES_IN`, default `1h`) and a rotating refresh token (`REFRESH_TTL_DAYS`, default `30`). Tokens are never returned in response bodies.
- **Refresh rotation with reuse detection.** `POST /api/auth/refresh` revokes the presented token and issues a new one atomically. Presenting an already-rotated token revokes the whole family (with a short grace window so two browser tabs refreshing at once don't log the user out).
- **Unverified login is blocked** with `403 EMAIL_NOT_VERIFIED`; the API emails a fresh code and the client redirects to the verification screen.
- Passwords require 8+ characters with an uppercase letter, a number and a special character (`lib/auth/passwordPolicy.ts`).
- Refresh tokens live in the `RefreshToken` table; `RefreshToken.familyId` tracks a login lineage for reuse detection.

## Seller onboarding and uploads

- Sellers complete a three-step wizard at `/seller/onboarding` (business details, professions/skills, delivery estimates). Publishing a listing is blocked with `SELLER_PROFILE_INCOMPLETE` until `SellerProfile.onboardingCompletedAt` is set (`GET/POST/PATCH /api/seller/profile`).
- Phone numbers are validated per country and stored as E.164 (for example `+2348012345678`). The API accepts international numbers or local numbers for the selected country and returns `INVALID_PHONE_NUMBER` for anything that is not a real number.
- `responseTime` is an enum (`WITHIN_1_HOUR` … `WITHIN_1_WEEK`) with matching customer-facing labels (`responseTimeLabel`). It is not free text.
- Delivery estimates use explicit minute/hour/day units in the wizard and are stored canonically as minutes (`intraStateDeliveryMinMinutes` / `MaxMinutes`, `interStateDeliveryMinMinutes` / `MaxMinutes`). The API accepts `{ min, max, unit }` objects and serialises each range as `{ minMinutes, maxMinutes, label }` (for example `2–4 hours`).
- Image uploads use Cloudflare R2 through presigned PUT URLs (`POST /api/uploads/presign`), so file bytes never pass through the app server. Configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` and `R2_PUBLIC_BASE_URL`; the bucket CORS policy must allow `PUT` with the `Content-Type` header from the app origin.
- `GET /api/sellers/[id]` is public for storefront browsing.

## Public reads and browse UI

- These GET endpoints are public (no session required): `GET /api/listings`, `/api/listings/[id-or-slug]`, `/api/listings/[id]/related`, `/api/listings/categories`, `/api/listings/categories/featured`, `/api/listings/category/[slug]`, `/api/listings/search`, `/api/listings/seller/[sellerId]`, `/api/reviews`, `/api/sellers` and `/api/sellers/[id]`. A session, when present, additionally lets a seller see their own non-active listings; everyone else only sees `ACTIVE`.
- Listing feeds accept `page`, `limit`, `sort` (`newest`, `price-asc`, `price-desc`, `rating`), plus `category` (slug), `kind`, `q` and `sellerId` where relevant. Responses include `pagination` and per-listing `ratingAvg`/`reviewCount`.
- Categories are hierarchical. `GET /api/listings/categories` returns top-level categories with nested `children` (each carrying its own `stats`), and a parent's `stats` include listings filed under its subcategories. Filtering by a parent slug — `?category=home_kitchen` or `/category/home_kitchen` — includes child listings. The initial taxonomy (15 categories, 95 subcategories) ships in `prisma/migrations/20261019140000_category_hierarchy_and_seed`, so `prisma migrate deploy` seeds every environment with no separate seed step.
- The seller directory (`GET /api/sellers`) lists sellers with completed onboarding. It accepts `q`, `profession`, `state`, `verified`, `sort` (`newest`, `rating`, `name`), `page` and `limit`, and returns each seller's rating stats, active-listing count and starting price plus a `professions` facet list for filter chips.
- `/api/listings/[id]` resolves either a listing id or its slug, so product pages can link by slug.
- The browse pages (`/products`, `/category/[id]`, `/product/[slug]`), the professional directory (`/handieman`), the category index (`/categories`), seller storefronts (`/seller/[id]`), the homepage, wallet (`/wallet`) and messages (`/chat`) fetch these endpoints and keep filters, sorting and pagination in the URL query string. Pages render live loading, empty and error states instead of mock data.
- Account surfaces are backed by their APIs too: checkout loads the order and uses the signed-in buyer's email with Paystack, orders support leaving a review, notifications can be read and marked read, and `/addresses` covers address CRUD and defaults.
