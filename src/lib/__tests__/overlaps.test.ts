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

  it('optimises meals sharing staple ingredients like cheddar, pasta, and chicken across diverse cuisines', () => {
    const recipeMac: Recipe = {
      id: 'recipe-mac',
      title: 'Mac and Cheese',
      sourceUrl: null,
      imageUrl: null,
      cookTimeMins: 20,
      servings: 2,
      difficulty: 'easy',
      tags: ['comfort', 'dinner'],
      dietaryTags: [],
      instructions: ['Boil pasta', 'Melt cheddar with milk and stir'],
      proTip: null,
      costPerPortion: 160,
      ingredients: [
        { ingredientId: 'ing-pasta', name: 'Penne pasta', quantity: 200, unit: 'g', category: 'cupboard', inPantry: false },
        { ingredientId: 'ing-cheddar', name: 'Cheddar cheese', quantity: 100, unit: 'g', category: 'fresh', inPantry: false },
        { ingredientId: 'ing-milk', name: 'Milk', quantity: 200, unit: 'ml', category: 'fresh', inPantry: false },
      ],
    };

    const recipeFajitas: Recipe = {
      id: 'recipe-fajitas',
      title: 'Chicken Fajitas',
      sourceUrl: null,
      imageUrl: null,
      cookTimeMins: 25,
      servings: 2,
      difficulty: 'easy',
      tags: ['Mexican', 'dinner'],
      dietaryTags: [],
      instructions: ['Sear chicken with peppers and onions', 'Serve in wraps'],
      proTip: null,
      costPerPortion: 210,
      ingredients: [
        { ingredientId: 'ing-chicken', name: 'Chicken breast', quantity: 300, unit: 'g', category: 'fresh', inPantry: false },
        { ingredientId: 'ing-peppers', name: 'Bell peppers', quantity: 2, unit: 'each', category: 'fresh', inPantry: false },
        { ingredientId: 'ing-wraps', name: 'Tortilla wraps', quantity: 4, unit: 'each', category: 'cupboard', inPantry: false },
      ],
    };

    const recipeSharedBake: Recipe = {
      id: 'recipe-chicken-pasta-bake',
      title: 'Cheesy Chicken Pasta Bake',
      sourceUrl: null,
      imageUrl: null,
      cookTimeMins: 30,
      servings: 4,
      difficulty: 'easy',
      tags: ['comfort', 'dinner'],
      dietaryTags: [],
      instructions: ['Combine pasta, chicken and cheddar', 'Bake until golden'],
      proTip: null,
      costPerPortion: 190,
      ingredients: [
        { ingredientId: 'ing-pasta', name: 'Penne pasta', quantity: 300, unit: 'g', category: 'cupboard', inPantry: false },
        { ingredientId: 'ing-cheddar', name: 'Cheddar cheese', quantity: 150, unit: 'g', category: 'fresh', inPantry: false },
        { ingredientId: 'ing-chicken', name: 'Chicken breast', quantity: 400, unit: 'g', category: 'fresh', inPantry: false },
      ],
    };

    const meal1 = createMeal({
      id: 'meal-wed-1',
      day: 'wed',
      mealType: 'dinner',
      recipeId: 'recipe-mac',
      cookedByUserId: 'user-sam',
      participants: [{ userId: 'user-sam', optedOut: false, guests: 0 }],
    });

    const meal2 = createMeal({
      id: 'meal-wed-2',
      day: 'wed',
      mealType: 'dinner',
      recipeId: 'recipe-fajitas',
      cookedByUserId: 'user-me',
      participants: [{ userId: 'user-me', optedOut: false, guests: 0 }],
    });

    const overlaps = findOverlapGaps(
      [meal1, meal2],
      [recipeMac, recipeFajitas, recipeSharedBake],
      { 'user-sam': 'Sam', 'user-me': 'Me' }
    );

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].day).toBe('wed');
    expect(overlaps[0].suggestions.length).toBeGreaterThan(0);
    expect(overlaps[0].suggestions[0].recipeId).toBe('recipe-chicken-pasta-bake');
    expect(overlaps[0].suggestions[0].shares.length).toBeGreaterThanOrEqual(2);
  });
});
