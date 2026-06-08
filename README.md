# MITS SubTracker

A clean, MITS-branded desktop app for tracking subscriptions — your own **and**
your clients'. See monthly/yearly spend at a glance, never miss a renewal, and
keep every recurring cost organized in one place.

Built with **Tauri 2 + React + SQLite**. Local-first (your data stays on your
machine), with a signed auto-update pipeline.

## Features

- **Subscriptions** with type (Subscription / Lifetime / Trial / Revenue),
  billing cycle, category, tags, payment method, website link, and notes.
- **Clients** — track each client's subscriptions separately, with a per-client
  dashboard, plus a master dashboard across everyone.
- **Dashboard** — monthly/yearly totals, upcoming renewals, spend by category,
  spend by owner, and a 12-month spend-over-time chart.
- **Multi-currency** — per-sub currencies with conversion to a chosen base.
- **Renewal history & lifetime break-even** calculations.
- **Alerts** — in-app banner + native notifications for upcoming renewals.
- **Bulk actions, sorting, search & filters.**
- **Backup/restore** (JSON) and **CSV export.**
- **System tray, close-to-tray, launch-at-login, and auto-update.**

## Getting started (development)

Prerequisites: Node 18+, Rust (stable), and the Tauri prerequisites for Windows
(Visual C++ Build Tools + WebView2).

```bash
npm install

npm run dev          # browser preview (uses localStorage) — fastest UI loop
npm run tauri dev    # full desktop app (uses SQLite)
```

## Building installers

```bash
npm run tauri build  # outputs to src-tauri/target/release/bundle/
                     #   nsis/SubTracker_x.y.z_x64-setup.exe   (recommended)
                     #   msi/SubTracker_x.y.z_x64_en-US.msi
```

## Project structure

```
src/
  App.jsx                 # top-level state, navigation, modals
  components/             # Dashboard, cards, modals, panels, views
  data/                   # repo.js (CRUD), db.js (dual-mode + mappers),
                          # categories, tags, alerts, currency, backup, updater
  utils/                  # dateUtils (renewals/break-even/sort), spend (history)
src-tauri/                # Rust app shell: lib.rs (migrations + tray + plugins),
                          # tauri.conf.json, capabilities/, icons/
.github/workflows/        # release.yml — automated signed releases
RELEASING.md              # how to cut a release
CLAUDE.md                 # project guide for Claude Code sessions
HELP.md                   # end-user guide
```

## Data & privacy

All data is stored **locally**: SQLite at
`%APPDATA%\tech.menozzi.subtracker\subtracker.db` in the desktop app (browser
preview uses `localStorage`). Nothing is uploaded anywhere. Use
**Settings → Export full backup** regularly to safeguard your data.

## Releases & updates

Tagging `vX.Y.Z` triggers a GitHub Action that builds, signs, and publishes a
release. Installed apps detect it on launch and offer a one-click update. See
[`RELEASING.md`](./RELEASING.md).

---

© Menozzi IT Solutions.
