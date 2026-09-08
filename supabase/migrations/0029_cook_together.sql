-- Cook Together: Support for Co-Cooks and Wash-Up Duty.
--
-- In a household, meals are often cooked together (tag team / helper)
-- or paired with a wash-up volunteer ("Alex cooks, Sam cleans").
--
-- These columns capture that partnership without breaking single-cook assumptions.

alter table planned_meals
  add column if not exists co_cook_user_id uuid references profiles (id) on delete set null,
  add column if not exists cleaner_user_id uuid references profiles (id) on delete set null;

comment on column planned_meals.co_cook_user_id is
  'Optional second cook / kitchen assistant cooking alongside the lead cook.';

comment on column planned_meals.cleaner_user_id is
  'Optional housemate on wash-up duty for this meal.';
