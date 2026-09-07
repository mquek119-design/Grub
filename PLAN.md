# Grub — Master Plan: everything unfinished

_Written 2026-09-07. This is the single consolidated view of what is left,
superseding the scattered "what's next" in `ROADMAP.md`, `CODING_PLAN.md` and
`LAUNCH_CHECKLIST.md` where they disagree with it (those three are now partly
stale — e.g. ROADMAP still says "no deployed environment" and "105 tests"; the
app is deployed at `grub-lime.vercel.app` and the suite is 169 tests). Read
`CLAUDE.md` first; it remains authoritative on product rules._

## True current state (verified 2026-09-07)

- **Deployed** to Vercel at `grub-lime.vercel.app`; auto-deploys on push to
  `main`. Function region pinned to `sin1` via `vercel.json` to match the
  Supabase project (which is in Singapore — see T0.2).
- `npm run verify` clean; Jest **169/169** passing.
- CODING_PLAN items 1–8 all shipped, including recipe photo uploads (#7) and
  the written-but-unapplied `canonical_name` unique index (#5).
- The UI-inspiration pass (Mob / OffLimits / Fly By Jing / Magic Spoon) shipped:
  recipe-card photo badges, Forest colour blocks on onboarding chrome, a marquee
  on the empty recipe book.
- Custom domain `grubhouse.uk` registered (Cloudflare), pointed at Vercel; Resend
  email domain verified; Supabase custom SMTP being wired.

---

## Tier 0 — Owner-only / operational (I cannot do these; they gate launch)

These need dashboard access or a real-world action. Nothing in code blocks them.

| # | Task | Why it matters | Notes |
|---|------|----------------|-------|
| T0.1 | **Finish Supabase custom SMTP** (Resend) | Magic-link sign-in currently errors / hits the shared rate limit | Host must be `smtp.resend.com` (was typo'd `stmp`). Sender `@grubhouse.uk`. Then send a test link. |
| T0.2 | **Migrate Supabase to a UK/EU region** | Biggest real-world speed lever. Project is in Singapore; Grub is for UK students. Every navigation pays a Singapore round trip. | New project in London/Ireland, migrate schema + data, then change `vercel.json` `regions` to match in the same commit. LAUNCH_CHECKLIST #21. |
| T0.3 | **Supabase redirect-URL allow-list** | The "requested path is invalid" magic-link error | Add `https://grub-lime.vercel.app/**` (and the `grubhouse.uk` equivalent once that's the live host) under Authentication → URL Configuration. |
| T0.4 | **Run migrations `0024` + `0025` on prod** | `0025` (recipe-images bucket + RLS) must run or uploads fail; `0024` (canonical unique index) only after the merge tool is clean — see T1.3 | `0025` can run now; `0024` is data-gated. |
| T0.5 | **Point `grubhouse.uk` at the app (optional)** | Nicer than `grub-lime.vercel.app` for real users | Vercel → Domains; Cloudflare DNS record must be "DNS only" (grey cloud), not proxied, or Vercel's SSL breaks. |
| T0.6 | **Authorise the Claude GitHub App (optional)** | The scheduled cloud routine does work but can't push | `github.com/apps/claude/installations/select_target`. Only needed if you want the cloud agent to commit on its own. |

---

## Tier 1 — Genuinely unfinished in the codebase (I can do these)

### T1.1 — Push notifications: DECISION NEEDED, do not just "finish"
**State:** half-built and in tension with the product rules. There is a service
worker (`public/service-worker.js`), a subscribe route
(`src/app/api/push/subscribe/route.ts`), the `push_subscriptions` table
(migration 0022), a `PushNotificationSetup` client component, and
`src/lib/pushNotifications.ts` — but the last one **stubs the actual send**
(no `web-push` dependency, no VAPID private key, comments say "in production
this would…"). Meanwhile **CLAUDE.md and ROADMAP explicitly list push as
out-of-scope for MVP** ("in-app banners and the countdown timer" instead).

So this is not a "finish the feature" task — it is a contradiction to resolve.
Three honest options:
- **(a) Rip it out** — delete the half-built push code and the migration, keep
  the MVP scope as documented. Cleanest; removes dead code that looks done.
- **(b) Leave it dormant, documented** — keep the infra but add a clear "not
  wired, parked" note so nobody assumes it works. Lowest effort.
- **(c) Actually finish it** — add `web-push`, wire VAPID keys, a real send from
  the weekly-cycle events, a manifest (there is none), and **overturn the
  CLAUDE.md scope decision on purpose**. Largest; needs your explicit call to
  change scope.

**Recommend (a) or (b).** Do not do (c) without deciding to change the MVP scope.

### T1.2 — Authenticated-route a11y harness: RUN IT
**State:** the Playwright spec exists (`src/__tests__/e2e/a11y-authenticated.spec.ts`,
axe + skip-link over Plan/Recipes/Basket/Split) but self-skips with no saved
session. **Blocked only on a one-time human step:** run `npm run e2e:auth`,
finish the magic-link sign-in in the opened browser, then `npm run e2e:a11y`.
Once a session exists I can act on whatever it flags. ~0 build effort; it's a
"press go" task, then triage.

### T1.3 — `canonical_name` unique index: apply the gate
**State:** migration `0024` written but deliberately unapplied. The `/dev →
Duplicate ingredients` tool now reports both duplicate clusters and stale
stored keys. **Task:** run the merge tool against prod until it reports clean,
then apply `0024` (T0.4). Data-gated, owner-run, but I can help verify the tool
output. ~0 code.

### T1.4 — Image compression on upload
**State:** recipe uploads shipped (T… CODING_PLAN #7) with a 5MB cap but **no
client-side compression** — a phone photo uploads at full size. LAUNCH_CHECKLIST
#11. **Task:** compress client-side before the server action (canvas/`createImageBitmap`
downscale to ~1600px, re-encode to JPEG/WebP ~0.8). Pure frontend, no new deps
needed, no server change. ~2–3h. I can do this now.

### T1.5 — Uploaded-photo alt text audit
**State:** `FoodImage` currently passes the recipe title as `alt` for uploaded
photos. That's fine as a fallback but reused blindly it can read oddly.
LAUNCH_CHECKLIST #10. **Task:** confirm every `FoodImage` call site with a real
`src` gives meaningful alt, not a decorative `alt=""` where a screen-reader user
needs the dish name. ~1h audit. I can do this now.

---

## Tier 2 — Launch gate (LAUNCH_CHECKLIST; mix of build + owner)

- **Legal review of Privacy + Terms (#1, #2)** — drafts exist and are flagged
  "pending legal review"; needs a real controller/contact and a human legal
  pass. Owner. Blocking a *public* launch, not a private test.
- **Cookie consent banner (#5)** + **analytics (#19)** — none yet. Do as a pair.
  Vercel Analytics is ~one line and privacy-friendly; consent banner ties to the
  Privacy page. I can build both. ~half a day.
- **Deploy-time audits (#3, #6, #7, #9, #12, #16, #17)** — cheap, need the live
  URL: grep the client bundle for secrets, verify OG image renders, verify
  robots/sitemap return 200 signed-out with production URLs, run Lighthouse
  against the deployed site, sweep for broken links, check form-validation
  parity. Mostly me + a live URL. ~half a day total.

---

## Tier 3 — Blocked on the real world (cannot be closed by code)

- **`bookSlot()`** — reserving a Tesco slot is coded but never executed against
  the live API. Needs a real collector session + UK address.
- **Reconciliation vs. a real delivery** — money rules are unit-tested and
  exercised via `/dev → Simulate delivery`, but have never met an actual Tesco
  van. Closes only with a real order and a real delivery.
- **Tesco session storage (migration 0023)** — DB-backed session storage exists;
  its real exercise is the same blocked real-order path.

These are verification-against-reality, not building. Don't treat them as code
tasks.

---

## Explicitly out of scope (per CLAUDE.md — not oversights)

Multi-supermarket, native mobile app, AI recipe recommendations, open-banking
payment verification. And **push notifications** unless T1.1 decides otherwise.

---

## Recommended order

1. **Unblock sign-in** (T0.1 SMTP, T0.3 redirect URLs) — nothing can be tested
   with real accounts until magic links work.
2. **T1.1 decision** on push — resolve the scope contradiction before it rots
   further (I recommend rip-out or document-as-parked).
3. **T1.4 + T1.5** (image compression + alt audit) — small, mine, close out the
   loose ends the uploads feature left.
4. **T1.2** a11y harness run (needs your one-time session) → I triage findings.
5. **Tier 2** launch gate: analytics/consent + deploy-time audits.
6. **T0.2** the Supabase UK-region migration — before announcing publicly; it's
   the difference between fast and broken for the actual audience.
7. **Legal review** (#1/#2) — the last gate before a truly public launch.
8. **Tier 3** closes itself the first time a real house runs a real shop.

## The rule that governs all of it

No figure is ever invented. Every screen reads a real row or shows an honest
empty state. Keep it that way.
