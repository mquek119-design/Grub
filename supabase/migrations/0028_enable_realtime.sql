-- Enable Supabase Realtime publication for tables so browser clients receive live updates.
--
-- Postgres logical replication only broadcasts changes for tables in `supabase_realtime`.
-- Without this, client subscriptions to `postgres_changes` remain silent.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Add all household operational tables to realtime publication
do $$
declare
  t text;
  tables text[] := array[
    'weekly_plans',
    'planned_meals',
    'meal_participants',
    'basket_items',
    'splits',
    'pantry_items',
    'houses'
  ];
begin
  foreach t in array tables loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception
      when duplicate_object then null;
      when others then null;
    end;
  end loop;
end $$;
