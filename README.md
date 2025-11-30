<!--
	Comprehensive README for the Logiq project
	- Replaces the default create-next-app README with detailed developer documentation
	- Includes setup, Prisma instructions, architecture, APIs, real-time, and troubleshooting
-->

# Logiq — Real-time Logistics Dashboard

Logiq is a Next.js + TypeScript full-stack application demonstrating a realtime logistics dashboard, end-to-end shipping flows, and an object-oriented architecture. The project includes:

- A NASA-inspired dark UI built with Tailwind CSS and Framer Motion
- Real-time updates using Server-Sent Events (SSE) and a `useRealtime` hook
- A Prisma + PostgreSQL data layer (Supabase) for Users, Vehicles and Shipments
- OOP core modules illustrating Abstraction, Inheritance, Polymorphism and Encapsulation
- Pricing strategy implemented with the Strategy Pattern and a small PricingTester UI

This README documents how to run the project, the code structure, main design patterns, and developer-focused notes.

## Quick Start

1. Install dependencies

```bash
npm install
# or pnpm install
```

2. Create and populate `.env` (copy `.env.example` if present). Important vars:

```text
DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Generate Prisma client and push schema (development)

```bash
npx prisma generate
npx prisma db push
# If you need to reset and seed in dev (will wipe data):
# npx prisma migrate reset --force
# npx tsx prisma/seed.ts
```

4. Start the dev server

```bash
npm run dev
# Open http://localhost:3000
```

## Project Overview & Features

- Dashboard views for `admin`, `customer`, and `driver` under `src/app/dashboard/*`
- Create shipments from the UI via `CreateShipmentForm` (now selects human-readable locations)
- Vehicles and shipments stored in PostgreSQL (Prisma schema in `prisma/schema.prisma`)
- Real-time fleet updates delivered via `/api/realtime` and consumed with `useRealtime` hook
- OOP core in `src/core` (User, Vehicle, Shipment, PricingStrategy, ShipmentFactory)
- Services layer in `src/services` handles business logic and Prisma integration
- `src/lib/prisma.ts` — Prisma client wrapper used across services

## Architecture & Important Files

- `src/app/` — Next.js App Router pages and API routes.
  - `src/app/api/shipments/route.ts` — CRUD for shipments
  - `src/app/api/vehicles/route.ts` — vehicle-related endpoints
  - `src/app/api/realtime` — SSE endpoint broadcasting real-time events
- `src/components/` — Reusable React components (e.g. `CreateShipmentForm.tsx`, `ShipmentCard.tsx`)
- `src/core/` — Core OOP classes and types
  - `Shipment.ts`, `Vehicle.ts`, `User.ts` — domain models
  - `PricingStrategy.ts` — Strategy pattern and factory
  - `ShipmentFactory.ts` — creates shipment instances and recommends vehicles
  - `types.ts` — shared TypeScript types (including `Location` and `ShipmentLocation`)
- `src/services/` — Application services that orchestrate business logic and persist data
  - `ShipmentService.ts`, `VehicleService.ts`, `UserService.ts`
- `src/lib/prisma.ts` — Prisma client wrapper used across services
- `prisma/schema.prisma` — Database schema

## Database (Prisma) Notes

- Schema is under `prisma/schema.prisma`. When updating models:

```bash
npx prisma generate
npx prisma db push
```

- If adding required columns to a table with existing rows, you will be prompted to reset the database. For dev you can reset and re-seed:

```bash
npx prisma migrate reset
npx tsx prisma/seed.ts
```

## Running & Testing the App

- Start dev server

```bash
npm run dev
```

- API health checks

```
GET /api/users/first-customer      # returns a demo customer record
GET /api/shipments?customerId=...  # list shipments for customer
POST /api/shipments                # create a new shipment
GET  /api/realtime?channel=all     # SSE stream
```

## Real-time System

- The app uses Server-Sent Events (SSE) to send live updates from the server to clients.
- Client hook: `src/hooks/useRealtime.ts` — handles connection, reconnection/backoff, and dispatching events:
  - `onNewShipment`, `onShipmentUpdate`, `onAssignmentUpdate` callbacks are exposed
- SSE endpoint: `src/app/api/realtime/route.ts` — emits JSON events (type + data). Channels are used to scope events.

## Pricing Strategy & Tester

- Pricing logic is implemented in `src/core/PricingStrategy.ts` using the Strategy Pattern.
  - `BasePricingStrategy` defines shared pricing behaviors
  - `AirPricingStrategy`, `GroundPricingStrategy`, `SeaPricingStrategy` implement specific logic
  - `PricingStrategyFactory` can `create`, `recommend`, and `compareAll` strategies
- UI tester component: `src/components/PricingTester.tsx` (example) lets you input `weight` and `distance` and compare strategy outputs. Use it to verify formulas and experiment with surcharges.

Usage examples (in the app): enter weight (kg) and distance (km), click `Compare All` to see eligibility and prices.

## Core OOP Patterns

- Abstraction: `PricingStrategy` interface and domain types in `src/core/types.ts`
- Encapsulation: protected/private fields inside domain classes (e.g., `Vehicle`, `Shipment`)
- Inheritance: `BasePricingStrategy` -> specific strategies
- Polymorphism: strategies expose a common `calculate(weight, distance)` method used interchangeably

## Developer Notes & Conventions

- Prefer calling services from API route handlers instead of accessing Prisma directly from pages.
- Keep UI components presentational; move business logic to `src/services`.
- When changing Prisma schema: run `npx prisma generate` and `npx prisma db push` and restart dev server.

## Troubleshooting

- Type errors referencing Prisma types after schema changes: regenerate Prisma client and restart the Next.js dev server:

```bash
npx prisma generate
npm run dev
```

- If `npx prisma db push` refuses to add a required column because rows exist, make the new column nullable, push, then backfill data and make it required in a subsequent migration.

## Deploying

- This app is ready for Vercel (recommended for Next.js).
- Before deploy, set the same environment variables in Vercel dashboard and run any necessary build-time scripts.

## Contributing

- Fork the repo and create a feature branch for each change.
- Keep PRs focused and include screenshots for UI updates.

## Contact

If you want help extending the platform (tests, additional features, containerization), open an issue or reach out in the code comments.

---

If you'd like, I can also:

- Add a `CONTRIBUTING.md` with step-by-step development setup and Git workflow.
- Create a short `dev-setup.sh` or `Makefile` to automate environment creation, Prisma client generation, and seeding.

Want me to add those next? Open question: add `PricingTester` component into a dashboard page for quick access?
