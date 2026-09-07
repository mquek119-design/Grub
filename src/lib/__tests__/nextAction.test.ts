import { nextAction, type NextActionContext } from '../nextAction';

const base: NextActionContext = {
  status: 'planning', cutoffPassed: false, mealCount: 2, hasInput: false,
  hasBasket: false, needsPackData: false, userId: 'me',
  collector: { id: 'me', name: 'Maya' }, splits: [],
};

const cases: { name: string; changes: Partial<NextActionContext>; label: string; href: string }[] = [
  { name: 'new housemate before cutoff', changes: {}, label: 'Add what you fancy', href: '/plan' },
  { name: 'existing participant before cutoff', changes: { hasInput: true }, label: 'Review your week', href: '/plan' },
  { name: 'collector after cutoff with meals', changes: { cutoffPassed: true }, label: 'Build the basket', href: '/basket' },
  { name: 'locked week before timestamp', changes: { status: 'locked' }, label: 'Build the basket', href: '/basket' },
  { name: 'closed empty week', changes: { cutoffPassed: true, mealCount: 0 }, label: 'Plan next week', href: '/plan?week=next' },
  { name: 'no collector after cutoff', changes: { cutoffPassed: true, collector: null }, label: 'Choose the collector', href: '/settings' },
  { name: 'collector with incomplete prices', changes: { cutoffPassed: true, hasBasket: true, needsPackData: true }, label: 'Review pack details', href: '/basket' },
  { name: 'collector ready to review and order', changes: { cutoffPassed: true, hasBasket: true }, label: 'Review the basket', href: '/basket' },
  { name: 'housemate waiting for collector', changes: { cutoffPassed: true, userId: 'payer' }, label: 'View the basket', href: '/basket' },
  { name: 'ordered collector', changes: { status: 'ordered' }, label: 'Check delivery', href: '/split/reconcile' },
  { name: 'ordered with missing prices', changes: { status: 'ordered', needsPackData: true }, label: 'Review pack details', href: '/basket' },
  { name: 'housemate before delivery check', changes: { status: 'ordered', userId: 'payer', splits: [{ user: { id: 'payer' }, status: 'pending' }] }, label: 'View your estimate', href: '/split' },
  { name: 'collector awaiting transfers', changes: { status: 'delivered', splits: [{ user: { id: 'payer' }, status: 'pending' }] }, label: 'Review the split', href: '/split' },
  { name: 'collector with reported payment', changes: { status: 'delivered', splits: [{ user: { id: 'payer' }, status: 'notified' }] }, label: 'Review payments', href: '/split' },
  { name: 'housemate ready to pay', changes: { status: 'delivered', userId: 'payer', splits: [{ user: { id: 'payer' }, status: 'pending' }] }, label: 'View payment details', href: '/split' },
  { name: 'housemate waiting for confirmation', changes: { status: 'delivered', userId: 'payer', splits: [{ user: { id: 'payer' }, status: 'notified' }] }, label: 'View payment status', href: '/split' },
  { name: 'disputed payment', changes: { status: 'delivered', userId: 'payer', splits: [{ user: { id: 'payer' }, status: 'disputed' }] }, label: 'Review payment', href: '/split' },
  { name: 'confirmed payment', changes: { status: 'delivered', userId: 'payer', splits: [{ user: { id: 'payer' }, status: 'confirmed' }] }, label: 'See your meals', href: '/plan' },
];

it.each(cases)('$name routes to the appropriate task', ({ changes, label, href }) => {
  expect(nextAction({ ...base, ...changes })).toMatchObject({ label, href });
});

it('does not equate an empty posted split list with everyone being paid', () => {
  expect(nextAction({ ...base, status: 'delivered' }).title).toBe('Review the delivery split');
});

it('prioritises a reported payment over pending payments for the collector', () => {
  expect(nextAction({ ...base, status: 'delivered', splits: [
    { user: { id: 'a' }, status: 'pending' }, { user: { id: 'b' }, status: 'notified' },
  ] }).label).toBe('Review payments');
});

it('never asks a housemate with a disputed transfer to pay a second time', () => {
  const action = nextAction({ ...base, status: 'delivered', userId: 'payer', splits: [{ user: { id: 'payer' }, status: 'disputed' }] });
  expect(action.body).toContain('before sending anything again');
});
