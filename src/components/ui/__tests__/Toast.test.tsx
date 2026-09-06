import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function ToastTrigger() {
  const { toast } = useToast();
  return <button onClick={() => toast('Meal added.')}>Show toast</button>;
}

describe('ToastProvider', () => {
  it('announces and dismisses a notification', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(screen.getByRole('status').textContent).toContain('Meal added.');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('dismisses the newest notification with Escape', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('dismisses notifications automatically', () => {
    jest.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    act(() => jest.advanceTimersByTime(4_000));

    expect(screen.queryByRole('status')).toBeNull();
    jest.useRealTimers();
  });
});
