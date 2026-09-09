import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsHub } from '../SettingsHub';
import type { House, HouseStaple, LedgerEntry, Savings, User, WeeklyPlan } from '@/lib/types';

// Mock child panels that make server action calls or complex child logic
jest.mock('../TescoSessionPanel', () => ({
  TescoSessionPanel: () => <div data-testid="tesco-session-panel">Tesco Session Mock</div>,
}));

jest.mock('../FulfillmentSettingsPanel', () => ({
  FulfillmentSettingsPanel: () => <div data-testid="fulfillment-panel">Fulfillment Settings Mock</div>,
}));

jest.mock('../SlotPreferencePanel', () => ({
  SlotPreferencePanel: () => <div data-testid="slot-preference-panel">Slot Preference Mock</div>,
}));

jest.mock('../RoutinePanel', () => ({
  RoutinePanel: () => <div data-testid="routine-panel">Routine Panel Mock</div>,
}));

jest.mock('../StaplesPanel', () => ({
  StaplesPanel: () => <div data-testid="staples-panel">Staples Panel Mock</div>,
}));

jest.mock('../SharedStaplesToggle', () => ({
  SharedStaplesToggle: () => <div data-testid="shared-staples-toggle">Shared Staples Toggle Mock</div>,
}));

jest.mock('../NotificationsCalendarPanel', () => ({
  NotificationsCalendarPanel: () => <div data-testid="calendar-panel">Calendar Panel Mock</div>,
}));

jest.mock('@/components/privacy/ManagePrivacyButton', () => ({
  ManagePrivacyButton: () => <button type="button">Manage Privacy Mock</button>,
}));

jest.mock('@/components/account/AccountPanels', () => ({
  ProfileInfoPanel: () => <div data-testid="profile-info-panel">Profile Info Mock</div>,
  PaymentDetailsPanel: () => <div data-testid="payment-details-panel">Payment Details Mock</div>,
  DietaryPanel: () => <div data-testid="dietary-panel">Dietary Panel Mock</div>,
  LeaveHousePanel: () => <div data-testid="leave-house-panel">Leave House Mock</div>,
  DeleteAccountPanel: () => <div data-testid="delete-account-panel">Delete Account Mock</div>,
  LogoutButton: () => <button type="button">Log Out Mock</button>,
}));

