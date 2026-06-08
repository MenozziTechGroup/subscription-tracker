# MITS SubTracker — Project Guide (for Claude Code)

A branded desktop app for tracking subscriptions (personal **and** per-client),
built for Menozzi IT Solutions. This file orients any future session.

## Stack

- **Tauri 2.x** (Rust shell) wrapping a **React 19 + Vite + Tailwind v4** frontend.
- **SQLite** storage via `tauri-plugin-sql` in the desktop app.
- Plugins: `sql`, `notification`, `autostart`, `updater`, `process`, `log`.
- GitHub: `MenozziTechGroup/subscription-tracker` (public). Org CI builds signed releases.

## Run / build

```bash
npm run dev          # Vite browser preview (localStorage mode) — fast UI iteration
npm run tauri dev    # full desktop app (SQLite mode)
npm run build        # build frontend only (validates the bundle)
npm run tauri build  # produce signed installers (.msi + NSIS .exe)
```

> Before `cargo`/`tauri build`, kill any running `app.exe` (it locks the binary).

## Architecture — the important part

**Dual-mode data layer.** All data access goes through `src/data/repo.js`, which
branches on `isTauri()` (`src/data/db.js`):
- **Desktop (Tauri):** real SQLite via `tauri-plugin-sql` (`$1` parameterized queries).
- **Browser (Vite preview):** `localStorage` fallback — so the screenshot-driven
  preview workflow keeps working without the Rust runtime.

Keep this pattern for any new persisted data. `db.js` also holds the snake_case↔
camelCase row mappers and `isTauri()`. App-facing objects are **camelCase**;
SQLite columns are **snake_case**; booleans are stored as 0/1; `tags` is a JSON array.

**SQLite schema + migrations** live in `src-tauri/src/lib.rs` (versioned
`Migration` structs). Tables: `clients`, `subscriptions` (nullable `client_id`,
NULL = personal/"My Subs"), `tags`, `payment_history`, `exchange_rates`,
`settings`. To change schema, **add a new migration version** (don't edit old ones).

> `payment_history` and `exchange_rates` tables exist but are currently
> **unused/reserved** — billing history is computed analytically in
> `src/utils/spend.js`, and exchange rates are stored in `settings` (key `rates`).

**Settings** are key/value JSON in the `settings` table (or a localStorage blob):
`alerts`, `baseCurrency`, `rates`, `seeded`.

## Key files

- `src/App.jsx` — top-level state, 3-tab nav (Dashboard / My Subs / Clients), all modals.
- `src/data/repo.js` — all CRUD + backup/restore + one-time seed.
- `src/data/db.js` — `isTauri()`, connection, row mappers, localStorage helpers.
- `src/data/{categories,tags,alerts,currency,backup,updater}.js`
- `src/utils/dateUtils.js` — renewals, `parseLocalDate` (avoid UTC off-by-one!),
  `breakEven`, `sortSubscriptions`.
- `src/utils/spend.js` — analytic billing history + spend-over-time.
- `src/components/` — Dashboard, SubscriptionCard/Modal, Client*, AlertsPanel,
  SettingsPanel, Onboarding, HistoryModal.

## Gotchas / conventions

- **Dates:** parse `YYYY-MM-DD` with `parseLocalDate()`, never `new Date(str)`
  (UTC parse shifts a day in western timezones — caused a real bug).
- **MITS branding:** red `#e1251b`; grays `#97989a`/`#b1b1b1`; charcoal `#3a3a3a`;
  app background `#e1eae9` (CSS var `--app-bg`). Logo: `public/mits-logo.svg`.
  App icon source: `…/07_Branding_Assets/.../MITS-Logo-only.png` (pad square →
  `npx tauri icon`).
- **Money:** per-sub amounts shown in their own currency; **aggregates convert to
  base currency** via `currency.js` `convert()` (USD-relative rates).
- Lifetime subs have no cycle/recurring; optional `monthlyEquivalent` drives break-even.

## Releasing

See `RELEASING.md`. Short version: bump `version` in `src-tauri/tauri.conf.json`,
`git tag vX.Y.Z && git push --tags`. GitHub Action builds + signs + drafts a
release; publish it. Installed apps auto-update. Signing key: `~/.tauri/subtracker-updater.key`
(also in the `TAURI_SIGNING_PRIVATE_KEY` repo secret). **Never commit the key.**

## Not yet done (optional)

- Windows code-signing cert (removes SmartScreen warning for client distribution).
- Multi-user/team sync (currently local-first, single-user per machine).
