import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '../BottomNav';

jest.mock('next/navigation', () => ({ usePathname: () => '/plan' }));

it('clears the missing-price indicator when the saved basket no longer needs attention', () => {
  const { rerender } = render(<BottomNav basketHasUpdates />);
  expect(screen.getByRole('link', { name: /Basket/ })).toHaveAccessibleName(/Missing pack prices/);
  rerender(<BottomNav basketHasUpdates={false} />);
  expect(screen.getByRole('link', { name: 'Basket' })).toBeInTheDocument();
  expect(screen.queryByText('Missing pack prices')).not.toBeInTheDocument();
});
