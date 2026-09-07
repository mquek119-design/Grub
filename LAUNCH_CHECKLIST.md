# Grub — Pre-Launch Checklist

_Do before a **public** launch — not blocking day-to-day dev. From a "20 things
before you launch" list, mapped against what Grub already has. Status is honest:
several are already done, a few are handled by the host, the rest are the actual
work. `CODING_PLAN.md` is the feature backlog; this is the launch gate._

Legend: ✅ done · 🟡 partial / verify · ⬜ to do · 🏠 handled by host (Vercel)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Privacy policy page | 🟡 | Draft exists at `/privacy`; legal review and controller/contact details are still required before public launch. |
| 2 | Terms & conditions page | 🟡 | Draft exists at `/terms`; legal review is still required before public launch. |
| 3 | Secrets off the frontend | 🟡 | By design — CLAUDE.md forbids `service_role` in `NEXT_PUBLIC_`; Tesco/session code is server-only. **Verify at launch**: grep the client bundle, confirm only the Supabase publishable/anon key is public. |
| 4 | Force HTTPS | 🏠 | Vercel serves HTTPS + HSTS and redirects automatically. Just confirm on the custom domain. |
| 5 | Cookie consent banner | ⬜ | Supabase auth sets cookies; add a notice/consent once analytics (#19) lands. Ties to #1. |
| 6 | Meta titles + descriptions | ✅ | Route metadata audited; static pages have titles and descriptions, and recipe detail metadata is generated from the recipe. |
| 7 | Social preview image | 🟡 | Branded `opengraph-image.tsx` exists. Verify its absolute production URL and rendered card on the deployed site. |
| 8 | Add a favicon | ✅ | `src/app/icon.svg`. |
| 9 | Sitemap + robots.txt | 🟡 | Both routes exist and exclude authenticated app pages. Verify signed-out `200` responses and production-domain URLs after deployment. |
| 10 | Alt text on images | 🟡 | `FoodImage`/`Avatar` manage alt; decorative tiles use `alt=""` correctly. Recipe uploads (CODING_PLAN #7) landed 2026-09-07 — **audit** that uploaded photos get real alt text, not the recipe title reused blindly where it doesn't fit. |
| 11 | Compress images | ⬜ | Recipe uploads (CODING_PLAN #7) landed with no client-side compression — a phone photo can upload uncompressed up to the 5MB cap. **Add compression on upload** (client-side, before it hits the server action) before this is a real problem. |
| 12 | Check page load speed | 🟡 | Lighthouse ~100 on main routes locally; bundle work done. **Re-run against the deployed URL** — datacentre + real network differ from localhost. |
| 13 | Fix colour contrast | ✅ | Accessibility pass done; AA verified. (The "marquee" contrast flag was a false positive — text already `text-secondary` on Forest.) |
| 14 | Make it mobile friendly | ✅ | Mobile-first (375px) throughout; `md:`/`lg:` breakpoints; desktop pass done for onboarding + login. |
| 15 | Custom 404 page | ✅ | `src/app/not-found.tsx`. |
| 16 | Fix broken links | 🟡 | **Run a link check against the deployed site** — cheap once there's a URL. |
| 17 | Form validation | 🟡 | Forms use `required` + real-time validation (RecipeForm), field preservation, `aria-required`/`aria-describedby`. **Audit** the remaining forms for parity. |
| 18 | Spam protection | 🟡 | Invite-based + magic-link auth limits abuse; Supabase rate-limits auth. **Assess** whether signup needs an added limit — probably low priority for a closed-house app. |
| 19 | Set up analytics | ⬜ | None. Vercel Analytics is privacy-friendly and ~one line. Ties to cookie consent (#5). |
| 20 | One clear call to action | ✅ | `/welcome` has clear Sign up / Sign in CTAs after the redesign. |
| 21 | Supabase region matches the target market | ⬜ | The Supabase project is in **Singapore**; Grub is built for **UK** students. Every request pays a Singapore round trip (`src/proxy.ts` hits Supabase's auth server on every navigation, plus several query round trips per page). `vercel.json` pins the Vercel function region to `sin1` to match it *today*, but that's a stopgap, not the fix. **Before public launch**: create a new Supabase project in a UK/EU region, migrate schema + data across, then move `vercel.json`'s `regions` to match in the same change. |

## What this actually reduces to (the ⬜ / audit work)

**Build:**
- Finish legal review and controller/contact details for Privacy + Terms (#1, #2).
- Analytics + cookie consent (#19, #5) — as a pair, if wanted.
- On-upload image compression (#11), now that recipe uploads exist.
- Migrate Supabase (and `vercel.json`) from Singapore to a UK/EU region (#21) — the biggest lever on real-world speed for real users.

**Audit (cheap, mostly at deploy time):**
- Social preview, robots and sitemap URLs (#7, #9), broken-link sweep (#16), form-validation parity (#17), production Lighthouse (#12), confirm no secret in the client bundle (#3), uploaded-photo alt text (#10).

## Order

Do the audits (#3, #6, #12, #16) as part of the deploy itself — they need the
live URL. Finish legal review (#1, #2), then verify robots/sitemap (#9) and the
OG image (#7) before announcing publicly. Migrate the Supabase region (#21)
before announcing publicly too — it's the difference between the app feeling
fast and feeling broken for the people it's actually built for. Analytics/
consent (#19, #5) whenever you want numbers. The ✅ / 🏠 rows need nothing.
