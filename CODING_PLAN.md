# Grub — Coding Plan

_The actionable "how" for the unfinished work. `ROADMAP.md` is the high-level
status; this is the per-feature implementation detail. Deployment target is
Vercel + Supabase, with the Tesco order step kept on the collector's desktop
(Option B) — see `README.md`._

Each item: **goal · approach · files · acceptance · effort**. Ordered by
priority. Nothing here invents a figure or touches `lib/tesco/` or `mockups/`.

---

## P1 — do first (high value, low risk, unblocked)

### 1. Login page desktop layout
- **Goal:** `/login` fills a desktop screen like the onboarding flow now does,
  instead of a narrow centred column in a sea of oat.
- **Approach:** Extract the Forest brand panel currently inline in
  `onboarding/layout.tsx` into a shared component (e.g.
  `src/components/nav/AuthShell.tsx` — a two-column grid with the sticky brand
  panel on the left, `children` on the right, panel hidden below `lg`). Point
  `onboarding/layout.tsx` at it, and add `src/app/login/layout.tsx` that uses
  it too. Login sits outside `/onboarding`, so it needs its own layout — the
  shared component is what keeps them from drifting.
- **Files:** new `src/components/nav/AuthShell.tsx`; edit `onboarding/layout.tsx`;
  new `src/app/login/layout.tsx`. Dedupe the login page's own wordmark on `lg`
  the same way the picker does.
- **Acceptance:** login + all onboarding pages fill desktop and share one brand
  panel; mobile unchanged; heading hierarchy intact; `npm run verify` clean.
- **Effort:** ~1–2h.

### 2. Deploy-safety for the Tesco order step
- **Goal:** On Vercel the order/checkout step can't drive a browser (Option B).
  It must fail with a clear "this step runs on the collector's desktop" message,
  not a cryptic serverless crash.
- **Approach:** Audit the server actions that drive Playwright (start at
  `src/app/basket/tescoActions.ts`, `src/lib/tescoResolver.ts`). Add a guard
  that detects the no-browser environment (e.g. a `TESCO_ORDERING_ENABLED` env
  flag, defaulting off in production) and returns a typed, friendly result the
  UI already knows how to show, rather than throwing. The Basket checkout button
  surfaces the message on narrow/again-on-serverless the same way
  `TescoSessionModal` already explains the desktop requirement.
- **Files:** the Tesco-driving actions above; the Basket checkout UI; document
  the flag in `.env.example` + README.
- **Acceptance:** on a deploy with the flag off, the order step shows a clear
  explanation and never 500s; locally with it on, nothing changes.
- **Effort:** ~1–2h. **Do not modify `lib/tesco/`** — guard at the call site.

---

## P2 — feedback & learnability (unblocked)

### 3. Toast notifications
- **Goal:** The app is silent when something saves. A brief confirmation
  ("Added to Monday", "Split posted") makes actions feel real.
- **Approach:** A client `ToastProvider` + `<Toaster>` mounted once in
  `AppChrome`, exposing a `useToast()` hook. Trigger from the client components
  that already own each mutation's result — where a form uses `useActionState`,
  fire a toast on the idle→success transition; where it's a `useTransition`
  action, fire on resolve. Start with the highest-value paths (post split, add
  meal, join/leave, mark paid) and widen from there.
- **Money rule:** toasts are chrome, so motion is fine — but a toast next to a
  money action stays plain and factual, never a joke.
- **Files:** new `src/components/ui/Toast.tsx` (provider + component); mount in
  `AppChrome`; wire the chosen call sites.
- **Acceptance:** confirmations appear and auto-dismiss; respect
  `prefers-reduced-motion`; keyboard-dismissible; `aria-live` so they're
  announced; `npm run verify` clean.
- **Effort:** ~3–4h (the provider is quick; the value is in the wiring).

### 4. In-app first-run tips
- **Goal:** Short, dismissible guidance on each tab explaining what it's for,
  beyond the one-time onboarding walkthrough.
- **Approach:** A `<FirstRunTip>` client component keyed per tab, dismissal
  stored in `localStorage` (a per-viewer UI convenience, not app data — no
  fabrication concern). Wrapped in `try/catch` so a private window that throws
  on `localStorage` still renders. One tip per main tab (Feed/Plan/Basket/Split).
