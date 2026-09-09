-- Mutual agreement for overlap optimization and meal consolidation.
--
-- When an overlap opportunity or shared meal is suggested between housemates
-- cooking separate meals, one party cannot unilaterally merge or force the
-- change. Instead, an offer is proposed, and both parties must agree before
-- the meals are consolidated.

alter table planned_meals
  add column if not exists proposal_to_user_id uuid references profiles (id) on delete set null,
  add column if not exists proposal_recipe_id uuid references recipes (id) on delete set null,
  add column if not exists proposal_created_by uuid references profiles (id) on delete set null;

comment on column planned_meals.proposal_to_user_id is
  'Housemate invited to consolidate or share an overlapping meal. Both parties must agree before the merge occurs.';

comment on column planned_meals.proposal_recipe_id is
  'Target recipe proposed for the consolidated meal.';

comment on column planned_meals.proposal_created_by is
  'Housemate who initiated the overlap consolidation proposal.';
