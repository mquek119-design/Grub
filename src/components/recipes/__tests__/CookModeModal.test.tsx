import { fireEvent, render, screen } from '@testing-library/react';
import { CookModeModal } from '@/components/recipes/CookModeModal';
import type { Recipe } from '@/lib/types';

const mockRecipe: Recipe = {
  id: 'test-recipe-1',
  title: 'Creamy Garlic Pasta',
  sourceUrl: null,
  imageUrl: null,
  cookTimeMins: 20,
  difficulty: 'easy',
  servings: 2,
  costPerPortion: 150 as any,
  tags: ['pasta'],
  dietaryTags: ['vegetarian'],
  instructions: [
    'Bring a large pot of salted water to the boil and cook pasta for 10 mins.',
    'Meanwhile, sauté minced garlic in butter over medium heat for 2 minutes.',
    'Toss pasta with sauce and parmesan, then plate up and enjoy.',
  ],
  proTip: 'Save some pasta water.',
  ingredients: [
    { ingredientId: 'ing-1', name: 'Pasta', quantity: 200, unit: 'g', inPantry: true, category: 'cupboard' },
    { ingredientId: 'ing-2', name: 'Garlic', quantity: 3, unit: 'cloves', inPantry: true, category: 'fresh' },
  ],
};

describe('CookModeModal', () => {
  it('renders flashcard view and switches cards cleanly', () => {
    render(
      <CookModeModal
        recipe={mockRecipe}
        servings={2}
        onClose={jest.fn()}
      />
    );

    // Initial card: step 1
    expect(screen.getByText(/Bring a large pot/i)).toBeInTheDocument();

    // Advance to next step
    const nextBtn = screen.getByRole('button', { name: /done · next step/i });
    fireEvent.click(nextBtn);

    // Step 2 is now shown
    expect(screen.getByText(/Meanwhile, sauté minced garlic/i)).toBeInTheDocument();

    // Switch to Checklist view
    const checklistTab = screen.getByRole('tab', { name: /checklist/i });
    fireEvent.click(checklistTab);
    expect(screen.getByText(/Cooking Steps Checklist/i)).toBeInTheDocument();
  });
});
