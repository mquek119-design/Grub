# Grub — Master Plan & Launch Gate

_Last updated: 2026-09-08. Master backlog and launch checklist. Read `CLAUDE.md` for architecture and product rules; read `VOICE.md` for copy guidelines._

## True Current State

- **Deployed** to Vercel at `grub-lime.vercel.app`; auto-deploys on push to `main`.
- **Function region** pinned to `sin1` via `vercel.json` to match the Singapore Supabase project (see T0.2 for planned migration).
- **Test suite**: `npm run verify` is clean; Jest **20/20 suites, 187/187 tests** passing.
- **Authentication**: 6-digit numeric email OTP codes + magic link fallback active on `/login` and `/onboarding/signup` (bypassing university spam crawlers).
- **Calendar & Notifications**:
  - Live RFC 5545 Webcal / iCal subscription feed (`/api/calendar/[houseId]`) for Google Calendar, Apple Calendar, and Outlook with native 1-hour alarms.
  - Native Web Push lock-screen notifications with Service Worker (`/sw.js`) and unified Settings panel controls.
- **Mobile & PWA**:
  - PWA standalone manifest with branded icons (`/manifest.webmanifest`).
  - Screen Wake Lock API in kitchen Cook Mode.
  - Sticky weekday jump rail on Plan.
  - 1-tap Monzo (`monzo.me`) and Revolut (`revolut.me`) payment links.
  - Mobile feed directly opens Cook Mode when user is cooking tonight.
  - iOS Safari auto-zoom prevention enforced via 16px inputs.
- **Recipe photo uploads & image compression**: Client-side downscaling and compression active (`src/lib/imageCompression.ts`).
- **Brand & Aesthetics**: Custom favicon (`icon.svg`), OpenGraph preview card, and tactile design system.
- **Analytics & Consent**: Opt-in Vercel Analytics with privacy controls and cookie banner (`src/components/privacy/AnalyticsConsent.tsx`).
- **Custom Domain & Email**: `grubhouse.uk` registered on Cloudflare; Resend domain verified; full email roadmap in `docs/email.md`.
- **Basket & Flow Overhaul**: Collapsible categories, instant search filter, 2-column brand swaps, and streamlined right-hand summary.

---

## Tier 0 — Operational & Configuration (Requires Owner / Dashboard)

| # | Task | Why it matters | Action Required |
|---|---|---|---|
| T0.1 | **Supabase Custom SMTP** | Eliminates shared 30/hr rate limit and ensures reliable sign-in delivery | Host: `smtp.resend.com`, sender `@grubhouse.uk`. Refer to `docs/email.md`. |
| T0.2 | **Migrate Supabase to UK/EU Region** | Biggest real-world performance lever (current project is in Singapore) | Create project in London/Ireland, migrate schema + data, update `vercel.json` `regions` to match. |
| T0.3 | **Supabase Redirect URLs** | Prevents "requested path is invalid" errors | Add `https://grub-lime.vercel.app/**` and `https://grubhouse.uk/**` in Supabase Auth settings. |
| T0.4 | **Run Migrations 0024 + 0025 on Prod** | Storage bucket for photos (`0025`) and canonical name uniqueness (`0024`) | Apply `0025` now; apply `0024` after running the ingredient merge tool clean on `/dev`. |
| T0.5 | **Point `grubhouse.uk` at Vercel** | Production custom domain for users | Vercel &rarr; Domains. Set Cloudflare DNS record to "DNS only" (grey cloud). |

---

## Tier 1 — Codebase Tasks & Audits

### T1.1 — Web Push & Calendar Notifications
**Status: Complete.** Live Webcal/iCal `.ics` feed active at `/api/calendar/[houseId]` with native alarms; W3C Web Push Service Worker active with user toggles and test notification triggers in Settings.

### T1.2 — Authenticated Route Accessibility Harness
**Status: Ready to run.** Playwright spec (`src/__tests__/e2e/a11y-authenticated.spec.ts`) covers Plan/Recipes/Basket/Split with axe. Run `npm run e2e:auth` once to save a session, then run `npm run e2e:a11y`.

### T1.3 — Canonical Name Unique Index Gate
**Status: Migration 0024 prepared.** Run the `/dev` &rarr; Duplicate ingredients tool against production data until clean, then apply migration 0024.

