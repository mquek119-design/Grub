'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import {
  analyseIngredientCanonicalNames,
  canonicalName,
  type CanonicalNameMismatch,
} from '@/lib/ingredients';
import type { DevResult } from './actions';

const fail = (message: string): DevResult => ({ status: 'error', message });

export interface DuplicateCluster {
  canonical: string;
  rows: { id: string; name: string; uses: number }[];
}

export interface IngredientCanonicalReport {
  clusters: DuplicateCluster[];
  mismatches: CanonicalNameMismatch[];
}

const emptyReport = (): IngredientCanonicalReport => ({ clusters: [], mismatches: [] });

/**
 * Ingredients that mean the same thing but are separate rows.
 *
 * Normalisation stops new duplicates; it cannot fix the ones already written,
 * and it never will fix pairs like Lettuce / Cos lettuce, where the difference
 * is a word in the middle. Those need a person to say they are the same thing.
 *
 * Usage counts are shown so the collector can tell which row is the real one —
 * merging into the row nobody uses would be technically correct and practically
 * annoying.
 */
export async function findDuplicateIngredients(): Promise<IngredientCanonicalReport> {
  const me = await getCurrentUser();
  if (!me.houseId) return emptyReport();

  const supabase = await createClient();
  const rows = await supabase.from('ingredients').select('id, name, canonical_name');
  if (rows.error || !rows.data) return emptyReport();

  const audit = analyseIngredientCanonicalNames(rows.data);
  const clusters = audit.duplicateGroups;
  if (clusters.length === 0) return { clusters: [], mismatches: audit.mismatches };

  // One query per table rather than per row: a house with a messy catalogue
  // would otherwise fire hundreds of round trips to draw one panel.
  const ids = clusters.flatMap((cluster) => cluster.rows.map((row) => row.id));
  const [recipeUses, pantryUses, stapleUses] = await Promise.all([
    supabase.from('recipe_ingredients').select('ingredient_id').in('ingredient_id', ids),
    supabase.from('pantry_items').select('ingredient_id').in('ingredient_id', ids),
    supabase.from('house_staples').select('ingredient_id').in('ingredient_id', ids),
  ]);

  const counts = new Map<string, number>();
  for (const result of [recipeUses, pantryUses, stapleUses]) {
    for (const row of result.data ?? []) {
      const id = row.ingredient_id;
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const duplicateClusters = clusters
    .map((cluster) => ({
      canonical: cluster.canonical,
      rows: cluster.rows
        .map((row) => ({ ...row, uses: counts.get(row.id) ?? 0 }))
        .sort((a, b) => b.uses - a.uses),
    }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));

  return { clusters: duplicateClusters, mismatches: audit.mismatches };
}

/** Bring stored keys up to date once duplicate meanings have been folded. */
export async function repairIngredientCanonicalNames(): Promise<DevResult> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const supabase = await createClient();
  const rows = await supabase.from('ingredients').select('id, name, canonical_name');
  if (rows.error) return fail(rows.error.message);

  const audit = analyseIngredientCanonicalNames(rows.data ?? []);
  if (audit.duplicateGroups.length > 0) {
    return fail('Fold the duplicate ingredient groups first, then repair the remaining names.');
  }
  if (audit.mismatches.length === 0) {
    return { status: 'success', message: 'Every stored ingredient name is already current.' };
  }

  for (const row of audit.mismatches) {
    const updated = await supabase
      .from('ingredients')
      .update({ canonical_name: row.expectedCanonical })
      .eq('id', row.id);
    if (updated.error) {
      return fail(`Could not repair "${row.name}": ${updated.error.message}`);
    }
  }

  revalidatePath('/dev');
  return {
    status: 'success',
    message: `${audit.mismatches.length} stored canonical name${audit.mismatches.length === 1 ? '' : 's'} repaired.`,
  };
}

/**
 * Folds one ingredient into another.
 *
 * Four tables carry `ingredient_id` and three of them are `on delete restrict`,
 * so everything must be repointed before the loser can go — a plain delete just
 * fails with a foreign-key error and tells you nothing useful.
 */
export async function mergeIngredients(keepId: string, dropId: string): Promise<DevResult> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');
  if (keepId === dropId) return fail('Those are the same ingredient.');

  const supabase = await createClient();

  const names = await supabase
    .from('ingredients')
    .select('id, name, canonical_name')
    .in('id', [keepId, dropId]);
  if (names.error) return fail(names.error.message);
  if ((names.data ?? []).length !== 2) return fail('One of those ingredients no longer exists.');

  const keepName = names.data.find((row) => row.id === keepId)?.name ?? 'it';
  const dropName = names.data.find((row) => row.id === dropId)?.name ?? 'the other';

  // `recipe_ingredients` is keyed on (recipe_id, ingredient_id), so a recipe
  // holding *both* rows cannot simply be repointed — the update would collide
  // with a key that already exists. Those get dropped rather than merged, and
  // the count is reported: quietly losing a line from somebody's recipe is
  // exactly the kind of silent damage this tool must not do.
  const [keepLinks, dropLinks] = await Promise.all([
    supabase.from('recipe_ingredients').select('recipe_id').eq('ingredient_id', keepId),
    supabase.from('recipe_ingredients').select('recipe_id').eq('ingredient_id', dropId),
  ]);
  if (keepLinks.error) return fail(keepLinks.error.message);
  if (dropLinks.error) return fail(dropLinks.error.message);

  const alreadyHasKeeper = new Set((keepLinks.data ?? []).map((row) => row.recipe_id));
  const collided = (dropLinks.data ?? [])
    .map((row) => row.recipe_id)
    .filter((recipeId) => alreadyHasKeeper.has(recipeId));

  if (collided.length > 0) {
    const removed = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('ingredient_id', dropId)
      .in('recipe_id', collided);
    if (removed.error) return fail(removed.error.message);
  }

  for (const table of ['recipe_ingredients', 'pantry_items', 'house_staples', 'basket_items'] as const) {
    const repointed = await supabase
      .from(table)
      .update({ ingredient_id: keepId })
      .eq('ingredient_id', dropId);
    if (repointed.error) return fail(`${table}: ${repointed.error.message}`);
  }

  const deleted = await supabase.from('ingredients').delete().eq('id', dropId).select('id');
  if (deleted.error) return fail(`Could not remove "${dropName}": ${deleted.error.message}`);
  if ((deleted.data ?? []).length !== 1) {
    return fail(
      `Could not remove "${dropName}". The database merge function has not been installed yet.`
    );
  }

  // The row that survives becomes the authority for future matching. This is
  // needed even when its old key came from 0018's lowercase-only backfill.
  const updatedKeeper = await supabase
    .from('ingredients')
    .update({ canonical_name: canonicalName(keepName) })
    .eq('id', keepId);
  if (updatedKeeper.error) {
    return fail(`"${dropName}" was folded in, but "${keepName}" still needs its stored name repaired: ${updatedKeeper.error.message}`);
  }

  revalidatePath('/', 'layout');

  const note =
    collided.length > 0
      ? ` ${collided.length} recipe${collided.length === 1 ? '' : 's'} already had both, so the duplicate line was dropped.`
      : '';

  return {
    status: 'success',
    message: `"${dropName}" folded into "${keepName}".${note} Rebuild the basket to see them pool.`,
  };
}
