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
| 10 | Alt text on images | 🟡 | `FoodImage`/`Avatar` manage alt; decorative tiles use `alt=""` correctly. **Revisit** when recipe uploads (CODING_PLAN #7) land — real photos need real alt. |
| 11 | Compress images | 🟡 | Largely N/A now — deterministic tiles, no heavy static assets, `next/image` for remotes. **Compress on upload** when recipe images (CODING_PLAN #7) land. |
| 12 | Check page load speed | 🟡 | Lighthouse ~100 on main routes locally; bundle work done. **Re-run against the deployed URL** — datacentre + real network differ from localhost. |
| 13 | Fix colour contrast | ✅ | Accessibility pass done; AA verified. (The "marquee" contrast flag was a false positive — text already `text-secondary` on Forest.) |
| 14 | Make it mobile friendly | ✅ | Mobile-first (375px) throughout; `md:`/`lg:` breakpoints; desktop pass done for onboarding + login. |
| 15 | Custom 404 page | ✅ | `src/app/not-found.tsx`. |
| 16 | Fix broken links | 🟡 | **Run a link check against the deployed site** — cheap once there's a URL. |
| 17 | Form validation | 🟡 | Forms use `required` + real-time validation (RecipeForm), field preservation, `aria-required`/`aria-describedby`. **Audit** the remaining forms for parity. |
| 18 | Spam protection | 🟡 | Invite-based + magic-link auth limits abuse; Supabase rate-limits auth. **Assess** whether signup needs an added limit — probably low priority for a closed-house app. |
| 19 | Set up analytics | ⬜ | None. Vercel Analytics is privacy-friendly and ~one line. Ties to cookie consent (#5). |
| 20 | One clear call to action | ✅ | `/welcome` has clear Sign up / Sign in CTAs after the redesign. |

## What this actually reduces to (the ⬜ / audit work)

**Build:**
- Finish legal review and controller/contact details for Privacy + Terms (#1, #2).
- Analytics + cookie consent (#19, #5) — as a pair, if wanted.

**Audit (cheap, mostly at deploy time):**
- Social preview, robots and sitemap URLs (#7, #9), broken-link sweep (#16), form-validation parity (#17), production Lighthouse (#12), confirm no secret in the client bundle (#3).

**Deferred until recipe uploads exist (CODING_PLAN #7):**
- Real-photo alt text (#10) and on-upload compression (#11).

## Order

Do the audits (#3, #6, #12, #16) as part of the deploy itself — they need the
live URL. Finish legal review (#1, #2), then verify robots/sitemap (#9) and the
OG image (#7) before announcing publicly. Analytics/consent (#19, #5) whenever
you want numbers. The ✅ / 🏠 rows need nothing.
