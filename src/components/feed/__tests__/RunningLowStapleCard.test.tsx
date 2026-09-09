import { fireEvent, render, screen } from '@testing-library/react';
import { RunningLowStapleCard } from '@/components/feed/RunningLowStapleCard';

describe('RunningLowStapleCard', () => {
  it('renders common household supplies and not ingredients', () => {
    render(<RunningLowStapleCard />);

    // Must include common household staples
    expect(screen.getByText('Toilet Paper')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Towels')).toBeInTheDocument();
    expect(screen.getByText('Aluminium Foil')).toBeInTheDocument();
    expect(screen.getByText('Bin Bags')).toBeInTheDocument();

    // Must NOT include food ingredients
    expect(screen.queryByText('Milk')).toBeNull();
    expect(screen.queryByText('Eggs')).toBeNull();
    expect(screen.queryByText('Bread')).toBeNull();
  });

  it('toggles an item to flagged and back', () => {
    render(<RunningLowStapleCard />);

    const foilBtn = screen.getByRole('button', { name: /aluminium foil/i });
    expect(foilBtn.textContent).not.toContain('(Flagged)');

    fireEvent.click(foilBtn);
    expect(foilBtn.textContent).toContain('(Flagged)');
    expect(screen.getByText('1 Flagged')).toBeInTheDocument();

    fireEvent.click(foilBtn);
    expect(foilBtn.textContent).not.toContain('(Flagged)');
    expect(screen.getByText('House Essentials')).toBeInTheDocument();
  });
});
