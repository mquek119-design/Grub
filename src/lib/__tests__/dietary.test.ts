import {
  DIETS,
  VIBES,
  getBudgetTier,
  parseDietaryPreferences,
  formatDietaryBadge,
} from '../dietary';

describe('dietary module', () => {
  describe('DIETS', () => {
    test('contains recognized dietary tags', () => {
      expect(DIETS.length).toBeGreaterThan(0);
      expect(DIETS.some((d) => d.id === 'vegetarian')).toBe(true);
      expect(DIETS.some((d) => d.id === 'vegan')).toBe(true);
    });
  });

  describe('VIBES', () => {
    test('contains exactly 8 meal vibe options', () => {
      expect(VIBES).toHaveLength(8);
    });

    test('all vibes have unique ids and non-empty label, hint, and icon', () => {
      const ids = VIBES.map((v) => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(8);

      VIBES.forEach((vibe) => {
        expect(vibe.id.trim()).not.toBe('');
        expect(vibe.label.trim()).not.toBe('');
        expect(vibe.hint.trim()).not.toBe('');
        expect(vibe.icon.trim()).not.toBe('');
      });
    });

    test('includes new vibes: one_pot, meal_prep, and fresh_greens', () => {
      const vibeIds = VIBES.map((v) => v.id);
      expect(vibeIds).toContain('one_pot');
      expect(vibeIds).toContain('meal_prep');
      expect(vibeIds).toContain('fresh_greens');
    });
  });

  describe('formatDietaryBadge', () => {
    test('formats all 8 vibes with their configured label and icon', () => {
      VIBES.forEach((vibe) => {
        const badge = formatDietaryBadge(`vibe:${vibe.id}`);
        expect(badge).toEqual({
          id: `vibe:${vibe.id}`,
          label: vibe.label,
          icon: vibe.icon,
          type: 'vibe',
        });
      });
    });

    test('formats budget tags properly', () => {
      const badge = formatDietaryBadge('budget:45');
      expect(badge).toEqual({
        id: 'budget:45',
        label: '£45/wk',
        icon: 'savings',
        type: 'budget',
      });
    });

    test('formats allergy tags properly', () => {
      const badge = formatDietaryBadge('allergy:peanuts');
      expect(badge).toEqual({
        id: 'allergy:peanuts',
        label: 'Allergy: peanuts',
        icon: 'warning',
        type: 'allergy',
      });
    });

    test('formats diet options properly', () => {
      const badge = formatDietaryBadge('vegetarian');
      expect(badge).toEqual({
        id: 'vegetarian',
        label: 'Vegetarian',
        icon: 'eco',
        type: 'diet',
      });
    });
  });

  describe('parseDietaryPreferences', () => {
    test('extracts vibes, diets, budget, and custom allergies', () => {
      const result = parseDietaryPreferences([
        'vegan',
        'vibe:speedy',
        'vibe:one_pot',
        'budget:40',
        'allergy:shellfish',
      ]);

      expect(result.diets).toEqual(['vegan']);
      expect(result.vibes).toEqual(['speedy', 'one_pot']);
      expect(result.budget).toBe(40);
      expect(result.customAllergies).toEqual(['shellfish']);
    });

    test('deduplicates vibes and allergies', () => {
      const result = parseDietaryPreferences([
        'vibe:meal_prep',
        'vibe:meal_prep',
        'allergy:milk',
        'allergy:milk',
      ]);

      expect(result.vibes).toEqual(['meal_prep']);
      expect(result.customAllergies).toEqual(['milk']);
    });
  });

  describe('getBudgetTier', () => {
    test('returns correct tier and mood for varying budget amounts', () => {
      expect(getBudgetTier(20).tier).toBe('frugal');
      expect(getBudgetTier(35).tier).toBe('student');
      expect(getBudgetTier(60).tier).toBe('gym');
      expect(getBudgetTier(100).tier).toBe('rich');
    });
  });
});
