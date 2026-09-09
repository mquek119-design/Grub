/**
 * Starter recipes seeded into new houses.
 * Popular, simple student meals — no prices, just ingredients and instructions.
 * The optimiser prices them against real Tesco data when needed.
 */

import type { IngredientCategory } from './types';

export interface StarterRecipe {
  title: string;
  cookTimeMins: number;
  servings: number;
  costPerPortion?: number;
  tags: string[];
  instructions: string[];
  caloriesPerPortion?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    category: IngredientCategory;
  }[];
}

export const STARTER_RECIPES: StarterRecipe[] = [
  {
    title: 'Spaghetti Bolognese',
    cookTimeMins: 45,
    servings: 4,
    costPerPortion: 165,
    tags: ['Western', 'Pasta', 'Beef', 'Comfort'],
    caloriesPerPortion: 620,
    proteinGrams: 42,
    carbsGrams: 68,
    fatGrams: 18,
    instructions: [
      'Brown the mince in a large pan.',
      'Add chopped onion and garlic, cook until soft.',
      'Stir in chopped tomatoes and simmer for 20 minutes.',
      'Serve over spaghetti.',
    ],
    ingredients: [
      { name: 'Minced beef', quantity: 500, unit: 'g', category: 'fresh' },
      { name: 'Onion', quantity: 1, unit: 'each', category: 'fresh' },
      { name: 'Garlic', quantity: 2, unit: 'each', category: 'fresh' },
      { name: 'Chopped tomatoes', quantity: 800, unit: 'g', category: 'cupboard' },
      { name: 'Spaghetti', quantity: 400, unit: 'g', category: 'cupboard' },
    ],
  },
  {
    title: 'Chicken Tikka Masala',
    cookTimeMins: 40,
    servings: 5,
    costPerPortion: 195,
    tags: ['Asian', 'Curry', 'Spicy', 'Chicken', 'Comfort'],
    caloriesPerPortion: 580,
    proteinGrams: 38,
    carbsGrams: 62,
    fatGrams: 19,
    instructions: [
      'Cut chicken into chunks and fry until golden.',
      'Add tikka paste and cook for 2 minutes.',
      'Pour in coconut milk and simmer for 20 minutes.',
      'Serve with rice.',
    ],
    ingredients: [
      { name: 'Chicken breast', quantity: 750, unit: 'g', category: 'fresh' },
      { name: 'Tikka Masala paste', quantity: 180, unit: 'g', category: 'cupboard' },
      { name: 'Coconut milk', quantity: 400, unit: 'ml', category: 'cupboard' },
      { name: 'Rice', quantity: 375, unit: 'g', category: 'cupboard' },
    ],
  },
  {
    title: 'Beef Stir Fry',
    cookTimeMins: 20,
    servings: 2,
    costPerPortion: 240,
    tags: ['Asian', 'Noodles', 'Beef', 'Quick', 'Fakeaway'],
    caloriesPerPortion: 490,
    proteinGrams: 34,
    carbsGrams: 52,
    fatGrams: 15,
    instructions: [
      'Heat oil in a wok or large pan.',
      'Sear the beef strips until cooked.',
      'Add vegetables and stir fry for 3 minutes.',
      'Add soy sauce and serve over noodles.',
    ],
    ingredients: [
      { name: 'Beef stir fry strips', quantity: 300, unit: 'g', category: 'fresh' },
      { name: 'Soy sauce', quantity: 50, unit: 'ml', category: 'cupboard' },
      { name: 'Broccoli florets', quantity: 200, unit: 'g', category: 'fresh' },
      { name: 'Egg noodles', quantity: 200, unit: 'g', category: 'cupboard' },
    ],
  },
  {
    title: 'Mac and Cheese',
    cookTimeMins: 30,
    servings: 4,
    costPerPortion: 125,
    tags: ['Western', 'Pasta', 'Cheese', 'Comfort'],
    caloriesPerPortion: 590,
    proteinGrams: 22,
    carbsGrams: 64,
    fatGrams: 28,
    instructions: [
      'Boil the macaroni according to the packet.',
      'Make a roux with butter and flour.',
      'Whisk in milk, add grated cheese.',
      'Mix with pasta and bake at 180°C for 15 minutes.',
    ],
    ingredients: [
      { name: 'Macaroni', quantity: 400, unit: 'g', category: 'cupboard' },
      { name: 'Butter', quantity: 50, unit: 'g', category: 'fresh' },
      { name: 'Flour', quantity: 50, unit: 'g', category: 'cupboard' },
      { name: 'Milk', quantity: 500, unit: 'ml', category: 'fresh' },
      { name: 'Cheddar cheese', quantity: 200, unit: 'g', category: 'fresh' },
    ],
  },
  {
    title: 'Thai Green Curry',
    cookTimeMins: 35,
    servings: 4,
    costPerPortion: 190,
    tags: ['Asian', 'Thai', 'Curry', 'Chicken', 'Fakeaway'],
    caloriesPerPortion: 540,
    proteinGrams: 36,
    carbsGrams: 55,
    fatGrams: 20,
    instructions: [
      'Fry curry paste in coconut milk for 2 minutes.',
      'Add chicken pieces and simmer for 20 minutes.',
      'Add vegetables and cook for 5 more minutes.',
      'Serve with rice.',
    ],
    ingredients: [
      { name: 'Chicken breast', quantity: 600, unit: 'g', category: 'fresh' },
      { name: 'Thai green curry paste', quantity: 120, unit: 'g', category: 'cupboard' },
      { name: 'Coconut milk', quantity: 400, unit: 'ml', category: 'cupboard' },
      { name: 'Rice', quantity: 300, unit: 'g', category: 'cupboard' },
    ],
  },
  {
    title: 'Chili Con Carne',
    cookTimeMins: 45,
    servings: 4,
    costPerPortion: 175,
    tags: ['Mexican', 'Beef', 'Spicy', 'Comfort'],
    caloriesPerPortion: 580,
    proteinGrams: 44,
    carbsGrams: 60,
    fatGrams: 16,
    instructions: [
      'Brown minced beef with diced onion and minced garlic in a hot pan.',
      'Add chili powder and cumin, cooking for 1 minute.',
      'Pour in chopped tomatoes and drained kidney beans, then simmer for 25 minutes.',
      'Serve warm over fluffy white rice.',
    ],
    ingredients: [
      { name: 'Minced beef', quantity: 500, unit: 'g', category: 'fresh' },
      { name: 'Onion', quantity: 1, unit: 'each', category: 'fresh' },
      { name: 'Garlic', quantity: 2, unit: 'each', category: 'fresh' },
      { name: 'Chopped tomatoes', quantity: 800, unit: 'g', category: 'cupboard' },
      { name: 'Kidney beans', quantity: 400, unit: 'g', category: 'cupboard' },
      { name: 'Rice', quantity: 300, unit: 'g', category: 'cupboard' },
    ],
  },
  {
    title: 'Creamy Tomato & Basil Pasta',
    cookTimeMins: 20,
    servings: 4,
    costPerPortion: 135,
    tags: ['Western', 'Italian', 'Pasta', 'Vegetarian'],
    caloriesPerPortion: 510,
    proteinGrams: 20,
    carbsGrams: 72,
    fatGrams: 15,
    instructions: [
      'Boil penne in well-salted water until al dente.',
      'Simmer passata with minced garlic and torn fresh basil for 10 minutes.',
      'Stir in a splash of cream or melted mozzarella until velvety.',
      'Toss pasta through the sauce and finish with extra basil leaves.',
    ],
    ingredients: [
      { name: 'Penne pasta', quantity: 400, unit: 'g', category: 'cupboard' },
      { name: 'Passata', quantity: 500, unit: 'g', category: 'cupboard' },
      { name: 'Mozzarella cheese', quantity: 200, unit: 'g', category: 'fresh' },
      { name: 'Garlic', quantity: 2, unit: 'each', category: 'fresh' },
      { name: 'Fresh basil', quantity: 1, unit: 'each', category: 'fresh' },
    ],
  },
  {
    title: 'Chicken Fajitas',
    cookTimeMins: 25,
    servings: 4,
    costPerPortion: 210,
    tags: ['Mexican', 'Chicken', 'Quick', 'Comfort'],
    caloriesPerPortion: 530,
    proteinGrams: 42,
    carbsGrams: 48,
    fatGrams: 18,
    instructions: [
      'Slice chicken breast into strips and toss with fajita seasoning.',
      'Flash fry chicken strips, sliced bell peppers, and sliced onions in a sizzling hot skillet.',
      'Warm tortilla wraps under a clean damp towel in the microwave.',
      'Assemble with grated cheddar cheese and salsa.',
    ],
    ingredients: [
      { name: 'Chicken breast', quantity: 600, unit: 'g', category: 'fresh' },
      { name: 'Bell peppers', quantity: 2, unit: 'each', category: 'fresh' },
      { name: 'Onion', quantity: 1, unit: 'each', category: 'fresh' },
      { name: 'Tortilla wraps', quantity: 8, unit: 'each', category: 'cupboard' },
      { name: 'Cheddar cheese', quantity: 150, unit: 'g', category: 'fresh' },
    ],
  },
  {
    title: 'Chicken Fried Rice',
    cookTimeMins: 20,
    servings: 3,
    costPerPortion: 160,
    tags: ['Asian', 'Rice', 'Chicken', 'Quick'],
    caloriesPerPortion: 520,
    proteinGrams: 36,
    carbsGrams: 64,
    fatGrams: 14,
    instructions: [
      'Dice chicken breast and sear in a wok with oil.',
      'Push chicken aside and scramble the eggs quickly in the hot wok.',
      'Toss in cooked rice and splash with dark soy sauce.',
      'Fold through sliced spring onions and serve immediately.',
    ],
    ingredients: [
      { name: 'Chicken breast', quantity: 400, unit: 'g', category: 'fresh' },
      { name: 'Rice', quantity: 300, unit: 'g', category: 'cupboard' },
      { name: 'Eggs', quantity: 3, unit: 'each', category: 'fresh' },
      { name: 'Soy sauce', quantity: 40, unit: 'ml', category: 'cupboard' },
      { name: 'Spring onions', quantity: 4, unit: 'each', category: 'fresh' },
    ],
  },
];
