# BizCatchup Super Admin

Internal admin panel for BizCatchup: team directory, per-team scan/member limits,
and global limit configuration. This is a standalone Next.js app that calls the
`scanner` Go backend over HTTP — see `../scanner/CLAUDE.md` for that side.

## Status: wired to the real production backend

Team list, card list, and global/per-team limits now hit the real
`https://backend.bizcatchup.com` API with real Firebase Email/Password login.
A few metrics still have no backend data source at all and stay mocked/blank
until that backend work lands — see "What's still mocked" below. Full design
rationale in `.claude/plans/we-need-to-make-jiggly-seahorse.md` in the main
workspace.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # already points at production by default
npm run dev
```

Open http://localhost:3000 and sign in with a Firebase Email/Password admin
account whose email is on `@trackier.com` or `@bizcatchup.com` — the backend
rejects anything else. To run against the mock dataset instead, set
`NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`.

## Auth

Real Firebase Auth (Email/Password provider) against the `biz-scan` project.
On login the app also calls `GET /v1.0/check-admin` once to fail fast with a
clear message if the account isn't on an allowed email domain, rather than
leaving you to hit a wall of 401s on every subsequent screen. `src/proxy.ts`
still gates routes on a thin `bc_admin_session` cookie (set once Firebase
confirms sign-in) purely so the app shell doesn't flash for logged-out users —
the real authorization boundary is the backend re-checking the ID token on
every request.

## API wiring (`src/lib/api/*`)

Every screen reads through `src/lib/api/*`, which branch on
`NEXT_PUBLIC_USE_MOCKS`. Real endpoints in use today:

| Screen | Endpoint |
|---|---|
| Manage Teams list, dashboard "Recently active teams" | `GET /v1.0/teams` |
| Dashboard "Recently created cards" | `GET /v1.0/cards` |
| Plans (global limits) | `GET`/`PUT /v1.0/appConfig/limits` |
| Per-team Edit dialog | `PUT /v1.0/team/:teamID/limits` |
| Dashboard Teams/Business cards counts | derived from `totalCount` on two 1-row list calls |

## What's still mocked / unavailable

No backend data source exists yet for these — they're not a frontend gap:

- **Team members count, Monthly scans, Paid/Free split** (dashboard stat
  cards) — no aggregate endpoint at all. Renders as "Not available yet" in
  real mode. Monthly scans specifically has no per-month counter anywhere in
  Firestore, only "scanned today" / "scanned ever" per team.
- **Team status (Active/Inactive)** — no field on the backend `Team` at all.
  Mock-only.
- **Per-team card count** on the Manage Teams directory — no field; shows `0`
  in real mode until the backend adds one.
- **CSV export** — client-side, over the currently loaded page only.
- **Login (impersonate)** button — disabled placeholder, no backend support.

Also worth knowing: the backend's team **search** silently drops pagination
when a search term is present, and its `totalCount` is computed with
different matching rules than the rows it returns, so the two can disagree
for a search query. Not fixed here — see the plan file for detail.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build (also runs the TypeScript check)
npm run lint     # eslint
```
