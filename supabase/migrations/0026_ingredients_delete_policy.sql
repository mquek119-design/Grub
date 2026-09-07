-- The `/dev → Duplicate ingredients` merge tool could never complete against a
-- real RLS'd database: `ingredients` had INSERT, SELECT and UPDATE policies but
-- no DELETE policy. With RLS enabled and no matching policy, the loser row's
-- delete is silently filtered to zero rows affected — no error — so the merge
-- repoints every reference correctly and then fails at the last step, which the
-- action misreports as "the database merge function has not been installed yet".
--
-- `ingredients` is the global shared catalogue: it has no `house_id`, and its
-- INSERT/SELECT/UPDATE policies are all unconditional (`true`) because any
-- signed-in user may add or correct a catalogue entry. DELETE follows the same
-- posture. The merge repoints `recipe_ingredients`, `pantry_items`,
-- `house_staples` and `basket_items` off the loser before deleting it, so a
-- delete only ever removes a row nothing references any more.

drop policy if exists ingredients_delete on ingredients;
create policy ingredients_delete on ingredients
  for delete to authenticated
  using (true);
