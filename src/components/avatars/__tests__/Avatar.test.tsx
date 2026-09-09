import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Avatar, AvatarStack } from '../Avatar';
import type { User } from '@/lib/types';

describe('Avatar Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const baseUser: Pick<User, 'name' | 'accent' | 'avatarUrl'> = {
    name: 'Alex Miller',
    accent: 'green',
    avatarUrl: null,
  };

  const characterUser: Pick<User, 'name' | 'accent' | 'avatarUrl'> = {
    name: 'Sam Taylor',
    accent: 'orange',
    avatarUrl: 'avatar:onion',
  };

  it('renders initials and no corner badge when user has no character glyph', () => {
    render(<Avatar user={baseUser} size="md" />);

    expect(screen.getByText('AM')).toBeInTheDocument();
    expect(screen.queryByTestId('avatar-initial-badge')).not.toBeInTheDocument();
  });

  it('renders character glyph and micro-initial badge when user has character avatar', () => {
    render(<Avatar user={characterUser} size="md" />);

    const badge = screen.getByTestId('avatar-initial-badge');
    expect(badge).toBeInTheDocument();
    // First initial of "Sam Taylor" is "S"
    expect(badge).toHaveTextContent('S');
  });

  it('suppresses micro-initial badge on size xs to prevent visual crowding', () => {
    render(<Avatar user={characterUser} size="xs" />);

    expect(screen.queryByTestId('avatar-initial-badge')).not.toBeInTheDocument();
  });

  it('suppresses micro-initial badge when showInitialBadge is explicitly false', () => {
    render(<Avatar user={characterUser} size="md" showInitialBadge={false} />);

    expect(screen.queryByTestId('avatar-initial-badge')).not.toBeInTheDocument();
  });

  it('toggles name tooltip on click/tap and auto-dismisses after timeout', () => {
    render(<Avatar user={characterUser} size="md" />);

    // Tooltip not visible initially in DOM
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Click/tap the avatar
    const avatar = screen.getByRole('img');
    fireEvent.click(avatar);

    // Tooltip now visible with name and character
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Sam Taylor (Onion)');

    // Advance past 2.5s auto-dismiss
    act(() => {
      jest.advanceTimersByTime(2600);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders AvatarStack with multiple flatmates showing their initial badges', () => {
    const maya: Pick<User, 'name' | 'accent' | 'avatarUrl'> = {
      name: 'Maya Patel',
      accent: 'purple',
      avatarUrl: 'avatar:beanie',
    };

    render(<AvatarStack users={[characterUser, maya]} size="sm" />);

    const badges = screen.getAllByTestId('avatar-initial-badge');
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveTextContent('S');
    expect(badges[1]).toHaveTextContent('M');
  });
});
