import { fireEvent, render, screen } from '@testing-library/react';
import { FirstRunTip } from '@/components/ui/FirstRunTip';

describe('FirstRunTip', () => {
  beforeEach(() => window.localStorage.clear());

  it('persists dismissal for each tab independently', async () => {
    const { unmount } = render(<FirstRunTip tab="feed" />);

    expect(await screen.findByText('Your house at a glance')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss feed guide' }));
    expect(screen.queryByText('Your house at a glance')).toBeNull();
    expect(window.localStorage.getItem('grub:first-run-tip:feed')).toBe('dismissed');

    unmount();
    render(<FirstRunTip tab="feed" />);
    expect(screen.queryByText('Your house at a glance')).toBeNull();

    render(<FirstRunTip tab="plan" />);
    expect(await screen.findByText('Build the week together')).not.toBeNull();
  });

  it('still renders and dismisses when storage is unavailable', async () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    render(<FirstRunTip tab="basket" />);
    expect(await screen.findByText('Check the shop before it goes')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss basket guide' }));
    expect(screen.queryByText('Check the shop before it goes')).toBeNull();

    getItem.mockRestore();
    setItem.mockRestore();
  });
});
