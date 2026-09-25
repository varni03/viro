# CLAUDE.md — Viro Project Context

> Read this first. It is the single source of truth for working on Viro.
> Keep it updated when architecture, priorities, or conventions change.

## What Viro is

AI-powered operations intelligence platform — “the operating system for operations.”
Two core differentiators:

1. **Generative UI** — a company describes its operation in a conversation; Viro generates
   a custom dashboard/platform for them (config-driven, not hardcoded).
1. **Role automations** — Viro drafts the documents every department writes by hand
   (invoices, weekly quality reports, supplier emails, shift handovers).

Author: Varnika Jain. **Portfolio project** — the repo is public, so every company,
person and dataset in it is fictional. Never add real customer names, employers,
people, or credentials.

Demo companies (fictional):
- **Meridian Vans** — commercial van upfitter; VIN-keyed production pipeline (`MV-VIN-*`).
- **Tidewater Marine** — marine procurement; RFQ-first workflow.

**Direction (Sept 2026):** grow from a single-plant dashboard into a parallel workspace
+ ETL layer for every domain a company runs (production, procurement, finance, ...),
each domain generated from the same config system and fed by connectors.

## Stack & deployment

|Layer   |Tech                                           |Where                                                  |
|--------|-----------------------------------------------|-------------------------------------------------------|
|Frontend|React + Vite, inline styles                    |Vercel — <https://viro-pearl.vercel.app>               |
|Backend |Python FastAPI                                 |Vercel (FastAPI preset, project `viro1`) — <https://viro1.vercel.app>|
|Database|PostgreSQL (prod) / SQLite (local dev)         |Supabase, project ref `vfukukknebzkbhjbglde`           |
|AI      |Anthropic API, model `claude-sonnet-4-20250514`|key in Vercel env + local .env                        |

- Push to `main` → both Vercel projects auto-deploy (~2 min). Frontend project root dir = `frontend`; backend project `viro1` root dir = repo root.
- Backend Vercel env vars: `ANTHROPIC_API_KEY`, `JWT_SECRET`, `DATABASE_URL`. Password lives only there — repo is public, never commit it.
- `DATABASE_URL` must use Supabase **Session Pooler** (IPv4):
  `postgresql://postgres.vfukukknebzkbhjbglde:<PASSWORD>@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
- Backend is serverless — no disk, no background threads; each request may hit a fresh instance.
- Entry: root `index.py` imports `main.app`. The preset routes requests as `/api/index/<path>`; `VercelPathFix` middleware in main.py strips it — don't remove. `GET /` is the health check (also touches DB so Supabase free tier doesn't pause).
- `.vercelignore` applies to BOTH Vercel projects — never list `frontend` in it (breaks the frontend build); it keeps venv/tests/data out; `requirements.txt` is backend-only (legacy Streamlit app is `legacy_streamlit_app.py`).

## Production data / credentials

- Demo company: Meridian Vans, `company_id = 2F01E0D1`
- Login: `manager@meridianvans.com` / `password123` (Dana Reyes, role=manager) — demo only
- Seeded: 4 stages (110 Entry, 310 Upfit Line, 510 Quality Inspection, 710 Approved to Ship),
  50 products `MV-VIN-0001..0050`, 189 defects (55 resolved).
- Old company IDs F4A1E648 / FAC50A65 / 9FDA7C8E are dead (pre-Postgres resets).

## Local dev

```bash
# Terminal 1 — backend (SQLite locally via viro_dev.db)
cd ~/viro && source venv/bin/activate && PYTHONPATH=. uvicorn main:app --reload
# Terminal 2 — frontend
cd ~/viro/frontend && npm run dev   # localhost:5173
```

NOTE: frontend points at the PROD backend URL `https://viro1.vercel.app` everywhere (hardcoded in each file).
Some networks block the Anthropic API — if AI features fail locally, try another network.

## File map

```
~/viro/
  main.py                      # all FastAPI endpoints + table creation at module level
  database/db.py               # ViroDB: dual-mode SQLite/Postgres via SQLAlchemy
  index.py                     # Vercel entrypoint (from main import app)
  requirements.txt, .python-version, .vercelignore
  frontend/src/
    App.jsx                    # auth, page switch, prefs, responsive shell
    api/client.js              # axios baseURL = Vercel backend prod
    components/Layout.jsx      # COLORS + glass design system + AuroraBackground
    components/Sidebar.jsx     # dynamic modules, notifications bell
    components/AIPanel.jsx     # right-side AI: commands → filters → Q&A
    pages/DynamicDashboard.jsx # ★ config-driven renderer (generative UI core)
    pages/{Dashboard,Analytics,ProductionLine,Predictive,LogDefect,VehicleSearch,Settings,Onboarding}.jsx
    hooks/useBreakpoint.js
```

## Generative UI architecture (the core system)

- Dashboards are **JSON configs**, not code. `DynamicDashboard.jsx` walks
  `config.sources` (endpoint paths with `{cid}` placeholder) and `config.sections[].blocks[]`,
  rendering each block by `type` from a registry: `kpi`, `pipeline`, `ranked_bars`, `table`
  (plus `bar_chart`/`line_chart` in earlier version).
- Configs persist in `dashboard_config` table; endpoints:
  `GET/POST /dashboard-config/{company_id}`.
- Configs are loaded from the endpoint / AI-generated from onboarding answers
  (`defaultConfig.js` is the fallback).
- Editing later = AI panel mutating the same config (extends existing `/ai/command`).

## Design system — STRICT

- Linear-inspired “frosted glass OS”. Background `#08090a`. Inter font, JetBrains Mono for IDs/VINs.
- Glass cards: `rgba(255,255,255,0.05)` + `backdrop-filter: blur(20px)`,
  border `rgba(255,255,255,0.08)`, radius 16, hover: lift -1px + border 0.16.
