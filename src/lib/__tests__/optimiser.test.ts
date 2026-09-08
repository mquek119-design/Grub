import { optimiseBasket, type IngredientPack } from '../optimiser';
import type { PlannedMeal, Recipe, PantryItem } from '../types';

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

describe('optimiseBasket', () => {
  const ricePack: IngredientPack = {
    ingredientId: 'ing-rice',
    name: 'Basmati Rice',
    category: 'cupboard',
    packSize: 1000,
    packUnit: 'g',
    packPrice: 150, // £1.50
    originalPrice: 150,
  };

  const chickenPack: IngredientPack = {
    ingredientId: 'ing-chicken',
    name: 'Chicken Breast Fillets',
    category: 'fresh',
    packSize: 600,
    packUnit: 'g',
    packPrice: 450, // £4.50
    originalPrice: 450,
  };

  const recipeThai: Recipe = {
    id: 'recipe-thai',
    title: 'Thai Green Curry',
    sourceUrl: null,
    imageUrl: null,
    cookTimeMins: 30,
    servings: 2,
    difficulty: 'easy',
    tags: ['curry', 'chicken'],
    dietaryTags: [],
    instructions: ['Cook chicken', 'Add paste and coconut milk', 'Serve with rice'],
    proTip: null,
    costPerPortion: 200,
    ingredients: [
      { ingredientId: 'ing-chicken', name: 'Chicken breast', quantity: 300, unit: 'g', category: 'fresh', inPantry: false },
      { ingredientId: 'ing-rice', name: 'Rice', quantity: 200, unit: 'g', category: 'cupboard', inPantry: false },
    ],
  };

  const recipeTikka: Recipe = {
    id: 'recipe-tikka',
    title: 'Chicken Tikka Masala',
    sourceUrl: null,
    imageUrl: null,
    cookTimeMins: 35,
    servings: 2,
    difficulty: 'easy',
    tags: ['curry', 'chicken'],
    dietaryTags: [],
    instructions: ['Cook chicken', 'Add tikka paste', 'Serve with rice'],
    proTip: null,
    costPerPortion: 220,
    ingredients: [
      { ingredientId: 'ing-chicken', name: 'Chicken breast', quantity: 300, unit: 'g', category: 'fresh', inPantry: false },
      { ingredientId: 'ing-rice', name: 'Rice', quantity: 200, unit: 'g', category: 'cupboard', inPantry: false },
    ],
  };

  it('pools shared ingredients across separate meals into whole packs and computes overlap savings', () => {
    const meal1 = createMeal({
      id: 'meal-1',
      day: 'wed',
      mealType: 'dinner',
      recipeId: 'recipe-thai',
      cookedByUserId: 'user-alice',
      participants: [{ userId: 'user-alice', optedOut: false, guests: 0 }],
    });

    const meal2 = createMeal({
      id: 'meal-2',
      day: 'wed',
      mealType: 'dinner',
      recipeId: 'recipe-tikka',
      cookedByUserId: 'user-bob',
      participants: [{ userId: 'user-bob', optedOut: false, guests: 0 }],
    });

    // Meal 1 needs 150g chicken, 100g rice (scaled to 1 diner out of 2 servings)
    // Meal 2 needs 150g chicken, 100g rice (scaled to 1 diner out of 2 servings)
    // Separate:
    //   Meal 1 alone: 150g chicken -> 1 pack (600g), 100g rice -> 1 pack (1000g)
    //   Meal 2 alone: 150g chicken -> 1 pack (600g), 100g rice -> 1 pack (1000g)
    //   Separate packs total: 2 chicken + 2 rice = 4 packs
    // Pooled:
    //   Chicken total = 300g <= 600g -> 1 pack (saves 1 chicken pack = £4.50!)
    //   Rice total = 200g <= 1000g -> 1 pack (saves 1 rice pack = £1.50!)
    //   Pooled packs total: 1 chicken + 1 rice = 2 packs

    const result = optimiseBasket(
      [meal1, meal2],
      [recipeThai, recipeTikka],
      [],
      [chickenPack, ricePack]
    );

    expect(result.lines).toHaveLength(2);

    const chickenLine = result.lines.find((l) => l.ingredientId === 'ing-chicken');
    expect(chickenLine).toBeDefined();
    expect(chickenLine?.packs).toBe(1);
    expect(chickenLine?.packsIfSeparate).toBe(2);
    expect(chickenLine?.neededQuantity).toBe(300);

    const riceLine = result.lines.find((l) => l.ingredientId === 'ing-rice');
    expect(riceLine).toBeDefined();
    expect(riceLine?.packs).toBe(1);
    expect(riceLine?.packsIfSeparate).toBe(2);
    expect(riceLine?.neededQuantity).toBe(200);

    // Overlap savings: 1 chicken pack (450p) + 1 rice pack (150p) = 600p (£6.00)
    expect(result.overlapSavings).toBe(600);
    // Total basket cost: 450 + 150 = 600p (£6.00) instead of £12.00
    expect(result.totalCost).toBe(600);

    // Both Alice and Bob get attributed their fair share
    expect(chickenLine?.allocations).toEqual(
      expect.arrayContaining([
        { userId: 'user-alice', share: 150 },
        { userId: 'user-bob', share: 150 },
      ])
    );
  });

  it('correctly handles pantry deductions alongside shared ingredients', () => {
    const meal1 = createMeal({
      id: 'meal-1',
      day: 'thu',
      mealType: 'dinner',
      recipeId: 'recipe-thai',
      cookedByUserId: 'user-alice',
      participants: [{ userId: 'user-alice', optedOut: false, guests: 0 }],
    });

    // House has 100g of rice in pantry
    const pantry: PantryItem[] = [
      {
        id: 'pantry-1',
        houseId: 'house-1',
        ingredientId: 'ing-rice',
        name: 'Basmati Rice',
        category: 'cupboard',
        quantityRemaining: 100,
        unit: 'g',
        lowStock: false,
        addedDate: '2026-09-01',
        isShared: true,
        ownerUserId: null,
      },
    ];

    const result = optimiseBasket([meal1], [recipeThai], pantry, [ricePack]);
    const riceLine = result.lines.find((l) => l.ingredientId === 'ing-rice');

    expect(riceLine).toBeDefined();
    expect(riceLine?.neededQuantity).toBe(100);
    expect(riceLine?.pantryQuantity).toBe(100);
    // Needed 100g, pantry covers 100g -> 0 packs to buy
    expect(riceLine?.packs).toBe(0);
    expect(result.pantrySavings).toBe(150); // 1 pack saved via pantry
  });
});
