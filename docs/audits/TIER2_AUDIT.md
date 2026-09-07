# Tier 2 launch audit — 7 September 2026

## Implemented locally

- Added Vercel Analytics behind an explicit accept/reject choice. Unknown,
  rejected and unavailable-storage states default off. A saved acceptance is
  required again after storage is cleared.
- Added persistent Privacy choices, withdrawal and cross-tab choice updates.
- Only clean `/welcome`, `/privacy` and `/terms` URLs are eligible for analytics.
  Private app pages, query strings, fragments and auth callbacks are excluded.
- Updated the draft Privacy page to explain analytics, browser preference storage
  and retention of the Supabase login after profile deletion.
- Associated login/signup server-error messages with their email inputs.
- Added `scripts/launch-audit.mjs`. Run `node scripts/launch-audit.mjs` to repeat
  the public-site sweep; optionally pass another origin. Raw results are saved
  to the ignored `.accessibility-audit/launch.json`.

## Deployed site results

The Vercel host redirects to `https://grubhouse.uk`. These observations describe
the deployed version, not the unshipped consent implementation.

- Eight routes returned 200: welcome, login, signup, Privacy, Terms, robots,
  sitemap and Open Graph image. Metadata content types were correct.
- Five discovered public links returned 200, including the join-to-signup
  redirect. No authenticated navigation was exercised.
- Public pages have titles and descriptions. Both email inputs are labelled
  and required. Their server errors lacked input associations; fixed locally.
- Twelve downloaded public JavaScript assets had no matching secret-key/private
  key signatures. This limited scan is not a guarantee about all deployed chunks.
- Sitemap and OG URLs still name `grub-lime.vercel.app`. Set Vercel's
  `NEXT_PUBLIC_SITE_URL=https://grubhouse.uk`, confirm Supabase callback allowlist,
  and redeploy before marking domain configuration complete.
- One mobile Lighthouse run: performance **71**, accessibility **100**, best
  practices **96**, SEO **100**. LCP **23.2s**, first contentful paint **2.6s**,
  payload about **4.1 MiB**. These are a single synthetic run, not field metrics.
  Investigate render-blocking fonts, late content paint and console errors;
  repeat after deployment. Raw report: `.accessibility-audit/lighthouse-live.json`.

## Remaining launch gates

- Supply the controller/operator name and public contact email, then have a
  human review Privacy and Terms. Draft labels remain; legal approval is not
  claimed by this implementation.
- Enable Web Analytics for this project in the Vercel dashboard, deploy, then
  confirm accepted visits arrive and rejected visits do not.
- Run the authenticated accessibility/form tests with a saved session. This
  audit never sends real email, creates households or alters financial data.
- Perform the domain correction and performance follow-up above.

## Validation

Consent regression tests cover default/rejected state, acceptance, sensitive-URL
exclusion, preference reopening and cross-tab withdrawal. Typecheck, lint and
production build pass. No database migrations were run.

Implementation references: [Vercel Analytics configuration](https://vercel.com/docs/analytics/package)
and [Vercel Analytics privacy documentation](https://vercel.com/docs/analytics/privacy-policy).
