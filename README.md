# BizCatchup Super Admin

Internal admin panel for BizCatchup: team directory, per-team scan/member limits,
and global limit configuration. This is a standalone Next.js app that calls the
`scanner` Go backend over HTTP — see `../scanner/CLAUDE.md` for that side.

## Status: frontend phase, mock data

This app currently runs entirely against an in-memory mock data layer. No live
backend calls happen by default. See `.claude/plans/we-need-to-make-jiggly-seahorse.md`
in the main workspace for the full design rationale.

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000. Any email/password logs you in — auth is a fake,
cookie-based session (see "What's mocked" below).

## What's mocked

Everything under `src/lib/mock/` is a deterministic, seeded fake dataset
(368 teams, ~5,938 cards) generated in-browser on first use — nothing is
committed as JSON. All reads and writes go through `src/lib/api/*`, which
branch on `NEXT_PUBLIC_USE_MOCKS` (default `true`):

- **Auth** — no Firebase. A dummy login sets a `bc_admin_session` cookie and a
  `localStorage` session; `src/proxy.ts` gates every route on that cookie.
- **Dashboard stats** (`src/lib/api/stats.ts`) — no backend endpoint exists for
  this at all. Computed client-side from the mock teams/cards in mock mode; the
  real-mode branch calls a `GET /v1.0/admin/stats` endpoint that does not exist
  yet on the backend.
- **Team status (Active/Inactive)** and **per-team card count** — no backend
  field exists for either. Mock-only, attached to the seed data.
- **CSV export** — client-side, over the currently loaded page only.

Mutations (Plans page, per-team Edit dialog) write into an in-memory store and
will reset on page refresh — that's expected in this phase.

## Wiring to the real backend

1. Set `NEXT_PUBLIC_USE_MOCKS=false` and `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.
2. Implement `setTokenGetter()` (see `src/lib/api/client.ts`) with a real Firebase
   ID token — the admin endpoints require a token whose email domain is
   `trackier.com` or `bizcatchup.com`.
3. Everything else in `src/lib/api/*` already targets the real endpoint shapes;
   no component changes should be needed except:
   - `getDashboardStats()` has no backend endpoint yet — needs new backend work.
   - Team status / per-team card count have no backend field yet.
   - Backend team search silently drops pagination when a search term is
     present, and its `totalCount` uses different matching rules than the row
     filter, so the two can disagree. Not fixed here.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build (also runs the TypeScript check)
npm run lint     # eslint
```
