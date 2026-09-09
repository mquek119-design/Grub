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

  it('toggles dark and light mode via the moon/sun icon button without text', () => {
    render(
      <CookModeModal
        recipe={mockRecipe}
        servings={2}
        onClose={jest.fn()}
      />
    );

    // Initial state: light mode, button offers dark mode
    const modeBtn = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(modeBtn).toBeInTheDocument();
    expect(modeBtn.textContent).not.toContain('Flip');
    expect(modeBtn.textContent).not.toContain('Dark');
    expect(modeBtn.textContent).not.toContain('Light');

    // Click to toggle to dark mode
    fireEvent.click(modeBtn);

    // Now button offers switch to light mode
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();

    // Click again to switch back to light mode
    fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }));
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('displays Done on the final step button and calls onFinish on completion', () => {
    const onFinish = jest.fn();
    const onClose = jest.fn();

    render(
      <CookModeModal
        recipe={mockRecipe}
        servings={2}
        onClose={onClose}
        onFinish={onFinish}
      />
    );

    // Step 1 -> click Done · Next Step
    const nextBtn1 = screen.getByRole('button', { name: /done · next step/i });
    fireEvent.click(nextBtn1);

    // Step 2 -> click Done · Next Step
    const nextBtn2 = screen.getByRole('button', { name: /done · next step/i });
    fireEvent.click(nextBtn2);

    // Step 3 (final step) -> button now says Done
    const doneBtn = screen.getByRole('button', { name: /^done$/i });
    expect(doneBtn).toBeInTheDocument();
    expect(screen.queryByText(/finish cooking/i)).not.toBeInTheDocument();

    // Click Done to finish
    fireEvent.click(doneBtn);

    // Completion modal appears with All cards completed and Done button
    expect(screen.getByText(/all cards completed/i)).toBeInTheDocument();
    const doneButtons = screen.getAllByRole('button', { name: /^done$/i });
    const modalDoneBtn = doneButtons[doneButtons.length - 1];
    fireEvent.click(modalDoneBtn);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

