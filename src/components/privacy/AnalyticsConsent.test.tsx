import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AnalyticsConsent } from './AnalyticsConsent';

let filter: (event: { type: string; url: string }) => unknown;
jest.mock('@vercel/analytics/react', () => ({ Analytics: (props: { beforeSend: typeof filter }) => { filter = props.beforeSend; return <div data-testid="analytics" />; } }));

beforeEach(() => localStorage.clear());

it('keeps analytics off before a choice and after rejection', async () => {
  render(<AnalyticsConsent />);
  await screen.findByRole('button', { name: 'Reject analytics' });
  expect(screen.queryByTestId('analytics')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reject analytics' }));
  expect(localStorage.getItem('grub:analytics-consent:v1')).toBe('rejected');
  expect(screen.queryByTestId('analytics')).toBeNull();
});

it('accepts, persists and excludes private and token-bearing URLs', async () => {
  render(<AnalyticsConsent />);
  fireEvent.click(await screen.findByRole('button', { name: 'Accept analytics' }));
  await screen.findByTestId('analytics');
  expect(filter({ type: 'pageview', url: 'https://grubhouse.uk/welcome' })).not.toBeNull();
  for (const path of ['/split', '/auth/callback?code=secret', '/welcome?email=private', '/recipes/123']) {
    expect(filter({ type: 'pageview', url: `https://grubhouse.uk${path}` })).toBeNull();
  }
  fireEvent.click(screen.getByRole('button', { name: 'Privacy choices' }));
  expect(screen.getByRole('button', { name: 'Reject analytics' })).toBeTruthy();
});

it('stops the retained event filter when another tab withdraws consent', async () => {
  localStorage.setItem('grub:analytics-consent:v1', 'accepted');
  render(<AnalyticsConsent />);
  await screen.findByTestId('analytics');
  const retained = filter;
  localStorage.setItem('grub:analytics-consent:v1', 'rejected');
  fireEvent(window, new StorageEvent('storage'));
  await waitFor(() => expect(screen.queryByTestId('analytics')).toBeNull());
  expect(retained({ type: 'pageview', url: 'https://grubhouse.uk/welcome' })).toBeNull();
});
