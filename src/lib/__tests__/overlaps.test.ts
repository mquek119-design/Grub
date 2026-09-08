import { findOverlapGaps } from '../overlaps';
import type { PlannedMeal, Recipe } from '../types';

function createMeal(overrides: Partial<PlannedMeal> = {}): PlannedMeal {
  return {
    id: 'meal-test',
    planId: 'plan-1',
    recipeId: 'recipe-1',
    recipeTitle: 'Test Meal',
    day: 'wed',
    mealType: 'dinner',
    isShared: false,
    createdBy: 'user-1',
    cookedByUserId: 'user-1',
    cookOfferTo: null,
    maxDiners: null,
    status: 'planned',
    participants: [],
    ...overrides,
  };
}

describe('findOverlapGaps', () => {
  const recipeSalad: Recipe = {
    id: 'recipe-salad',
    title: 'Greek Salad',
    sourceUrl: null,
    imageUrl: null,
    cookTimeMins: 15,
    servings: 1,
    difficulty: 'easy',
    tags: ['salad', 'quick'],
    dietaryTags: [],
    instructions: ['Chop vegetables', 'Mix in feta and olives'],
    proTip: null,
    costPerPortion: 150,
    ingredients: [
      { ingredientId: 'ing-feta', name: 'Feta cheese', quantity: 100, unit: 'g', category: 'fresh', inPantry: false },
      { ingredientId: 'ing-olive', name: 'Olives', quantity: 50, unit: 'g', category: 'cupboard', inPantry: false },
      { ingredientId: 'ing-cucumber', name: 'Cucumber', quantity: 1, unit: 'whole', category: 'fresh', inPantry: false },
    ],
  };

  const recipeBake: Recipe = {
    id: 'recipe-bake',
    title: 'Pasta Bake',
    sourceUrl: null,
    imageUrl: null,
    cookTimeMins: 40,
    servings: 2,
    difficulty: 'easy',
    tags: ['bake', 'comfort', 'dinner'],
    dietaryTags: [],
    instructions: ['Cook pasta', 'Bake with sauce and cheese'],
    proTip: null,
    costPerPortion: 180,
    ingredients: [
      { ingredientId: 'ing-pasta', name: 'Penne pasta', quantity: 200, unit: 'g', category: 'cupboard', inPantry: false },
      { ingredientId: 'ing-tomato', name: 'Chopped tomatoes', quantity: 400, unit: 'g', category: 'cupboard', inPantry: false },
      { ingredientId: 'ing-cheddar', name: 'Cheddar cheese', quantity: 100, unit: 'g', category: 'fresh', inPantry: false },
    ],
  };

  const recipeAlt: Recipe = {
    id: 'recipe-alt',
    title: 'Mediterranean Pasta',
    sourceUrl: null,
    imageUrl: null,
    cookTimeMins: 20,
    servings: 1,
    difficulty: 'easy',
    tags: ['pasta', 'dinner'],
    dietaryTags: [],
    instructions: ['Boil pasta', 'Toss with olives and feta'],
    proTip: null,
    costPerPortion: 160,
    ingredients: [
      { ingredientId: 'ing-pasta', name: 'Penne pasta', quantity: 100, unit: 'g', category: 'cupboard', inPantry: false },
      { ingredientId: 'ing-olive', name: 'Olives', quantity: 30, unit: 'g', category: 'cupboard', inPantry: false },
      { ingredientId: 'ing-feta', name: 'Feta cheese', quantity: 50, unit: 'g', category: 'fresh', inPantry: false },
    ],
  };

  it('detects when housemates cook completely distinct meals and offers recipes sharing basket ingredients', () => {
    const meal1 = createMeal({
      id: 'meal-1',
      day: 'wed',
      mealType: 'dinner',
      recipeId: 'recipe-salad',
      cookedByUserId: 'user-1',
      participants: [{ userId: 'user-1', optedOut: false, guests: 0 }],
    });

    const meal2 = createMeal({
      id: 'meal-2',
      day: 'wed',
      mealType: 'dinner',
      recipeId: 'recipe-bake',
      cookedByUserId: 'user-2',
      participants: [{ userId: 'user-2', optedOut: false, guests: 0 }],
    });

    const names = { 'user-1': 'Alice', 'user-2': 'Bob' };
    const overlaps = findOverlapGaps(
      [meal1, meal2],
      [recipeSalad, recipeBake, recipeAlt],
      names
    );

    expect(overlaps).toHaveLength(1);
    const gap = overlaps[0];
    expect(gap.day).toBe('wed');
    expect(gap.mealType).toBe('dinner');
    expect(gap.userIds).toEqual(expect.arrayContaining(['user-1', 'user-2']));
    expect(gap.message).toContain('Alice and Bob are cooking separately');

    // Missed saving should be non-zero and realistic
    expect(gap.missedSaving).toBeGreaterThan(0);

    // Should suggest Mediterranean Pasta because it uses ingredients already being bought
    expect(gap.suggestions.length).toBeGreaterThan(0);
    expect(gap.suggestions[0].recipeId).toBe('recipe-alt');
    expect(gap.suggestions[0].shares.length).toBeGreaterThanOrEqual(2);
  });

  it('calculates a positive missedSaving even if recipes have 0 costPerPortion by using fallback baseline', () => {
    const unpricedSalad: Recipe = { ...recipeSalad, costPerPortion: 0 };
    const unpricedBake: Recipe = { ...recipeBake, costPerPortion: 0 };

    const meal1 = createMeal({
      id: 'meal-1',
      day: 'wed',
      mealType: 'dinner',
      recipeId: 'recipe-salad',
      cookedByUserId: 'user-1',
      participants: [{ userId: 'user-1', optedOut: false, guests: 0 }],
    });

    const meal2 = createMeal({
      id: 'meal-2',
      day: 'wed',
      mealType: 'dinner',
      recipeId: 'recipe-bake',
      cookedByUserId: 'user-2',
      participants: [{ userId: 'user-2', optedOut: false, guests: 0 }],
    });

    const overlaps = findOverlapGaps(
      [meal1, meal2],
      [unpricedSalad, unpricedBake, recipeAlt],
      { 'user-1': 'Alice', 'user-2': 'Bob' }
    );

    expect(overlaps).toHaveLength(1);
    // Never £0.00!
    expect(overlaps[0].missedSaving).toBeGreaterThan(0);
  });
});