- **Black/white only for UI. NO PURPLE on buttons/accents** (legacy purple still exists on
  some pages — actively being removed). Color reserved for data severity:
  critical `#ff4444`, high `#ff8800`, medium `#eab308`, low `#22c55e`.
- Primary buttons: white bg, near-black text. Muted text `rgba(255,255,255,0.5)`.
- Transitions: `cubic-bezier(0.16,1,0.3,1)`.
- The Fable prototype (`viro-generative-prototype.html`, 5 screens: conversation →
  generation → Meridian Vans dash → Tidewater Marine dash → automations) is the visual north star
  AND the future marketing/landing page.

## Known bugs / debt (fix order)

1. **Duplicate stages** in DB (each stage inserted twice) → duplicate columns on
   Production Line + duplicate rows in Settings. Dedupe `stages` table.
1. Pipeline block status lines (“● N blocked — critical”) not appearing — verify the
   new DynamicDashboard.jsx fully replaced the old and `critical_open` aggregates.
1. Purple gradients remain on: Search, Log Defect submit, Add Stage, Sign In, AIPanel send.
1. FPY = 0% — every seeded vehicle has ≥1 defect. Seed ~12 clean vehicles.
1. Delete temp `/debug/by-stage/{company_id}` endpoint in main.py.
1. AI features untested in prod (panel Q&A, /ai/command, analytics generator).

## Postgres gotchas (learned the hard way)

- Routes: specific paths BEFORE wildcards (`/defects/by-stage/{cid}` before
  `/defects/{cid}/{pid}`) or FastAPI swallows them.
- No `julianday()` / `DATE('now','-30 days')` → use
  `EXTRACT(EPOCH FROM (NOW() - col::timestamp))/3600` and `NOW() - INTERVAL '30 days'`.
- Cast text timestamps: `DATE(logged_at::timestamp)`.
- GROUP BY must list every non-aggregated column.
- ONE cached SQLAlchemy engine (`pool_size=3, max_overflow=2, pool_pre_ping=True`) —
  per-query engines exhaust Supabase’s 15-connection session-pool limit.
- `db.query/execute` convert `?` placeholders to named `:p0..:pN` params internally.

## Roadmap (agreed order)

1. Fix bugs above; finish dashboard polish to match Fable prototype exactly.
1. Purge purple platform-wide; apply glass treatment to remaining pages.
1. Landing page from the Fable prototype at root URL (sign in / get started).
1. **Insight layer**: AI-generated one-sentence insight per dashboard card;
   click-any-card → “Explain / Change / Alert me”. Needs API access.
1. Conversational onboarding → `/onboarding/generate` → Claude outputs dashboard
   config JSON → renderer shows it (the full generative loop).
1. Tidewater Marine second-company config to prove differentiation.
1. Role automations (invoices from ship events, weekly quality report, supplier emails).
1. Connectors / ETL (CSV, Excel, Snowflake, ...) feeding per-domain workspaces.

## Working conventions

- Commit style: `git add . && git commit -m "..." && git push` (push = deploy).
- User is a student; explain decisions briefly, give exact commands,
  one step at a time, ask for terminal output when debugging.
- Prefer diffs over full-file rewrites unless the file is broken.
- Never reintroduce purple. Never store data on server disk. Always check route order.

## Product design thesis — the soul of Viro (do not lose this)

What separates “a dashboard” from something a plant manager opens every morning because
it makes them better at their job. This is the north star for every in-product screen.

1. **Every screen answers a question, it doesn’t display data.**
   Power BI shows charts; Viro shows answers. The manager’s morning question is “what’s
   blocking shipping” — so the top of their screen is a sentence, not a chart:
   “3 vehicles blocked at QC — all liftgate faults, all from batch AL-2241.
   Resolving these ships $240K this week.” The data below it is the proof.
   Implementation: each config block gets an optional AI-generated `insight` string,
   one sentence written by Claude from the live numbers, refreshed when data changes.
1. **The AI panel is the control plane, not a chatbot sidebar.**
   Extend /ai/command: every card becomes clickable → “Explain this” / “Change this” /
   “Alert me when this changes.” “Why is FPY down?” answers in the context of THAT
   card’s data. Because the dashboard is config, “make this weekly” or “swap this for
   resolution time” actually rebuilds the screen live. That live reshape is the demo
   moment that makes people gasp.
1. **Generation is per-role, not just per-company.**
   Floor worker on an iPad → two giant buttons (Log Defect, My Queue). Manager → the
   overview. CFO → cost-of-quality. The onboarding conversation (“who works here?”)
   generates different layouts per role from the same config system. This makes
   “operating system for operations” literal.
1. **It should feel alive — like mission control.**
   Pulse dots on live data, numbers that tick when a defect is logged, critical alerts
   that slide in rather than waiting for a bell-icon poll, the blocked stage glowing
   red. The plant should feel like it’s breathing inside the screen.
1. **Each tab rebuilt around its single job:**
- Production Line → vehicles as cards flowing through stage columns, drag to advance,
  red ones float to top.
- Analytics → insights first (“your week in 4 sentences”), charts as evidence below,
  plus the AI analytics generator.
- Predictive → not risk scores, but a feed: “MV-VIN-0046 likely to fail QC — 3
  defects at entry, pattern matches 12 prior failures.”
- Log Defect → 10-second flow: photo → AI fills everything → confirm. Floor workers
  wear gloves; minimize taps.

**Highest-leverage build after the renderer:** insight annotations + click-any-card-to-ask.
Needs the Claude API. ~1 day of work; transforms the feel from
“dashboard” to “intelligence.”

**Build order (agreed):** finish dashboard polish → landing page from Fable prototype →
insight layer → conversational onboarding → per-role generation → automations.