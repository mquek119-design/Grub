# Grub — Roadmap & Current State

_Last updated: 2026-09-06. Read `CLAUDE.md` first — it is the authoritative
source for architecture and product rules. This file is the forward-looking
"what's done, what's half-built, what's next" view. Where it disagrees with
older planning docs (`WEEK1_*`, `AUDIT_FINDINGS_AND_ROADMAP.md`, the
`OPTION*.md` files), this one is newer._

## Where the project is

Working end to end on localhost: auth, onboarding, the two-week plan, the
overlap optimiser against live Tesco prices, the posted split, reconciliation,
staples, guests, leftovers, one-off purchases. `npm run verify` is clean and
the Jest suite (105 tests) passes. **There is still no deployed environment.**

The honest headline: the app is more finished than the old planning docs imply.
Several things listed as "outstanding" were already built; the real recent work
has been accessibility, framework-upgrade hygiene, and the desktop pass on
onboarding.

---

## Done recently (verified, on `main`)

- **React 19 migration** — `useFormState` → `useActionState` across every form;
  form field values now survive a validation error.
- **Accessibility pass** (static, build-verified):
  - Modal dialog semantics + a real focus trap with focus restore
    (`useModalA11y`), on `BrandSwapModal` and `FirstMealModal`.
  - Ingredient autocomplete given real WAI-ARIA combobox semantics.
  - Skip-to-content link (WCAG 2.4.1).
  - Avatars announce as the named person (`role=img` + `aria-label`).
  - Form error linking (`aria-describedby`), required-field markers,
    heading-hierarchy fixes.
- **Next 16 hygiene:**
  - `next.config.js` `serverExternalPackages` was nested under the pre-v15
    `experimental.serverComponentsExternalPackages` key — silently a no-op, so
    Playwright/Puppeteer were not actually being excluded from the client
    bundle. Fixed; confirmed no client chunk references them now.
  - `middleware.ts` → `proxy.ts` (Next 16 renamed the convention).
  - `RealtimeListener` (the Supabase realtime client) was static-imported into
    every page's chrome; now `next/dynamic`-split so it loads after hydration.
- **Onboarding:**
  - The post-signup "How Grub Works" page rebuilt into a real walkthrough —
    the week in order (5 steps) + a guide to the five tabs.
  - A shared desktop **brand panel** (`onboarding/layout.tsx`) so the whole
    onboarding flow fills a desktop screen instead of a narrow centred column.
    Mobile unchanged.
- **Deployment groundwork:** a `README.md` (there was none) and a cleaned-up
  `.env.example` (dropped the dead `TESCO_SESSION_PATH`).

---

## Half-finished (in the codebase, incomplete)

| Item | State | What's left |
|---|---|---|
| **`bookSlot()`** | Coded, never executed | Reserving a slot is untried against the live Tesco API. Needs a real session. |
| **Reconciliation vs. a real delivery** | Fully implemented, exercised only via `/dev` → Simulate delivery | Has never met an actual Tesco van. Money rules are unit-tested but unproven in the wild. |
| **Ingredient de-duplication** | `canonicalName()` folds case/plurals/qualifiers; `/dev` merge tool handles mid-string variants | `canonical_name` still has **no unique index** — existing rows collide. Add the constraint once the merge tool reports clean. |
| **Login page desktop layout** | Still a narrow centred column | Sits outside `onboarding/layout.tsx`, so it didn't get the desktop brand-panel treatment. Same sparse look the onboarding flow had. |
| **Push notifications** | Copy exists (`FEATURES.md`), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is read, subscribe route exists | No service worker, no manifest, no keys set. Deliberately parked for MVP (see below). |

---

## Not started / planned

- **Deployment (the big one).** No deployed environment exists. To ship to
  Vercel: set the Supabase env vars in Vercel, point the Supabase Site URL /
  redirect URLs at the production domain, and decide a Node version
  (`engines` field in `package.json` is currently unset). README covers the
  outline.
- **Live accessibility testing of the authenticated screens.** Everything
  shipped so far is *static* a11y, correct by construction and build-verified.
  Plan / Recipes / Basket / Split have never been keyboard/axe-tested against a
  running signed-in session — see Blocked.
- **In-app help / first-run tips** — tab guidance inside the app, beyond the
  onboarding page.
- **Toast notifications** — the app is currently silent when something saves
  (added a meal, posted a split). A confirmation toast would help.
- **Richer new-house empty states** — the empty states exist and are honest
  (Feed, Plan, Recipes, plus `FirstMealModal`), but the very first ten minutes
  are still the weakest stretch of the product.
- **Real recipe images** — currently deterministic tinted tiles; could allow
  uploads.

---

## Blocked (needs you or an external change)

- **Live testing of the logged-in screens** — needs a signed-in session. The
  app logs in by emailed magic link, which can't be completed headlessly. Fix:
  sign in on `localhost:3002` once and seed demo data via `/dev`, then the
  authenticated screens can be driven and tested.
- **The cloud routine pushing its own work** — the scheduled "Grub Schedule"
  cloud agent does the work but can't push: the Claude GitHub App isn't
  authorised for the repo. Fix: authorise it at
  `https://github.com/apps/claude/installations/select_target`. (Local pushes
  from this machine work fine — that's how everything above landed.)

---

## Recommended sequence

1. **Deployment prep + first deploy** — the single highest-value milestone;
   nothing else matters until real housemates can reach it. Decide the Node
   version, wire Vercel + Supabase, deploy.
2. **Login page desktop pass** — quick, finishes the desktop-layout work the
   onboarding flow started.
3. **Live a11y testing of the authenticated routes** — needs a session (see
   Blocked); do it once one's available.
4. **Toast notifications / in-app tips** — polish that makes the app feel
   responsive and learnable.
5. **The Tesco-dependent unknowns** (`bookSlot`, real reconciliation) — can
   only be truly closed once there's a real order against a real delivery.

---

## Explicitly out of scope (per CLAUDE.md — not oversights)

Multi-supermarket support, a native mobile app, AI recipe recommendations,
open-banking payment verification, and push notifications are all deliberately
deferred past MVP. Don't build these yet.

## The rule that governs all of it

No figure is ever invented. Every screen reads a real row or shows an honest
empty state. In a money app, one fabricated number seen through costs more than
any blank panel. Keep it that way.
