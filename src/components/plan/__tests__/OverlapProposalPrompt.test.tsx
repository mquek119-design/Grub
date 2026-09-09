import { render, screen } from '@testing-library/react';
import { OverlapProposalPrompt } from '@/components/plan/OverlapProposalPrompt';
import type { PlannedMeal, Recipe, User } from '@/lib/types';

jest.mock('@/app/plan/actions', () => ({
  respondToOverlapProposal: jest.fn().mockResolvedValue({ status: 'success', message: 'Ok' }),
}));

const mockProposer: User = {
  id: 'user-sam',
  email: 'sam@example.com',
  name: 'Sam',
  avatarUrl: null,
  houseId: 'house-1',
  room: 'Room 2',
  accent: 'blue',
  dietaryPreferences: [],
  payment: { bankName: null, sortCode: null, accountNumber: null, link: null, note: null },
  isAdmin: false,
  isDemo: false,
};

const mockRecipeFajitas: Recipe = {
  id: 'recipe-fajitas',
  title: 'Chicken Fajitas',
  sourceUrl: null,
  imageUrl: null,
  cookTimeMins: 25,
  difficulty: 'easy',
  servings: 4,
  costPerPortion: 210,
  tags: ['Mexican', 'Chicken'],
  dietaryTags: [],
  instructions: ['Cook chicken and peppers', 'Serve in tortillas'],
  proTip: null,
  ingredients: [],
};

const mockMealProposal: PlannedMeal = {
  id: 'meal-1',
  planId: 'plan-1',
  recipeId: 'recipe-burger',
  recipeTitle: 'Classic Beef Burger',
  day: 'wed',
  mealType: 'dinner',
  isShared: false,
  createdBy: 'user-me',
  cookedByUserId: 'user-me',
  cookOfferTo: null,
  maxDiners: null,
  status: 'planned',
  participants: [{ userId: 'user-me', optedOut: false, guests: 0 }],
  proposalToUserId: 'user-me',
  proposalRecipeId: 'recipe-fajitas',
  proposalCreatedBy: 'user-sam',
};

describe('OverlapProposalPrompt', () => {
  it('renders incoming proposal with mutual agreement note and both options', () => {
    const recipesMap = new Map<string, Recipe>([
      ['recipe-fajitas', mockRecipeFajitas],
    ]);

    render(
      <OverlapProposalPrompt
        proposals={[mockMealProposal]}
        housemates={[mockProposer]}
        recipes={recipesMap}
      />
    );

    // Verify title and description
    expect(screen.getByText(/Sam proposed cooking Chicken Fajitas together/i)).toBeInTheDocument();
    expect(screen.getByText(/Both parties must agree before meals merge/i)).toBeInTheDocument();

    // Verify action buttons
    expect(screen.getByRole('button', { name: /agree to share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep separate/i })).toBeInTheDocument();
  });

  it('renders nothing when proposals is empty', () => {
    const { container } = render(
      <OverlapProposalPrompt
        proposals={[]}
        housemates={[mockProposer]}
        recipes={new Map()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
