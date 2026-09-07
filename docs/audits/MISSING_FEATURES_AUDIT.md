# Missing features audit — 7 September 2026

Scope: static review of the current working tree, PLAN.md, CLAUDE.md, launch
checklist, route inventory and account/house/basket/leftovers actions. No live
account, database or Tesco order was exercised. Existing edits to Plan and
Recipes were left untouched. Missing features below are proposals, not an
instruction to expand the MVP automatically.

## Confirmed gaps

| Priority | Gap | Evidence and user impact | Suggested scope | Change risk |
|---|---|---|---|---|
| P0 | Actual order confirmation | `src/app/basket/tescoActions.ts`, `syncBasketToTesco`, sets `ordered` after adding trolley items; `startTescoCheckout` only calls `checkout(true, ...)`. Trolley sync can therefore unlock order-dependent flows before a purchase exists. | Separate trolley preparation from a collector-confirmed placed order; guard the transition on the server and test split eligibility. This is a correctness defect as well as a missing transition. | High: money and week state |
| P1 | Usable handoff from hosted app to Tesco ordering | `src/lib/tescoOrdering.ts` intentionally disables ordering in production; `BasketView.tsx` says to open locally. There is no ordinary hosted manual-order confirmation path in the basket actions reviewed. | Provide an explicit manual shopping/check-out handoff and collector confirmation, preserving the desktop-only integration decision. A desktop installer or cloud browser is not implied. | Medium/high: order state |
| P1 | Edit your name and room from Account | Account displays both, but `src/app/account/actions.ts` only exposes payment/dietary edits, leaving and deletion. Room entry lives in onboarding. | A small profile form with save feedback, validation and the ability to clear a room. | Low |
| P1 | Replace a shared invite code | House settings displays/copies the invite; no rotate/revoke action was found in onboarding/settings actions. | Explicitly authorised code rotation, so the old invitation stops working. Decide who may rotate it; rotation must not remove current members. | Medium: membership permissions |
| P2 | Correct a leftover entry or undo a mistaken take | `src/app/leftovers/actions.ts` only adds dishes and takes/removes portions. No edit or undo action. | Start with editing your own description/portion count/date. Any undo must respect other housemates' subsequent changes. | Low for text edits; medium for portions/undo |
| P2 | Complete account-erasure support path | `deleteAccount` explicitly removes the profile but retains the Supabase Auth login. The Privacy page explains retention. | Define a supported owner-assisted identity deletion process first; automated deletion requires a carefully isolated privileged backend. Do not remove debt guards. | High for automation |
| P2 | Download personal records | No user-facing data-download route/control was found in the reviewed app inventory. Balance history does exist. | Optional export of the caller's own records, with explicit treatment of other housemates' information. This audit does not claim a self-service button is legally mandatory. | Medium: data disclosure |
| P3 | Browse older meal plans | `WeekSwitcher.tsx` offers this week and next week only. Financial history is available separately. | Optional read-only archive if real users need to repeat or inspect old weeks. | Low/medium |

## Defects to keep separate from feature requests

- Leftover portion updates read a value then write `portions - 1` without a
  version/quantity condition (`clearLeftover`). Two concurrent takes can lose
  a decrement. Use an atomic database operation or checked conditional update.
- Account deletion treats an expense-share query error as an empty result
  (`shares.error ? [] : ...`). The outstanding-money check should fail closed.
  This is a static finding; no deletion was attempted.
- The order-confirmation defect above should be fixed before treating the
  existing `ordered` guard as proof that a purchase actually happened.

## Setup and verification, not missing features

- User reports Vercel Analytics enabled and the site URL variable configured.
  Verify the deployed outcome; do not ask them to repeat these steps by default.
- Domain email/support contact and controller identification/legal review remain
  unfinished. Domain ownership itself is already handled.
- Confirm working Supabase SMTP and a full magic-link round trip; current
  dashboard state was not inspected in this audit.
- Confirm migration 0025 for recipe storage; apply 0024 only after ingredient
  duplicates and stale canonical keys are clean. Production application status
  is unverified here.
