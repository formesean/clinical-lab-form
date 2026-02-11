# Agent Guide

## Project Summary
This is a clinical lab form system built on Next.js (App Router) with React 19 and TypeScript. It uses Prisma with PostgreSQL for persistence and Supabase for authentication. UI is styled with Tailwind CSS v4 plus Radix/Base UI components.

## Repo Map
- `src/app`: Next.js routes and layouts (App Router).
- `src/app/api`: HTTP API endpoints (`route.ts`).
- `src/components`: Reusable UI components.
- `src/lib`: App utilities (auth, Prisma, Supabase, form schemas/inputs).
- `src/templates`: Binary Excel/PDF form templates.
- `prisma`: Prisma schema and migrations.
- `docs`: API documentation (`docs/api.md`).

## Commands
- `pnpm dev`: Run the app locally.
- `pnpm lint`: Run Biome lint.
- `pnpm format`: Run Biome formatter.
- `pnpm build`: Generates Prisma client and builds Next.js.

## Conventions
- Prefer the `@/` alias for imports from `src/`.
- Keep API responses aligned with `docs/api.md`, especially the error shape.
- Use `src/lib/prisma.ts` for database access and `src/lib/supabase.ts` for Supabase auth.
- Form definitions live in `src/lib/form-schemas.ts` and `src/lib/form-inputs.ts`.
- Avoid editing files under `src/templates` unless explicitly requested (binary assets).

## Environment
Required env vars include `DATABASE_URL`, `SUPABASE_URL`, and either `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.

## Validation
No automated tests are configured. Use `pnpm lint` and `pnpm format` to validate changes.