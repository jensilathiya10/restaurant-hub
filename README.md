# RestaurantHub

A full-stack, multi-tenant restaurant management platform — three panels (Customer / Admin / Kitchen), real-time order flow, and AI-flavored analytics. Built as a portfolio-grade demo.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. A SQLite database is created and seeded automatically on first run — no setup required.

## Demo accounts (password for all: `password`)

| Role | Email |
|---|---|
| Super Admin | super@rhub.dev |
| Owner | owner@rhub.dev |
| Manager | manager@rhub.dev |
| Cashier | cashier@rhub.dev |
| Waiter | waiter@rhub.dev |
| Chef | chef@rhub.dev |
| Customer | john@customer.dev |

Staff/Admin login: `/login`. Customer QR menu (no login needed): `/menu`.

Two seeded restaurants demonstrate multi-tenancy: `bella-vista` (full data) and `burger-house`. Switch with `?r=burger-house` on `/menu`.

## What's implemented

**Customer panel** — browse menu by category, search, favorites, cart, dine-in/takeaway/delivery checkout, live order tracking (SSE), table reservations, call-waiter button, QR codes per table (Admin → Table Floor Plan → click a table), account page with loyalty points, order history, and review submission.

**Admin panel** — dashboard with revenue/orders/tables/reservations/low-stock/staff stats and charts, order management with the full status flow (Pending → Preparing → Ready → Served → Completed) plus split/discount/tax/payment, menu CRUD, inventory with low-stock alerts and auto stock deduction on order, interactive table floor plan, reservations, employee accounts + weekly scheduling, customer directory with loyalty, reports with CSV/PDF export, recipe cost calculator (ingredient cost → profit margin), food waste analytics, sales analytics (best/slow sellers, peak hours, returning customers), an AI Insights page (demand forecast, inventory purchase recommendations, menu pricing suggestions, shift simulator), and customer feedback with rating breakdowns.

**Kitchen Display** — live incoming-order board over Server-Sent Events, Start/Ready/Served buttons, automatic delayed-order flagging based on prep time.

**Roles** — Super Admin, Owner, Manager, Cashier, Waiter, Chef, Customer, each with different route access (enforced in `middleware.ts` and page-level checks), matching the permissions table in the spec.

## Tech stack (and one deliberate substitution)

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Recharts · JWT auth via `jose` · Server-Sent Events for real time.

**Database:** the original spec called for PostgreSQL + Prisma. This build uses **SQLite via Node's built-in `node:sqlite` driver** instead (data layer in `lib/db.ts` / `lib/data.ts`). Reasoning: it needs zero setup — no Postgres server, no Neon account, no Prisma engine binaries to download — so `npm install && npm run dev` just works anywhere, immediately. Node 22.5+ is required (for `node:sqlite`). The full relational schema is still documented in `prisma/schema.prisma` for reference if you want to migrate to Postgres/Prisma later; the shape of `lib/db.ts`'s tables mirrors it closely, so that migration is mostly mechanical.

Everything else — auth, multi-tenancy, real-time updates, the module list — is real, working code, not mocked.

## Known simplifications

- "AI" forecasting/insights are transparent heuristics (recent-order averages, simple thresholds) rather than trained ML models — clearly labeled in the UI as demo logic, same spirit as the spec's "AI" features but honestly scoped.
- SMS/email notifications are logged to the in-app Notifications feed rather than sent externally.
- Payments (Cash/Card/Apple Pay/Google Pay) are recorded, not processed — no real payment gateway is wired up.
- PWA/offline mode, multi-language translation, and gift cards are not implemented.

## Project structure

```
app/
  admin/        staff & management panel (role-gated)
  kitchen/      kitchen display system
  menu/ cart/ track/ reserve/ account/   customer panel
  api/          route handlers (mutations + SSE stream)
lib/
  db.ts         SQLite connection, schema, seed data
  data.ts       all query/mutation functions
  auth.ts       JWT session helpers
  events.ts     in-memory pub/sub powering the SSE streams
components/     shared UI
```
