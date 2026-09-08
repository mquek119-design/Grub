-- Migration 0031: Add nutrition tracking to recipes and daily targets to profiles

-- 1. Extend recipes table with per-portion calories and macros
alter table recipes
  add column if not exists calories_per_portion integer check (calories_per_portion >= 0),
  add column if not exists protein_grams integer check (protein_grams >= 0),
  add column if not exists carbs_grams integer check (carbs_grams >= 0),
  add column if not exists fat_grams integer check (fat_grams >= 0);

-- 2. Extend profiles table with optional daily nutrition targets
alter table profiles
  add column if not exists daily_calorie_target integer check (daily_calorie_target > 0),
  add column if not exists daily_protein_target integer check (daily_protein_target > 0);

-- 3. Populate baseline nutrition estimates for existing common starter recipes
update recipes set
  calories_per_portion = 620,
  protein_grams = 42,
  carbs_grams = 68,
  fat_grams = 18
where title ilike '%spaghetti bolognese%' and calories_per_portion is null;

update recipes set
  calories_per_portion = 580,
  protein_grams = 38,
  carbs_grams = 62,
  fat_grams = 19
where title ilike '%chicken tikka%' and calories_per_portion is null;

update recipes set
  calories_per_portion = 490,
  protein_grams = 34,
  carbs_grams = 52,
  fat_grams = 15
where title ilike '%beef stir fry%' and calories_per_portion is null;

update recipes set
  calories_per_portion = 450,
  protein_grams = 32,
  carbs_grams = 18,
  fat_grams = 26
where title ilike '%chicken caesar%' and calories_per_portion is null;

update recipes set
  calories_per_portion = 520,
  protein_grams = 28,
  carbs_grams = 74,
  fat_grams = 12
where title ilike '%ramen%' and calories_per_portion is null;