- Run authenticated accessibility/form checks with a saved session.
- Exercise slot reservation, Tesco session persistence and delivery
  reconciliation against a real order. Implementation exists; evidence is missing.
- Verify domain metadata and investigate measured mobile performance after
  deployment. Region migration is an operational decision, not a new feature.

## Already implemented — do not rebuild

Role/state-aware Feed action card; first-run tips; toasts; starter recipes;
ingredient autocomplete; recipe import and photo upload/compression; pantry and
shared staples; guests; leftovers board; per-item splits; payment notification,
confirmation and dispute; delivery reconciliation; one-off expenses; balance
history; leave-house flow; profile deletion; analytics consent controls.
Presence in source is not a claim that every path has passed live acceptance.

## Deliberately deferred

Multi-supermarket support, native app, push notifications, AI recommendations and
open-banking verification remain out of scope under CLAUDE.md. Leftovers claim
ownership/cost accounting is deliberately absent, not an omission.

## Recommended next work

1. Fix the expense-check failure and concurrent leftover decrement with focused tests.
2. Ship Account name/room editing as the clearest low-risk feature.
3. Define invite-rotation permissions, then implement and test them.
4. Design order confirmation and hosted/manual handoff together before editing
   financial state transitions. This is the highest-impact remaining flow gap.
5. Add leftover editing; leave exports and meal archives until user feedback
   supports them.

PLAN.md and LAUNCH_CHECKLIST.md contain stale claims (including no analytics,
unfinished compression and old domain state). Use current source and verified
deployment evidence before selecting work from those unchecked rows.

---

## Follow-up Audit — Additional Non-Redundant Gaps & UX Enhancements

_Audited September 2026. Preserved all previous Codex audit findings intact. The following items represent new, non-redundant UX and functional gap proposals derived from a complete sweep of `/plan`, `/split`, `/basket`, `/leftovers`, and `/account` workflows._

### Additional Confirmed Gaps & Feature Proposals

| Priority | Feature / Gap | Rationale & User Impact | Suggested Scope | Complexity / Risk |
|---|---|---|---|---|
| P2 | **Housemate Dietary Conflict Warnings in Meal Planning** | Users record dietary requirements (`users.dietary`) in `/account`, but `WeekPlan.tsx` and `MealOptionsSheet.tsx` do not highlight conflicts when adding/assigning meals to housemates with incompatible dietary requirements (e.g. assigning a non-veggie recipe to a vegetarian housemate). | Display subtle dietary warning badges in meal options sheet and roster view when a meal's tags conflict with an assigned housemate's profile settings. | Low |
| P2 | **Custom Portion Multipliers per Participant (Nx)** | `PlannedMeal` currently assumes 1 portion per opt-in participant + guest additions. Housemates cooking for lunch prep or larger appetites cannot reserve Nx portions for themselves. | Allow participants in `MealOptionsSheet.tsx` to set a portion multiplier (1x, 2x, 3x...) with auto-computed cost/ingredient allocation, syncing to cook's max capacity limit and displaying "Meal Prep / Extra Portions" badges for the cook. | Medium: affects recipe quantity calculations and capacity limits |
| P2 | **Quick "Running Low" Staple Toggles on Feed** | Staples (`houseStaples`) can be added to the basket from `/basket`, but housemates spotting a depleted staple in the kitchen must navigate to the Basket page to flag it. | Add a "Flag Staple as Low" quick action tile on `/feed` or in the staple overview card. | Low |
| P3 | **Print / Copy Text Format for Weekly Plan & Shopping List** | Student households often want a physical printout for the fridge door or a plain text summary to paste into house WhatsApp/Discord chats. | Add a "Copy Text Roster" and clean print stylesheet (`@media print`) trigger on `/plan` and `/basket`. | Low |
| P3 | **Exportable Settlement Breakdown Receipts** | After reconciling a shop on `/split`, housemates have no way to export a plain text or PDF breakdown receipt showing individual item allocations and final totals for tenancy/end-of-term records. | Add a "Share Settlement Breakdown" action in balance history that generates a copyable text summary or printable receipt. | Low |
| P3 | **Search & Filter in Balance & Transaction History** | The balance history on `/split` displays all past settlements and manual payments in a single chronologically sorted list without filtering by date or housemate. | Add a simple search input and housemate filter dropdown above the transaction history list. | Low |