describe('SettingsHub Component', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Taylor Swift',
    email: 'taylor@example.com',
    houseId: 'house-1',
    room: 'Room 13',
    avatarUrl: 'avatar:popcorn',
    accent: 'purple',
    dietaryPreferences: ['vegetarian'],
    payment: {
      bankName: 'Monzo',
      sortCode: '04-00-04',
      accountNumber: '12345678',
      link: 'https://monzo.me/taylorswift',
      note: null,
    },
    isAdmin: true,
    isDemo: false,
    dailyCalorieTarget: 2000,
    dailyProteinTarget: 100,
  };

  const mockHousemate: User = {
    id: 'user-2',
    name: 'Selena Gomez',
    email: 'selena@example.com',
    houseId: 'house-1',
    room: 'Room 2',
    avatarUrl: null,
    accent: 'green',
    dietaryPreferences: [],
    payment: {
      bankName: null,
      sortCode: null,
      accountNumber: null,
      link: null,
      note: null,
    },
    isAdmin: false,
    isDemo: false,
  };

  const mockHouse: House = {
    id: 'house-1',
    name: 'Cornwallis Manor',
    inviteCode: 'GRUB-1313',
    deliveryDay: 'fri',
    deliveryTime: '18:00',
    cutoffDay: 'wed',
    cutoffTime: '23:59',
    collectorUserId: 'user-1',
    sharedStaplesEnabled: true,
    fulfillmentMethod: 'delivery',
    deliveryPostcode: 'CV4 7AL',
    clickCollectStore: 'Coventry Cannon Park',
    slotPreference: {
      method: 'delivery',
      day: 'fri',
      windowStart: '18:00',
      windowEnd: '20:00',
    },
  };

  const mockStaples: HouseStaple[] = [
    {
      id: 'staple-1',
      ingredientId: 'ing-1',
      name: 'Olive Oil',
      frequency: 'monthly',
      lastAddedOn: '2026-09-01',
      due: false,
    },
  ];

  const mockLedger: LedgerEntry[] = [
    {
      id: 'led-1',
      houseId: 'house-1',
      weekNumber: 1,
      date: '2026-09-01',
      fromUserId: 'user-2',
      toUserId: 'user-1',
      amount: 1500,
      status: 'confirmed',
      note: 'Week 1 groceries',
      source: 'split',
    },
  ];

  const mockSavings: Savings = {
    totalAllTime: 4500,
    thisWeek: 500,
    ownBrandSwaps: [],
  };

  const mockPlan: WeeklyPlan = {
    id: 'plan-1',
    houseId: 'house-1',
    weekStartDate: '2026-09-01',
    weekNumber: 1,
    status: 'planning',
    cutoffAt: '2026-09-03T23:59:00Z',
    meals: [
      {
        id: 'meal-1',
        planId: 'plan-1',
        recipeId: 'rec-1',
        recipeTitle: 'Veggie Pasta',
        day: 'mon',
        mealType: 'dinner',
        isShared: true,
        createdBy: 'user-1',
        cookedByUserId: 'user-1',
        cookOfferTo: null,
        maxDiners: null,
        status: 'planned',
        participants: [{ userId: 'user-1' }],
      },
    ],
    overlaps: [],
    sharedSavings: 0,
    slot: null,
    recipes: new Map(),
  };

  it('renders House Settings by default with control center hero and house details', () => {
    render(
      <SettingsHub
        house={mockHouse}
        housemates={[mockUser, mockHousemate]}
        collector={mockUser}
        staples={mockStaples}
        currentUser={mockUser}
        ledger={mockLedger}
        savings={mockSavings}
        plan={mockPlan}
      />
    );

    // Hero details
    expect(screen.getByText('Cornwallis Manor')).toBeInTheDocument();
    expect(screen.getByText('House Control Center')).toBeInTheDocument();
    expect(screen.getAllByText('GRUB-1313')).toHaveLength(2);
    expect(screen.getByText('2 members')).toBeInTheDocument();

    // Subcategory pill buttons
    expect(screen.getByRole('button', { name: /all sections/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /members & invites/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /routine & rotation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ordering & tesco/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shared staples/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calendar & alerts/i })).toBeInTheDocument();

    // Renders panels in default "all" view
    expect(screen.getByTestId('routine-panel')).toBeInTheDocument();
    expect(screen.getByTestId('staples-panel')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-panel')).toBeInTheDocument();
  });

  it('filters to specific subcategory when clicking navigation pill without scroll clutter', () => {
    render(
      <SettingsHub
        house={mockHouse}
        housemates={[mockUser, mockHousemate]}
        collector={mockUser}
        staples={mockStaples}
        currentUser={mockUser}
        ledger={mockLedger}
        savings={mockSavings}
        plan={mockPlan}
      />
    );

    // Click on "Routine & Rotation"
    const routineBtn = screen.getByRole('button', { name: /routine & rotation/i });
    fireEvent.click(routineBtn);

    // Routine panel is visible
    expect(screen.getByTestId('routine-panel')).toBeInTheDocument();
    // Staples and Calendar panels are hidden in focused routine view
    expect(screen.queryByTestId('staples-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('calendar-panel')).not.toBeInTheDocument();

    // Click on "Shared Staples"
    const staplesBtn = screen.getByRole('button', { name: /shared staples/i });
    fireEvent.click(staplesBtn);

    // Now Staples panel is visible, Routine is hidden
    expect(screen.getByTestId('staples-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('routine-panel')).not.toBeInTheDocument();
  });

  it('switches to Your Profile tab and renders personal panels and impact stats', () => {
    render(
      <SettingsHub
        house={mockHouse}
        housemates={[mockUser, mockHousemate]}
        collector={mockUser}
        staples={mockStaples}
        currentUser={mockUser}
        ledger={mockLedger}
        savings={mockSavings}
        plan={mockPlan}
      />
    );

    // Click "Your Profile" tab
    const profileTabBtn = screen.getByRole('button', { name: /your profile/i });
    fireEvent.click(profileTabBtn);

    // Shows personal profile panels
    expect(screen.getByTestId('profile-info-panel')).toBeInTheDocument();
    expect(screen.getByTestId('dietary-panel')).toBeInTheDocument();
    expect(screen.getByTestId('payment-details-panel')).toBeInTheDocument();

    // Impact stats
    expect(screen.getByText('My Impact')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('honours defaultTab="profile" prop directly', () => {
    render(
      <SettingsHub
        house={mockHouse}
        housemates={[mockUser, mockHousemate]}
        collector={mockUser}
        staples={mockStaples}
        currentUser={mockUser}
        ledger={mockLedger}
        savings={mockSavings}
        plan={mockPlan}
        defaultTab="profile"
      />
    );

    expect(screen.getByTestId('profile-info-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('routine-panel')).not.toBeInTheDocument();
  });
});