- **Files:** new `src/components/ui/FirstRunTip.tsx`; place on the four tab pages.
- **Acceptance:** a tip shows once per tab, dismissal persists, never blocks
  content, works with storage disabled; `npm run verify` clean.
- **Effort:** ~2–3h.

---

## P3 — polish & data hygiene

### 5. `canonical_name` unique index (data-gated)
- **Goal:** Enforce one ingredient row per canonical name, so pooling can't be
  silently defeated by a duplicate.
- **Approach:** Write the migration adding a unique index on
  `ingredients.canonical_name`. **It cannot be applied until existing rows are
  clean** — CLAUDE.md notes real rows already collide, and a migration that
  fails on live data is worse than none. So: write it, and gate it behind
  running `/dev → Duplicate ingredients` until that reports clean.
- **Files:** new `supabase/migrations/00XX_canonical_name_unique.sql`; a note in
  the migration and ROADMAP that it lands after the merge tool is clean.
- **Acceptance:** migration written and reviewed; applied only once the merge
  tool reports no clusters. Until then it stays unapplied by design.
- **Effort:** ~1h to write; application is a separate, data-gated step.

### 6. Richer new-house empty states
- **Goal:** The first ten minutes of an empty house are the weakest stretch.
  The empty states are honest but sparse.
- **Approach:** Enhance the existing `FirstMealModal` / Feed+Plan empty states —
  warmer copy, clearer single next action, without inventing any figure. This is
  refinement of what exists, not new plumbing.
- **Files:** `src/components/plan/FirstMealModal.tsx`, the Feed/Plan/Recipes
  empty-state blocks, `src/components/ui/EmptyState.tsx`.
- **Acceptance:** an empty house has an obvious, inviting first step on every
  main screen; still no fabricated data; `npm run verify` clean.
- **Effort:** ~2h.

---

## P4 — larger, later

### 7. Real recipe images (uploads)
- **Goal:** Let a recipe carry a real photo instead of the deterministic tinted
  tile.
- **Approach:** A Supabase Storage bucket + RLS, an upload control on the recipe
  form, and `FoodImage` already passes through a real `src` when present — so
  the render side largely exists. The work is the bucket, the upload action, and
  the RLS policy.
- **Files:** a new migration for the bucket + policy; recipe form + action;
  minor `FoodImage` wiring.
- **Acceptance:** a recipe can have an uploaded image, shown everywhere
  `FoodImage` renders; falls back to the tile when absent; RLS prevents writing
  to another house's images.
- **Effort:** ~1–2 days.

---

## Prep now, run when unblocked

### 8. Authenticated-route accessibility test harness
- **Goal:** The a11y work so far is static/build-verified; Plan/Recipes/Basket/
  Split have never been axe/keyboard-tested against a live signed-in session.
- **Approach:** Write a Playwright spec that signs in (once a session exists),
  seeds demo data via `/dev`, and runs axe + a tab-order pass over the four
  screens. **Blocked on a session** (magic-link login can't be automated
  headlessly), but the spec can be written now and run the moment a session is
  available.
- **Files:** new `src/__tests__/e2e/a11y-authenticated.spec.ts`.
- **Acceptance:** spec exists and runs green once pointed at a signed-in
  context; documents what it couldn't verify until then.
- **Effort:** ~2–3h to write.

---

## Blocked on the real world (not codeable yet)

- **`bookSlot()`** — reserving a Tesco slot is coded but never executed; needs a
  real session against the live API.
- **Reconciliation vs. a real delivery** — the money rules are unit-tested and
  exercised via `/dev`, but have never met an actual Tesco van.

Both are verification-against-reality, not building. They close only with a real
order and a real delivery.

## Out of scope (per CLAUDE.md — do not build)

Multi-supermarket, native app, AI recipe recommendations, open-banking payment
verification, push notifications. Deferred past MVP on purpose.

---

## Suggested order

1 → 2 (finish the desktop work + make the deploy honest) →
3 → 4 (feedback + learnability, the biggest felt improvement) →
5 → 6 (hygiene + polish) →
8 (write the a11y harness) → 7 (uploads, when there's appetite for a bigger one).