### T1.4 — Client-Side Image Compression
**Status: Complete.** Photos downscaled to max 1600px and re-encoded before upload in `RecipeForm.tsx`.

### T1.5 — Food Image Alt Text Audit
**Status: Complete.** Meaningful alt text and decorative attributes audited across all `FoodImage` call sites.

### T1.6 — Voice & Tone Audit
**Status: Complete.** Copy aligned with `VOICE.md` (70/30 dry British split, zero exclamation marks, strictly factual financial screens).

### T1.7 — Mobile & Phone Web Experience
**Status: Complete (`docs/phone-plan.md`).** All core mobile tenets shipped: bottom navigation, sticky rail, 1-tap commute card, Cook Mode wake lock, banking deep-links, PWA manifest, and auto-zoom prevention.

### T1.8 — Onboarding & Visual Guide Redesign
**Status: In Progress.** 2-track onboarding (House Leader vs Housemate), personal weekly budget slider, dietary safety tags (Halal, Veg, Vegan, Pescatarian, Gluten-Free, Dairy-Free, Nut Allergy), meal vibes, interactive kitchen appliance studio (Air Fryer, 2-Hob/4-Hob, Oven, Microwave), and 5-slide visual walkthrough covering Tesco automation and Cookie-Editor session export.

---

## Tier 2 — Pre-Launch Checklist

Legend: ✅ Done · 🟡 Partial / Verify at Deploy · 🏠 Handled by Host (Vercel)

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Privacy policy page | 🟡 | Live at `/privacy`; needs final controller contact info before public launch. |
| 2 | Terms & conditions page | 🟡 | Live at `/terms`; legal review before public launch. |
| 3 | Secrets off the frontend | ✅ | Verified: no `service_role` in `NEXT_PUBLIC_`; Tesco code is server-only. |
| 4 | Force HTTPS | 🏠 | Handled automatically by Vercel + HSTS. |
| 5 | Cookie consent banner | ✅ | Implemented in `src/components/privacy/AnalyticsConsent.tsx` with persistent opt-in. |
| 6 | Meta titles + descriptions | ✅ | Static pages and dynamic recipe metadata configured. |
| 7 | Social preview image | ✅ | Branded OpenGraph card implemented in `src/app/opengraph-image.tsx`. |
| 8 | Favicon | ✅ | SVG favicon at `src/app/icon.svg`. |
| 9 | Sitemap & robots.txt | ✅ | Generated dynamically, excluding authenticated routes. |
| 10 | Alt text on images | ✅ | Audited across all food cards, avatars, and icons. |
| 11 | Image compression | ✅ | Client-side compression active on uploads (`src/lib/imageCompression.ts`). |
| 12 | Performance (Lighthouse) | 🟡 | ~100 locally; re-verify against production domain once UK region is live. |
| 13 | Color contrast (WCAG AA) | ✅ | Verified on all primary Forest Green and Cream surfaces. |
| 14 | Mobile friendly | ✅ | Mobile-first (375px) responsive layouts with tactile touch targets. |
| 15 | Custom 404 page | ✅ | Live at `src/app/not-found.tsx`. |
| 16 | Form validation | ✅ | Real-time validation, required attributes, and accessible error states. |
| 17 | Analytics | ✅ | Privacy-friendly Vercel Analytics with strict user opt-in. |
| 18 | Call to action | ✅ | Clear Sign up / Sign in CTAs on `/welcome`. |

---

## Tier 3 — Real-World Verification (Requires Live Order)

- **`bookSlot()`**: Reserving a Tesco slot is implemented; verify against live Tesco API with a real address during the first actual shop.
- **Delivery Morning Reconciliation**: Reconciliation engine is unit-tested and simulated in `/dev`; closes with the first physical Tesco delivery.
- **Tesco Session Storage**: DB-backed session persistence (migration `0023`) exercises alongside the first live order.

---

## Out of Scope (Deliberate MVP Boundaries)
Multi-supermarket live price scraping, native iOS/Android App Store builds, and open-banking direct debit pulls.

---

## Future Experiments & Ideas (On Hold)

- **Brain Rot Mode (Experimental Toggle)**: Documented in `VOICE.md` §9. An opt-in Easter-egg copy theme for flatmates wanting exaggerated student TikTok humour. Kept on hold as an experimental concept until fully thought out and evaluated. Standard Grub voice remains active across all live screens.
