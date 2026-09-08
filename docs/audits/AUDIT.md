# Grub — System & Codebase Audit

_Last updated: 2026-09-08. A consolidated, ground-truth audit covering the live code, database advisors, feature gaps, and launch verification._

---

## 1. Ground-Truth System & Database Audit

Audited against live code and the live Supabase database advisors:

### Database Security
| Severity | Finding | Context & Resolution |
|---|---|---|
| INFO | `push_subscriptions` table has RLS enabled but no policy | Dead table. Push notifications were cleanly removed from the frontend (T1.1). Dropping migration `0022` and the table tidies this up. |
| WARN | `generate_invite_code` has a mutable `search_path` | Minor hardening. Set `search_path = 'public'` on the function. |
| WARN | 19 `SECURITY DEFINER` functions executable by `anon` | Most are intended RLS-helpers/RPCs (`create_house`, `join_house`, demo functions) and check internal identity. As defence-in-depth, revoke `EXECUTE` from `anon` on internal helpers. |
| INFO | Leaked-password protection disabled | N/A — Grub is passwordless (magic link + OTP). |

### Database Performance & Indexing
| Severity | Finding | Context & Resolution |
|---|---|---|
| WARN | 10 RLS policies re-evaluate `auth.uid()` per row | Wrap `auth.uid()` &rarr; `(select auth.uid())` in RLS policies (`profiles`, `splits`, `pantry_items`, `tesco_sessions`) so it evaluates once per query rather than per row. |
| INFO | 15 unindexed foreign keys | Foreign keys on `user_id`, `ingredient_id`, and `recipe_id` benefit from covering indexes for joins and cascades. |
| WARN | Multiple permissive SELECT policies on 2 tables | `pantry_items` and `recipe_ingredients` run multiple policies per query; consolidate when updating migrations. |
| INFO | Unused indexes | Expected pre-launch with low row count. Keep primary indexes; clean up only dead table indexes. |

### Operational Latency Note
- The current Supabase project is hosted in **Singapore**, whereas Grub is built for **UK** shared student houses.
- Every authenticated navigation pays round-trip latency to Singapore.
- **Migration**: Before public launch, migrate to a London/Ireland Supabase instance and update `vercel.json` region to match.

---

## 2. Feature Gaps & Defect Analysis

| Priority | Gap / Area | Evidence & User Impact | Recommended Scope |
|---|---|---|---|
| P1 | **Tesco Order Confirmation** | `syncBasketToTesco` pushes items to Tesco trolley; actual checkout is completed by the collector. | Maintain explicit handoff: collector clicks checkout, syncs trolley, reviews on Tesco.com, and confirms the placed order in Grub to lock the week. |
| P1 | **Profile Details Editing** | Account displays name and room, but only payment/dietary info has active edit actions. | Profile editing form on Account page to change display name and room number. |
| P1 | **Rotate Shared House Invite** | House settings displays the 6-character code; no manual reset exists. | Allow house members to rotate/revoke the invite code if shared outside the house. |
| P2 | **Leftover Concurrency** | Decrementing portions should use an atomic update or version check. | Ensure `portions - 1` doesn't race on simultaneous takes. |
| P2 | **Account Erasure Hardening** | Deletion checks outstanding balance before profile removal. | Ensure debt checks fail closed on query errors. |

### Already Implemented — Do Not Rebuild
- Feed action cards and role-aware banners
- First-run tips and tactile toast notifications
- Starter recipes and instant recipe import
- Recipe photo uploads with client-side image compression
- Pantry management and shared household staples
- Guest mouth scaling and leftovers board
- Item-by-item split calculation and per-person cost breakdown
- Collector bank/Revolut payment panel and settlement marking
- Delivery morning substitution reconciliation engine
- One-off household expense logging
- Analytics consent banner with strict opt-in

### Deliberately Deferred (Out of Scope for MVP)
- Multi-supermarket comparison (Grub is built around Tesco minimum clearing)
- Native mobile app (responsive web App Router covers mobile)
- Push notifications (email + live shared feed is primary)
- AI recommendation engines (focus is on deterministic budget optimization)

---

## 3. Launch Verification & Compliance

### Analytics & Privacy
- **Vercel Analytics**: Privacy-friendly, disabled by default, enabled only upon explicit user consent.
- **Data Minimization**: Query strings, private house IDs, auth tokens, and app routes are stripped from analytics tracking. Only clean `/welcome`, `/privacy`, and `/terms` are logged.
- **Cookie Consent**: Persistent banner with explicit Accept / Decline, stored in `localStorage` with cross-tab synchronization.

### Accessibility (WCAG 2.1 AA)
- AA color contrast verified across all primary surfaces (Forest `#1B4332`, Cream `#F7F5EF`, Oat `#D4A574`).
- All interactive controls have minimum 44x44px touch targets.
- Screen reader accessibility: `aria-expanded` and `aria-controls` on category collapsibles, `aria-required` and `aria-describedby` on forms, meaningful `alt` text on `FoodImage` components.

### Security
- Zero `service_role` secrets exposed to client bundles (verified via bundle inspection).
- All financial calculations execute on server actions or pure domain functions (`lib/calc.ts`, `lib/money.ts`).
- Row Level Security enforced across all Supabase tables.

---

## 4. Historical Verification Log

- **2026-08-28 — Post-Order Flow**: Validated `ordered` &rarr; `delivered` &rarr; `settled` lifecycle states, collector payment details rendering, and debt aggregation.
- **2026-08-28 — Reconciliation Engine**: Validated arithmetic across missing item refunds, brand substitution price deltas, and automatic split recalculation.
- **2026-09-07 — UI Voice Pass**: Audited UI copy against `VOICE.md` (70/30 dry British split, zero exclamation marks, strictly factual financial screens).
