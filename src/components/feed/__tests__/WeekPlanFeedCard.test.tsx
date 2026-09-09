import { fireEvent, render, screen } from '@testing-library/react';
import { WeekPlanFeedCard } from '@/components/feed/WeekPlanFeedCard';
import type { PlannedMeal, Recipe, User, WeeklyPlan } from '@/lib/types';

const mockCurrentUser: User = {
  id: 'u1',
  name: 'Alex',
  email: 'alex@example.com',
  houseId: 'h1',
  room: null,
  avatarUrl: null,
  accent: 'green',
  isAdmin: false,
  isDemo: false,
  dietaryPreferences: [],
  payment: { bankName: null, sortCode: null, accountNumber: null, link: null, note: null },
};

const mockMaya: User = {
  id: 'u2',
  name: 'Maya',
  email: 'maya@example.com',
  houseId: 'h1',
  room: null,
  avatarUrl: null,
  accent: 'orange',
  isAdmin: false,
  isDemo: false,
  dietaryPreferences: [],
  payment: { bankName: null, sortCode: null, accountNumber: null, link: null, note: null },
};

const mockHousemates: User[] = [mockCurrentUser, mockMaya];

const mockRecipe: Recipe = {
  id: 'r1',
  title: 'Spaghetti Bolognese',
  cookTimeMins: 30,
  difficulty: 'easy',
  servings: 4,
  tags: ['Italian'],
  dietaryTags: [],
  instructions: ['Cook pasta', 'Make sauce'],
  ingredients: [],
  imageUrl: null,
  sourceUrl: null,
  costPerPortion: 200,
  proTip: null,
};

const mockMeals: PlannedMeal[] = [
  {
    id: 'm1',
    planId: 'p1',
    day: 'wed',
    mealType: 'dinner',
    recipeId: 'r1',
    recipeTitle: 'Spaghetti Bolognese',
    cookedByUserId: 'u2',
    createdBy: 'u1',
    cookOfferTo: null,
    isShared: true,
    status: 'planned',
    participants: [
      { userId: 'u1', guests: 0 },
      { userId: 'u2', guests: 0 },
    ],
    maxDiners: null,
  },
];

const mockPlan: WeeklyPlan = {
  id: 'p1',
  houseId: 'h1',
  weekNumber: 1,
  weekStartDate: '2026-09-07',
  cutoffAt: '2026-09-09T20:00:00Z',
  status: 'planning',
  sharedSavings: 450,
  meals: mockMeals,
  recipes: new Map([['r1', mockRecipe]]),
  overlaps: [],
  slot: null,
};

const mockRecipesRecord: Record<string, Recipe> = {
  r1: mockRecipe,
};

describe('WeekPlanFeedCard', () => {
  it('renders "This Week\'s Plan" and the shared meal badge', () => {
    render(
      <WeekPlanFeedCard
        plan={mockPlan}
        recipes={mockRecipesRecord}
        housemates={mockHousemates}
        currentUser={mockCurrentUser}
        today="wed"
        visibleDays={['mon', 'tue', 'wed', 'thu', 'fri']}
        sharedMealCount={1}
      />
    );

    expect(screen.getByText("This Week's Plan")).toBeInTheDocument();
    expect(screen.getByText('1 Shared')).toBeInTheDocument();
  });

  it('renders Wednesday meals when Wednesday is today/selected', () => {
    render(
      <WeekPlanFeedCard
        plan={mockPlan}
        recipes={mockRecipesRecord}
        housemates={mockHousemates}
        currentUser={mockCurrentUser}
        today="wed"
        visibleDays={['mon', 'tue', 'wed', 'thu', 'fri']}
        sharedMealCount={1}
      />
    );

    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument();
    expect(screen.getByText('Maya')).toBeInTheDocument();
    expect(screen.getByText("You're in")).toBeInTheDocument();
  });

  it('switches days when a day tab in the rail is clicked', () => {
    render(
      <WeekPlanFeedCard
        plan={mockPlan}
        recipes={mockRecipesRecord}
        housemates={mockHousemates}
        currentUser={mockCurrentUser}
        today="wed"
        visibleDays={['mon', 'tue', 'wed', 'thu', 'fri']}
        sharedMealCount={1}
      />
    );

    // Switch to Thursday
    const thuBtn = screen.getByRole('button', { name: /thu/i });
    fireEvent.click(thuBtn);

    // Thursday has no meals
    expect(screen.getByText('No meals planned for Thursday')).toBeInTheDocument();
    expect(screen.getByText('Add meal to Thursday')).toBeInTheDocument();
  });

  it('toggles to "All Week" view mode', () => {
    render(
      <WeekPlanFeedCard
        plan={mockPlan}
        recipes={mockRecipesRecord}
        housemates={mockHousemates}
        currentUser={mockCurrentUser}
        today="wed"
        visibleDays={['mon', 'tue', 'wed', 'thu', 'fri']}
        sharedMealCount={1}
      />
    );

    const allWeekBtn = screen.getByRole('button', { name: /all week/i });
    fireEvent.click(allWeekBtn);

    // In All Week view, Thursday displays "Nothing planned"
    expect(screen.getByText('Thursday')).toBeInTheDocument();
    expect(screen.getAllByText('Nothing planned').length).toBeGreaterThan(0);
    // Wednesday displays the meal
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument();
  });
});
