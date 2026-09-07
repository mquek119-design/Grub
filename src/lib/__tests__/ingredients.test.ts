import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';
import {
  analyseIngredientCanonicalNames,
  canonicalName,
  findOrCreateIngredient,
} from '../ingredients';

describe('canonicalName()', () => {
  it.each([
    ['Onions', 'onion'],
    [' fresh   organic Basil ', 'basil'],
    ['Chicken breasts', 'chicken breast'],
    ['Peanut butter', 'peanut butter'],
    ['Beans', 'beans'],
  ])('normalises %s to %s', (input, expected) => {
    expect(canonicalName(input)).toBe(expected);
  });
});

describe('analyseIngredientCanonicalNames()', () => {
  it('finds stale backfill values even when there are no duplicates', () => {
    const audit = analyseIngredientCanonicalNames([
      { id: 'onion', name: 'Onions', canonical_name: 'onions' },
      { id: 'basil', name: 'Basil', canonical_name: 'basil' },
    ]);

    expect(audit.duplicateGroups).toEqual([]);
    expect(audit.mismatches).toEqual([
      expect.objectContaining({ id: 'onion', expectedCanonical: 'onion' }),
    ]);
  });

  it('groups rows by the current rule instead of their stored keys', () => {
    const audit = analyseIngredientCanonicalNames([
      { id: 'one', name: 'Onion', canonical_name: 'onion' },
      { id: 'many', name: 'Onions', canonical_name: 'onions' },
      { id: 'garlic', name: 'Garlic', canonical_name: null },
    ]);

    expect(audit.duplicateGroups).toHaveLength(1);
    expect(audit.duplicateGroups[0]).toMatchObject({
      canonical: 'onion',
      rows: [{ id: 'one' }, { id: 'many' }],
    });
    expect(audit.mismatches.map((row) => row.id)).toEqual(['garlic', 'many']);
  });

  it('reports an empty catalogue as ready', () => {
    expect(analyseIngredientCanonicalNames([])).toEqual({
      duplicateGroups: [],
      mismatches: [],
    });
  });
});

describe('findOrCreateIngredient()', () => {
  it('re-reads a concurrent insert by canonical_name', async () => {
    const firstLookup = fluentQuery({ data: [], error: null });
    const insert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      }),
    };
    const raceWinner = fluentQuery({ data: [{ id: 'winner' }], error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce(firstLookup)
      .mockReturnValueOnce(insert)
      .mockReturnValueOnce(raceWinner);

    const result = await findOrCreateIngredient(
      { from } as unknown as SupabaseClient<Database>,
      { name: 'Fresh Onions', unit: 'whole', category: 'fresh' }
    );

    expect(result).toEqual({ id: 'winner' });
    expect(raceWinner.eq).toHaveBeenCalledWith('canonical_name', 'onion');
    expect(from).toHaveBeenCalledTimes(3);
  });
});

function fluentQuery(result: { data: unknown; error: unknown }) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockResolvedValue(result);
  return query;
}
