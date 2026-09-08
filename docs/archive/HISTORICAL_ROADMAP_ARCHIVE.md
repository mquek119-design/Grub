# Grub — Historical Roadmap & Sprint Archive

_This archive consolidates the early development roadmaps, sprint option plans (Options 2–8), and pre-launch handoff notes from August–September 2026. For current tasks and backlog, refer directly to `PLAN.md` in the project root._

---

## 1. Project Genesis & Core Tenets

Grub was conceived to solve grocery shopping for UK university shared houses (3–5 students):
1. **The Shared Order**: A solo student struggles to hit Tesco's click-and-collect (£25) or delivery (£50) minimums. A household order clears this easily.
2. **Ingredient Pooling**: Buying shared staples and overlapping recipe ingredients (e.g. herbs, onions, rice, oil) cuts food waste and total bill cost.
3. **Per-Item Split (Not Equal)**: Housemates only pay for the ingredients in the meals they eat, plus their share of shared household staples.
4. **Authentic Data**: Never invent a number. Zero placeholder prices; unpriced lines show "No price".
5. **Collector Model**: One housemate is the designated collector each week, placing the Tesco order through their account and collecting money from housemates.

---

## 2. Sprint Evolution

### Week 1 — Foundation & Core Loops (Late August 2026)
- Initial Next.js App Router structure with Supabase Postgres + RLS.
- Database schema migrations `0001` through `0017`.
- Two-week rolling plan (current week + next week).
- Algorithmic basket builder pulling live Tesco product data via `lib/tesco/`.
- Per-item arithmetic allocation engine (`allocateLine`) and workings generator.
- Delivery morning reconciliation for substitutions and missing items.

### Options 2–8 Sprint Initiatives (Early September 2026)
- **Option 2 (Auth & Onboarding)**: Passwordless magic-link sign-in, house creation, invite codes, room assignment.
- **Option 3 (Protected Routes)**: Server-side authentication guards, session verification, `<SetupRequired>` screen.
- **Option 5 (Performance)**: Server action optimization, Supabase single-roundtrip queries, cached Tesco product lookups.
- **Option 7 (Accessibility)**: WCAG 2.1 AA audit, 44px touch targets, screen-reader aria attributes, color contrast verification.
- **Routing & Post-Order**: Landing page redesign (`/welcome`), clear post-order feed banner, collector payment detail cards.

### September 7 Polish & Launch Prep
- Client-side image compression on recipe photo uploads.
- Branded favicon (`src/app/icon.svg`) and OpenGraph card (`src/app/opengraph-image.tsx`).
- Cookie consent banner with strict opt-in for privacy-friendly Vercel Analytics.
- Voice & tone audit across UI copy conforming to `VOICE.md`.
- Consolidated Master Plan established in `PLAN.md`.
