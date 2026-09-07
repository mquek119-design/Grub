jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/queries', () => ({
  getCurrentUser: jest.fn(), getCollector: jest.fn(), getWeeklyPlan: jest.fn(),
  getSettlementItems: jest.fn(), getHousemates: jest.fn(),
  getSubstitutions: jest.fn(), getBasketItems: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/viewAs', () => ({ readViewAsId: jest.fn(), viewAsRefusal: jest.fn() }));

import * as queries from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { readViewAsId } from '@/lib/viewAs';
import { postSplit } from '../postActions';
import { finaliseReconciliation, notifyPaymentSent, confirmPaymentReceived } from '../actions';

// Exercise the real actions; replace only database/auth boundaries.
const from = jest.fn();
const rpc = jest.fn();
const update = jest.fn();
const upsert = jest.fn();
const remove = jest.fn();
const select = jest.fn();
const eq = jest.fn();
const maybeSingle = jest.fn();
const chain = { select, eq, maybeSingle, update, upsert, delete: remove };

beforeEach(() => {
  jest.clearAllMocks();
  (queries.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'collector', houseId: 'house' });
  (queries.getCollector as jest.Mock).mockResolvedValue({ id: 'collector' });
  (queries.getWeeklyPlan as jest.Mock).mockResolvedValue({ id: 'current-plan', status: 'ordered' });
  (queries.getHousemates as jest.Mock).mockResolvedValue([{ id: 'collector' }, { id: 'payer' }]);
  const items = [{ id: 'item', unitPrice: 101, quantity: 1, allocatedTo: [] }];
  (queries.getSettlementItems as jest.Mock).mockResolvedValue(items);
  (queries.getBasketItems as jest.Mock).mockResolvedValue(items);
  (queries.getSubstitutions as jest.Mock).mockResolvedValue([]);
  (createClient as jest.Mock).mockResolvedValue({ from, rpc });
  (readViewAsId as jest.Mock).mockResolvedValue(null);
  from.mockReturnValue(chain);
  select.mockReturnValue(chain);
  update.mockReturnValue(chain);
  remove.mockReturnValue(chain);
  eq.mockReturnValue(chain);
  maybeSingle.mockReset();
  upsert.mockResolvedValue({ error: null });
});

it.each(['planning', 'locked'])('refuses posting in %s before any database write', async (status) => {
  (queries.getWeeklyPlan as jest.Mock).mockResolvedValue({ id: 'plan', status });
  expect(await postSplit()).toMatchObject({ status: 'error', message: 'Place the order before posting the split.' });
  expect(from).not.toHaveBeenCalled();
});

it('refuses a housemate posting the collector’s split', async () => {
  (queries.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'payer', houseId: 'house' });
  expect(await postSplit()).toMatchObject({ status: 'error', message: 'Only the collector can post the split.' });
  expect(upsert).not.toHaveBeenCalled();
});

it.each(['ordered', 'delivered'])('allows the collector to post in %s', async (status) => {
  (queries.getWeeklyPlan as jest.Mock).mockResolvedValue({ id: 'plan', status });
  eq.mockResolvedValueOnce({ data: [], error: null });
  expect(await postSplit()).toMatchObject({ status: 'success' });
  expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ from_user_id: 'payer', amount: 50 }), expect.anything());
});

it.each([notifyPaymentSent, confirmPaymentReceived])('refuses payment status writes before delivery checking', async (action) => {
  maybeSingle.mockResolvedValueOnce({ data: { plan_id: 'older-plan' }, error: null })
    .mockResolvedValueOnce({ data: { status: 'ordered' }, error: null });
  expect(await action('split')).toMatchObject({ status: 'error' });
  expect(eq).toHaveBeenCalledWith('id', 'older-plan');
  expect(update).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});

it('allows an older checked split even while the current week is planning', async () => {
  maybeSingle.mockResolvedValueOnce({ data: { plan_id: 'older-plan' }, error: null })
    .mockResolvedValueOnce({ data: { status: 'delivered' }, error: null });
  select.mockImplementation((fields) => fields === 'id' ? { data: [{ id: 'split' }], error: null } : chain);
  expect(await notifyPaymentSent('split')).toMatchObject({ status: 'success' });
  expect(update).toHaveBeenCalledWith({ status: 'notified' });
  expect(queries.getWeeklyPlan).not.toHaveBeenCalled();
});

it('also guards the demo-user RPC before checking the delivery', async () => {
  (readViewAsId as jest.Mock).mockResolvedValue('demo');
  maybeSingle.mockResolvedValueOnce({ data: { plan_id: 'plan' }, error: null })
    .mockResolvedValueOnce({ data: { status: 'ordered' }, error: null });
  expect(await notifyPaymentSent('split')).toMatchObject({ status: 'error' });
  expect(rpc).not.toHaveBeenCalled();
});

it('keeps payments closed while a substitution is undecided', async () => {
  (queries.getSubstitutions as jest.Mock).mockResolvedValue([{ decision: 'pending' }]);
  expect(await finaliseReconciliation('current-plan')).toMatchObject({ status: 'error' });
  expect(update).not.toHaveBeenCalled();
  expect(upsert).not.toHaveBeenCalled();
});

it('keeps payments closed if the corrected split cannot be saved', async () => {
  eq.mockResolvedValueOnce({ data: [], error: null });
  upsert.mockResolvedValueOnce({ error: { message: 'Save failed' } });
  expect(await finaliseReconciliation('current-plan')).toMatchObject({ status: 'error', message: 'Save failed' });
  expect(update).not.toHaveBeenCalled();
});

it('posts corrected amounts before marking the delivery checked', async () => {
  eq.mockResolvedValueOnce({ data: [], error: null });
  select.mockImplementation((fields) => fields === 'id' ? { data: [{ id: 'current-plan' }], error: null } : chain);
  expect(await finaliseReconciliation('current-plan')).toMatchObject({ status: 'success' });
  expect(update).toHaveBeenCalledWith({ status: 'delivered' });
  expect(upsert.mock.invocationCallOrder[0]).toBeLessThan(update.mock.invocationCallOrder[0]);
});

it('does not open payment if removing a refunded debt fails', async () => {
  (queries.getSettlementItems as jest.Mock).mockResolvedValue([{ id: 'item', unitPrice: 101, quantity: 0, allocatedTo: [] }]);
  eq.mockResolvedValueOnce({ data: [{ id: 'old-split', from_user_id: 'payer', amount: 50 }], error: null })
    .mockResolvedValueOnce({ error: { message: 'Could not clear refunded share' } });
  expect(await finaliseReconciliation('current-plan')).toMatchObject({ status: 'error' });
  expect(update).not.toHaveBeenCalled();
});
