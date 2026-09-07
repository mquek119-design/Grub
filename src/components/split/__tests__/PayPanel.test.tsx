import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PayPanel } from '../PayPanel';
import { notifyPaymentSent } from '@/app/split/actions';

jest.mock('@/app/split/actions', () => ({ notifyPaymentSent: jest.fn(), undoPaymentNotification: jest.fn() }));
jest.mock('@/components/ui/Toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

const props = {
  collectorName: 'Maya',
  payment: { bankName: null, sortCode: null, accountNumber: null, link: null, note: null },
  splitId: 'split', isPosted: true,
};

it('keeps payment disabled for an unchecked delivery', () => {
  render(<PayPanel {...props} deliveryChecked={false} />);
  expect(screen.getByRole('button', { name: "I've Paid" })).toBeDisabled();
  expect(screen.getByText(/Wait for Maya to check the delivery/)).toBeInTheDocument();
});

it('shows a server refusal if delivery was reopened while the page was stale', async () => {
  (notifyPaymentSent as jest.Mock).mockResolvedValue({ status: 'error', message: 'Check the delivery first.' });
  render(<PayPanel {...props} deliveryChecked />);
  fireEvent.click(screen.getByRole('button', { name: "I've Paid" }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Check the delivery first.'));
  expect(screen.queryByText('Payment notification sent.')).not.toBeInTheDocument();
});