---

## Live Database & Route Sweep — Critical Bugs & Access Control Gaps

_Audited 2026-09-07 via live Supabase MCP + HTTP route sweep. These are real blocking defects, not feature proposals._

### Critical Bugs (RLS Delete-Policy Gaps)

Three tables had RLS enabled but **no DELETE policy**, causing direct `.delete()` calls to silently affect zero rows — no error, just silent failure. Found by auditing every table's policies against the app's actual delete() call sites:

| Bug | Impact | Status |
|---|---|---|
| **`ingredients` no DELETE policy** | `/dev → Duplicate ingredients` merge tool never worked; merges silently succeeded in repointing references but failed to delete loser rows, leaving duplicates and orphans. | **Fixed: migration `0026` applied** |
| **`profiles` no DELETE policy** | `deleteAccount()` was fully broken for every user — profile delete silently affected 0 rows, so the action always returned "that account is not yours to remove." Account deletion was unreachable. **GDPR-relevant.** | **Fixed: migration `0027` applied** |
| **`splits` no DELETE policy** | `postSplit()` cleanup of zeroed-out debts (when someone leaves every meal) silently no-opped, leaving phantom debt rows for people who owed nothing. | **Fixed: migration `0027` applied** |

**Also fixed:** Account deletion's expense-share balance check failed open on query error (`shares.error ? [] : …`); now mirrors the splits check and fails closed.

### Access Control Gap

- **`/dev` is not admin-gated** — only checks `houseId`. Any housemate can reach it and hit "Clear everything" / "Reset demo data" to nuke the house's entire dataset. CLAUDE.md itself calls it a "workbench for one person" where "half of what is on it deletes the house" — but nothing enforces that. **Needs gating or hiding in prod.**

---

## Deep-Dive Feature Specifications & Mob.co.uk Audit Findings

_Audited September 2026. Expanded specifications based on user requirements and Mob.co.uk design audit._

### 1. P0 — Actual Order Confirmation & State Machine (Detailed Breakdown)
- **Current Defect:** `syncBasketToTesco` in `src/app/basket/tescoActions.ts` sets `thisWeek.status = 'ordered'` as soon as items are sent to the Tesco trolley. Adding items to an online cart is not a financial purchase; if the shopper cancels checkout or cart sync fails mid-way, the app gets trapped in `'ordered'` mode, locking planning and triggering post-order split reconciliation prematurely when £0 was actually charged.
- **Detailed Solution:** Introduce a explicit state flow:
  1. `planning` (building week meal roster & basket)
  2. `trolley_syncing` / `trolley_ready` (items synced to Tesco, but checkout not finished)
  3. `ordered` (confirmed paid by the shopper).
- **Rule:** The week status only transitions to `ordered` when the designated shopper explicitly clicks **"Confirm Order Placed & Paid"** in Grub, ensuring financial split calculations only execute on actual purchases.

### 2. P1 — Hosted Handoff to Manual Ordering (Detailed Breakdown)
- **Current Gap:** Local dev environments use Playwright to automate Tesco checkout. Hosted deployments (Vercel) cannot run local browser automation to log into private user Tesco accounts. Currently `BasketView.tsx` shows a simple text prompt "open locally to automate".
- **Detailed Solution:** Provide a dedicated **Hosted Shopping Handoff View**:
  - Displays an itemized, aisle-categorized shopping checklist.
  - Displays target quantities, estimated total cost, and direct 1-click store links.
  - Includes a **Pre-Checkout Tesco Substitution Tracker**: if Tesco highlights out-of-stock items or substitutions before final payment, the shopper can log/accept the sub in Grub before placing the order so the initial split calculation is 100% accurate.
  - Prominent **"Mark Order Placed"** button that updates house status on Vercel.

### 3. Account Edit Name & Room Number (With N/A Support)
- Expand `/account` profile form to allow editing display name and room number.
- Explicitly support **"N/A"** or leaving room number empty/blank for housemates living in unnumbered rooms or shared flats without room numbers.

