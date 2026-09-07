# Grub — Full Audit, Feature Gaps & Plan

_2026-09-07. A ground-truth audit run against the live code, the deployed site
and the **live Supabase database's own advisors** (via MCP, read-only), not the
planning docs. Supersedes stale status in `PLAN.md`/`ROADMAP.md` where they
disagree. `CLAUDE.md` remains authoritative on product rules._

---

## Part 1 — Audit

### Health: green
- `npm run verify` clean (typecheck + lint + build).
- Jest **174/174** across 18 suites.
- 27 routes, 1 API route (`/api/tesco/import-session`), migrations `0001`–`0025`.
- Deployed at `grubhouse.uk` (redirected from `grub-lime.vercel.app`).

### A. Documentation drift (real, worth fixing)
`CLAUDE.md`'s header block is now wrong on three counts and it's the
*authoritative* doc, so the drift misleads every agent that reads it first:
- Says **"Next.js 14"** — actually Next.js 16.3.1.
- Says **"migrations 0001–0017"** — actually through 0025.
- Says **"There is no deployed environment"** — it's live on Vercel.
- The "Genuinely outstanding" list still names push notifications and empty
  states as gaps; push was removed (T1.1) and empty states were finished.
- `ROADMAP.md` self-flags as stale but still says "105 tests / no deploy".

**Fix:** one honest pass over `CLAUDE.md`'s top section + retire/merge the
overlapping status docs (`ROADMAP`, `CODING_PLAN`, `PLAN`, this file) into one.
Four overlapping "what's left" docs is its own maintenance debt.

### B. Database security (from Supabase advisors)
| Severity | Finding | Reality / action |
|---|---|---|
| INFO | `push_subscriptions` has RLS on but **no policy** | Dead table — push was removed (T1.1) but migration `0022` and the table remain. Drop the table + delete `0022`. |
| WARN | `generate_invite_code` has a **mutable search_path** | Minor hardening. `set search_path = ''` (or `public`) on the function. |
| WARN | **19 `SECURITY DEFINER` functions executable by `anon`** (and by `authenticated`) | Needs judgement, not a blind fix. Most are the intended RLS-helper / RPC pattern (`create_house`, `join_house`, the demo functions) and gate internally on `auth.uid()`/identity, so an anon call fails safe. But the `*_house_id(uuid)` helpers being anon-callable is a small info-leak vector (probe which house owns an item id). **Action:** revoke `EXECUTE` from `anon` on everything that isn't deliberately pre-auth, as a defence-in-depth migration. |
| WARN | **Leaked-password protection disabled** | **N/A** — Grub is magic-link only, no passwords. Safe to ignore, or enable for zero cost. |

Remediation reference: https://supabase.com/docs/guides/database/database-linter

### C. Database performance (from advisors — relevant to the slowness)
| Severity | Finding | Reality / action |
|---|---|---|
| WARN | **10 RLS policies re-evaluate `auth.uid()` per row** (`profiles`, `splits`, `pantry_items`, `tesco_sessions`) | The classic Supabase perf footgun. Wrap `auth.uid()` → `(select auth.uid())` so it's evaluated once per query, not per row. Compounds with the Singapore-region latency you already felt. |
| INFO | **15 unindexed foreign keys** | Every `user_id`/`ingredient_id`/`recipe_id` FK lacks a covering index. Cheap migration adding them; helps joins and cascade deletes. |
| WARN | 2 tables have **multiple permissive SELECT policies** (`pantry_items`, `recipe_ingredients`) | Minor; each policy runs per query. Consolidate when convenient. |
| INFO | 14 **unused indexes** | Mostly because the DB is near-empty (no traffic yet) — "unused" is expected pre-launch. A few are on dead/parked tables (`push_subscriptions`, `tesco_sessions`). **Don't** drop the real ones yet; revisit post-launch with real usage. |

**Important sequencing:** all of B and C are DDL on the **Singapore** project,
which T0.2 plans to abandon for a UK region. **Write these as migration files
and apply them when the UK project is stood up** — don't hand-fix Singapore
twice. Fold B+C into the region migration as `0026_*` hardening migrations.

