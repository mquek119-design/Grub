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
| P2 | **Custom Portion Multipliers per Participant (Double Portions)** | `PlannedMeal` currently assumes 1 portion per opt-in participant + guest additions. Housemates cooking for lunch prep or larger appetites cannot reserve 2 portions for themselves. | Allow participants in `MealOptionsSheet.tsx` to set a portion multiplier (e.g., 1x or 2x) with auto-computed cost/ingredient allocation. | Medium: affects recipe quantity calculations |
| P2 | **Quick "Running Low" Staple Toggles on Feed** | Staples (`houseStaples`) can be added to the basket from `/basket`, but housemates spotting a depleted staple in the kitchen must navigate to the Basket page to flag it. | Add a "Flag Staple as Low" quick action tile on `/feed` or in the staple overview card. | Low |
| P3 | **Print / Copy Text Format for Weekly Plan & Shopping List** | Student households often want a physical printout for the fridge door or a plain text summary to paste into house WhatsApp/Discord chats. | Add a "Copy Text Roster" and clean print stylesheet (`@media print`) trigger on `/plan` and `/basket`. | Low |
| P3 | **Exportable Settlement Breakdown Receipts** | After reconciling a shop on `/split`, housemates have no way to export a plain text or PDF breakdown receipt showing individual item allocations and final totals for tenancy/end-of-term records. | Add a "Share Settlement Breakdown" action in balance history that generates a copyable text summary or printable receipt. | Low |
| P3 | **Search & Filter in Balance & Transaction History** | The balance history on `/split` displays all past settlements and manual payments in a single chronologically sorted list without filtering by date or housemate. | Add a simple search input and housemate filter dropdown above the transaction history list. | Low |

### Implementation & Prioritization Note

All additions above preserve zero custody of funds, dry money rules, and zero invented figures. They do not conflict with or override any existing Codex findings or planned tier work.
