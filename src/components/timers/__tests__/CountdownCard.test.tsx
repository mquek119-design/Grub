import { act, render } from '@testing-library/react';
import { CountdownCard } from '../CountdownCard';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => { jest.useRealTimers(); refresh.mockClear(); });

it('refreshes the server guidance once when planning closes', () => {
  jest.useFakeTimers();
  const now = new Date('2026-09-13T16:59:59Z');
  jest.setSystemTime(now);
  render(<CountdownCard cutoffAt="2026-09-13T17:00:00Z" />);
  act(() => { jest.advanceTimersByTime(5000); });
  expect(refresh).toHaveBeenCalledTimes(1);
});

it('does not repeatedly refresh a page opened after cutoff', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-13T17:10:00Z'));
  render(<CountdownCard cutoffAt="2026-09-13T17:00:00Z" />);
  act(() => { jest.advanceTimersByTime(5000); });
  expect(refresh).not.toHaveBeenCalled();
});