### D. Deploy / config
- **`NEXT_PUBLIC_SITE_URL` not set on Vercel** → sitemap + OG URLs still say
  `grub-lime.vercel.app` (Codex's launch audit). Set it to `https://grubhouse.uk`,
  redeploy.
- **Lighthouse LCP ~23s** (single synthetic run, Codex audit) — render-blocking
  fonts + ~4MB payload + Singapore region. Re-measure after the region move;
  then attack fonts/payload if still bad.
- **Supabase redirect allow-list** still needs `grubhouse.uk/**` (T0.3).

### E. Known-gated code items (unchanged, correct as-is)
- `0025` (recipe-images bucket) **not applied on prod → uploads broken live.**
- `0024` (canonical unique index) blocked on 10 null `canonical_name` rows →
  needs the `/dev` repair, which needs working sign-in (SMTP).
- Authenticated a11y harness written, never run (needs a session).

---

## Part 2 — Missing features

Distinguishing **deliberately out of scope** from **genuine gaps**.

### Deliberately excluded (per CLAUDE.md — not oversights)
Multi-supermarket, native app, AI recipe recommendations, open-banking payment
verification. Leave these alone.

### Genuine gaps worth considering
1. **Out-of-app notifications — the biggest real gap.** Push was cut, so the
   only nudges are in-app banners + the countdown — which only fire if someone
   opens the app. For a *coordination* tool (cutoff approaching, shop ordered,
   "you owe £X", delivery checked) that's weak. **What changed:** Resend is now
   wired and the domain verified — so **transactional email nudges are suddenly
   cheap and available**, with no service worker or VAPID keys. This reframes
   CLAUDE.md's "in-app only" stance, which was written when no delivery
   mechanism existed. **Needs a product decision**, but it's the highest-value
   candidate now that the plumbing exists.
2. **Dietary-conflict surfacing.** Recipes carry `dietary_tags` and accounts
   carry constraints, but nothing appears to warn "this meal clashes with a
   housemate's stated diet/allergy" at planning time. Worth verifying, likely a
   gap. Safety-adjacent (allergies), so higher stakes than it looks.
3. **GDPR data export.** Privacy page offers deletion but no "download my data".
   For a UK product handling personal + financial data, a data-access path is
   arguably expected at real launch. Low effort.
4. **Auth fallback.** Magic-link only — if email is slow or bounces, there's no
   other way in. (Passwords were considered and rejected this session for good
   reasons; flag as accepted risk, not a to-do.)
5. **Switching / multiple houses.** A user belongs to one house; students move
   houses between years. No switch/leave-and-rejoin-elsewhere flow. Probably
   post-MVP, noting for completeness.

---

## Part 3 — Plan (ordered)

### Now — unbreak and harden what's live
1. **Apply `0025` on prod** (owner, SQL editor) — uploads are silently broken
   until this runs. Independent of the region move; do it today.
2. **Set `NEXT_PUBLIC_SITE_URL=https://grubhouse.uk`** on Vercel + redeploy;
   add `grubhouse.uk/**` to Supabase redirect allow-list (T0.3).
3. **Fix the doc drift** (me) — one honest pass over `CLAUDE.md`'s header +
   collapse the four status docs into one. Cheap, stops future confusion.

### Next — the region move, carrying the DB fixes with it
4. **T0.2 Supabase → UK region.** Stand up the UK project from migrations, and
   **in the same effort apply the B+C hardening** as new migration files:
   - `(select auth.uid())` rewrite of the 10 RLS policies,
   - covering indexes on the 15 FKs,
   - drop `push_subscriptions` + delete migration `0022`,
   - revoke `anon`/`authenticated` EXECUTE on the non-public SECURITY DEFINER
     functions,
   - `search_path` on `generate_invite_code`.
   Then move `vercel.json` `regions` to the UK region. This is the single
   biggest real-world speed win **and** closes most of the audit in one pass.
5. **Re-run the merge/repair on the UK data → apply `0024`** (canonical unique
   index) once `/dev → Duplicate ingredients` is clean.

### Then — the notification decision (biggest product lever)
6. **Decide on email notifications** (product call). If yes: a small set of
   Resend-sent transactional emails on the real cycle events (cutoff soon, shop
   ordered, split posted / you owe £X, delivery checked). Keeps money copy flat
   per the voice rules. If no: document that in-app-only is a deliberate MVP
   choice so it stops looking like an omission.

### Then — launch gate leftovers
7. **Enable Vercel Web Analytics** in the dashboard (the consent banner already
   ships; this is the one toggle that makes "accept" produce data).
8. **Run the authenticated a11y harness** (needs one signed-in session) → triage.
9. **Legal review** of Privacy/Terms + controller name (contact email now done).
10. **Re-measure Lighthouse** post-region; attack fonts/payload if still slow.

### Verify-against-reality (unchanged, real-world blocked)
11. `bookSlot()` and reconciliation vs. a real Tesco delivery — close only with
    a real order.

### Product decision needed before building
- Dietary-conflict warning (#2 above) and GDPR export (#3) — small, worth doing
  for a real launch; confirm you want them before I build.
