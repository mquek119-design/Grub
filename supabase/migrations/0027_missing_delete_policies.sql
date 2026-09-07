-- Two more tables with RLS on but no DELETE policy, same silent-failure class as
-- the `ingredients` gap fixed in 0026. Found by auditing every table's policies
-- against the `.delete()` calls the app actually makes.
--
-- 1. `profiles` — `deleteAccount()` (src/app/account/actions.ts) deletes the
--    caller's own profile row and checks the returned row count. With no DELETE
--    policy the delete silently affects zero rows, so account deletion ALWAYS
--    failed with "that account is not yours to remove". The money guard and the
--    house-orphan checks already run in the action before this point; RLS only
--    needs to permit a user to delete their own row.
--
-- 2. `splits` — `postSplit()` (src/app/split/postActions.ts) removes a split row
--    when a housemate's share drops to zero. It only checks `.error`, and a
--    zero-row delete is not an error, so the row silently persisted: someone who
--    left every meal kept a phantom debt. Mirrors the existing `splits_update`
--    policy (either party to the split).
--
-- `(select auth.uid())` rather than a bare call so the check is evaluated once
-- per statement, not per row (RLS-initplan performance guidance).

drop policy if exists profiles_delete on profiles;
create policy profiles_delete on profiles
  for delete to authenticated
  using (id = (select auth.uid()));

drop policy if exists splits_delete on splits;
create policy splits_delete on splits
  for delete to authenticated
  using (
    from_user_id = (select auth.uid())
    or to_user_id = (select auth.uid())
  );
