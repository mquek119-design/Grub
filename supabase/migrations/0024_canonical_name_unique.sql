-- Follow-up to 0018: makes `canonical_name` actually unique.
--
-- 0018 explicitly left this unenforced, because existing rows already
-- collided by plural/case and a migration that fails on real data is worse
-- than a missing constraint. That is still true here.
--
-- DO NOT RUN THIS until `/dev` → Duplicate ingredients reports zero clusters
-- on the target database. Running it against a database with any remaining
-- duplicate `canonical_name` values will fail the whole migration (see
-- CLAUDE.md — "Why the migration can appear to do nothing": one failing
-- statement in the SQL editor discards the entire transaction).
--
-- Once the merge tool is clean, run this file's statement manually in the
-- SQL editor (or via the CLI) — it is not wired into any automatic migration
-- run, on purpose.

create unique index if not exists ingredients_canonical_name_key
  on ingredients (canonical_name);
