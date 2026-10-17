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

Set `DATABASE_URL` in local `.env` and in the deployment environment. Use a pooled PostgreSQL connection for serverless runtime traffic; use the provider's direct connection for migrations when required. Never expose database credentials with a `NEXT_PUBLIC_` prefix.

## Architecture Boundaries

- Keep database access in server-only modules under `lib/db` and future data-access modules.
- Keep Route Handlers thin; authenticate and authorize every operation, and return explicit response DTOs.
- Treat payment-provider events as untrusted until their signatures and transaction state are verified. Make payment and ledger operations idempotent.
- Store money as integer minor units. Convert `BigInt` values to strings at JSON boundaries.
- Run scheduled and retryable work in a durable worker or platform scheduler, not an in-memory timer inside a serverless function.
- Use `npm run build` before deployment. Vercel must have `DATABASE_URL` configured for build and runtime.
