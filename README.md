# Grub (HouseGrocer)

A web app for UK university shared houses to plan meals together, build one
optimised weekly Tesco shop, and split the cost per item — not equally.

See `CLAUDE.md` for the product, architecture and the rules the codebase runs
on. This file is just setup and day-to-day commands.

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS · Supabase
(Postgres + Auth + Realtime) · Vercel

## Setup

1. `npm install`
2. Create a Supabase project, then run `supabase/migrations/0001_initial_schema.sql`
   through the latest migration in the SQL editor, in order.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL and key.
4. In Supabase → Authentication → URL Configuration, set the Site URL and add
   `http://localhost:3002/auth/callback` to Redirect URLs, or magic links
   bounce.
5. `npm run dev` — the app runs at `http://localhost:3002`.

Without a working `.env.local`, the app renders a legible `<SetupRequired>`
screen instead of crashing — that's deliberate, see CLAUDE.md.

Full detail, including the demo-data seeder and known migration gotchas, is
under "Connecting Supabase" in `CLAUDE.md`.

## Commands

```bash
npm run dev        # http://localhost:3002
npm run verify     # typecheck + lint + build — run this before saying anything is done
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm test            # jest — money/optimiser/units unit tests
npm run e2e          # playwright
```

## Deploying

**Target: Vercel** (frontend + SSR) with **Supabase** as the already-hosted
backend. It's a standard Next.js App Router project, so Vercel is zero-config —
no `vercel.json` needed. Node is pinned to `22.x` in `package.json` (`engines`);
Vercel reads that to pick the build runtime.

### Checklist

1. **Import the repo** into Vercel (New Project → pick this GitHub repo). It
   auto-detects Next.js.
2. **Set environment variables** in Vercel (Project → Settings → Environment
   Variables), for Production (and Preview if you want branch deploys):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     on older Supabase projects — either is accepted)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — only if push is wired up later; unset is
     fine, the subscribe flow no-ops.
   - **Never** set a `service_role` / `sb_secret_…` key in a `NEXT_PUBLIC_`
     variable — those bypass Row Level Security. The app doesn't need one.
3. **Deploy.** With the Supabase vars missing the app renders the legible
   `<SetupRequired>` screen instead of the app, so a misconfigured deploy fails
   loud, not silent.
4. **Point Supabase at the production domain** — in the Supabase dashboard
   (Authentication → URL Configuration): set the Site URL to the Vercel domain
   and add `https://<your-domain>/auth/callback` to Redirect URLs, or magic
   links will bounce.
5. **Run the migrations** against the production Supabase project if it's a
   fresh one (`supabase/migrations/*` in order).

### The Tesco caveat — read before assuming a Vercel deploy is "done"

Tesco product **search** is unauthenticated and works fine on serverless. But
**add-to-basket and checkout drive a real Playwright browser** (`lib/tesco/`),
and a full Chromium does not run in a standard Vercel serverless function
(bundle size and execution limits). So a plain Vercel deploy gives you the
entire planning / optimising / splitting loop — everything except placing the
actual Tesco order.

Options for that last step, in rough order of effort: keep the collector's
order step on a machine that can run the browser (a small always-on box or the
collector's laptop), move the Tesco automation to a separate long-running
service, or a Playwright-on-serverless approach (`@sparticuz/chromium` etc.).
This is a genuine architecture decision, not a config tweak — don't treat the
first green Vercel build as the whole job done.

## Testing

`npm test` runs the unit suite (money arithmetic, the optimiser, unit
conversions — see CLAUDE.md's "seams worth knowing" for why these matter).
`npm run e2e` runs Playwright against a running dev server. There's also a
Playwright MCP server registered in `.mcp.json` for driving a real browser
from Claude Code — see CLAUDE.md's "Local Development & Testing" section.