### 4. Dynamic Portion Multipliers ($N\times$) & Cook Capacity Sync
- **Arbitrary Portion Multipliers ($1\times, 2\times, 3\times, \dots$):** Housemates can specify how many portions they want for a meal.
- **Sync to Cook Capacity Limit:** Each extra portion counts against the cook's set `maxCapacity` (e.g., if cook capacity is 6 portions and User A requests $3\times$ portions for gym meal prep, 3 capacity slots are consumed).
- **Cook Roster Badges:** Clearly label extra portions on the cook's meal roster with badges like **"Gym Meal Prep (3x)"** or **"Extra Portions"** so the cook knows exactly why 3 portions are required and for whom.

### 5. Recipe Page Audit vs. Mob.co.uk
- **Design Inspiration from Mob.co.uk:**
  - **Hero Media & Badges:** Full-bleed clean recipe hero images with pill badges for Cook Time, Prep Time, Cost per Portion, Difficulty, and Dietary Tags.
  - **Interactive Cook Mode:** A dedicated full-screen "Cook Mode" with step-by-step swipeable/clickable instructions, screen wake-lock (keeps phone screen on while cooking), and interactive ingredient checkboxes that strike through as ingredients are added.
  - **Dynamic Ingredient Scaling:** Servings adjustment stepper ($2 \rightarrow 4 \rightarrow 6$) that dynamically re-calculates ingredient quantities in real-time.

### 6. Authentication & Log Out Action
- Add an explicit, easily accessible **"Log Out"** action button in `/account` and top-nav user profile menu that clears the Supabase Auth session cookie and safely redirects the user to `/welcome`.

### 7. Welcome Page Value Proposition Revamp
- Revamp `/welcome` hero copy to clearly articulate Grub's unique value proposition:
  - *"Not just another manual order tracker — Grub automates your Tesco basket building, coordinates house meal planning, and automatically reconciles dry-money splits when the shop arrives."*
  - Emphasize zero custody of funds, dry money rules, and automated trolley building.

### 8. Pre-Checkout Tesco Substitutions Tracking & Complete Order Lifecycle
- **How Grub Knows (2 Ways):**
  1. **Automated Mode (Local Playwright Controller):** After Grub pushes the basket to Tesco (`tesco basket`), Grub executes a secondary scan of the active Tesco trolley endpoint (`/api/trolley` or trolley DOM scan). If Tesco returns out-of-stock items or suggested pre-checkout substitutions (e.g. 500g Catering Rice substituted for 1kg Basmati), Grub parses the substitution price/quantity and alerts the shopper before payment.
  2. **Manual / Hosted Mode (Vercel):** On hosted deployments, when the shopper opens Tesco and sees Tesco's pre-checkout substitutions banner, Grub provides a 1-tap **"Re-check / Scan Tesco Basket"** action or log modal so the shopper can confirm pre-checkout substitutions before paying.
- **The Complete 6-Step Order Lifecycle:**
  1. **Build Basket (in Grub):** House plans meals for the week $\rightarrow$ Grub consolidates ingredients into the house shopping list.
  2. **Sync to Tesco Basket:** Grub pushes ingredients into the Tesco trolley (`tesco basket`).
  3. **Pre-Checkout Scan (`grub check basket`):** Grub scans the active Tesco trolley *before checkout*. If Tesco flagged any item as unavailable or replaced with a pre-checkout substitute, Grub reads the substitute price/quantity and updates the shopper (`tesco substitutions`).
  4. **Book Slot & Pay:** Shopper selects delivery time slot, enters payment details on Tesco, and completes checkout.
  5. **Confirm Order Placed:** Shopper clicks **"Confirm Order Placed & Paid"** in Grub $\rightarrow$ week status transitions to `ordered`.
  6. **Delivery & Post-Delivery Amendments:** When the Tesco van delivers, if Tesco made *post-checkout* substitutions at delivery time (e.g., driver hands over a different milk brand or refunds a missing item), the shopper uses Grub's **Check Delivery & Reconcile** screen to record final adjustments before settling money splits.
