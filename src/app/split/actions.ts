'use server';

import { revalidatePath } from 'next/cache';
import { getBasketItems, getCollector, getCurrentUser, getSubstitutions, getWeeklyPlan } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { readViewAsId, viewAsRefusal } from '@/lib/viewAs';
import { postSplit } from './postActions';
import type { SplitStatus, SubstitutionDecision } from '@/lib/types';

export interface SplitActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

const fail = (message: string): SplitActionState => ({ status: 'error', message });

/**
 * Sets a split's status, whoever you are currently being.
 *
 * `splits_update` is scoped to `auth.uid()`, so while the app is rendering as a
 * demo housemate the direct update matches nothing — which is precisely the
 * flow the demo housemates exist to test. When impersonating, this goes through
 * `demo_set_split_status` (migration 0020), which makes the same house check in
 * SQL and refuses anything that is not a demo profile.
 *
 * Signed in as yourself, nothing changes: the ordinary update runs under RLS.
 */
async function writeSplitStatus(
  splitId: string,
  status: SplitStatus,
  scope: { column: 'from_user_id' | 'to_user_id'; userId: string }
): Promise<{ changed: number } | { error: string }> {
  const supabase = await createClient();
  if (status === 'notified' || status === 'confirmed') {
    // Check the split's own week, including older balances and demo users.
    const split = await supabase.from('splits').select('plan_id')
      .eq('id', splitId).eq(scope.column, scope.userId).maybeSingle();
    if (split.error) return { error: split.error.message };
    if (!split.data) return { error: 'That split is no longer available to you.' };
    const plan = await supabase.from('weekly_plans').select('status')
      .eq('id', split.data.plan_id).maybeSingle();
    if (plan.error) return { error: plan.error.message };
    if (plan.data?.status !== 'delivered') {
      return { error: 'The collector needs to check the delivery before payments can be marked or confirmed.' };
    }
  }
  const actingAs = await readViewAsId();

  if (actingAs) {
    const { data, error } = await supabase.rpc('demo_set_split_status', {
      p_split_id: splitId,
      p_status: status,
      p_acting_as: actingAs,
    });
    if (error) {
      const hint =
        error.code === 'PGRST202'
          ? ' — run supabase/migrations/0020_demo_write_functions.sql.'
          : '';
      return { error: `${error.message}${hint}` };
    }
    return { changed: data ?? 0 };
  }

  const { data, error } = await supabase
    .from('splits')
    .update({ status })
    .eq('id', splitId)
    .eq(scope.column, scope.userId)
    .select('id');

  if (error) return { error: error.message };
  return { changed: data?.length ?? 0 };
}

/** Notifies collector that payment was sent (status = 'notified'). */
export async function notifyPaymentSent(splitId: string): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const written = await writeSplitStatus(splitId, 'notified', {
    column: 'from_user_id',
    userId: me.id,
  });

  if ('error' in written) return fail(written.error);
  if (written.changed === 0) {
    return fail((await viewAsRefusal('Payment status')) ?? 'That split is no longer yours to mark.');
  }

  revalidatePath('/split');
  revalidatePath('/split/balances');
  revalidatePath('/');

  return { status: 'success', message: 'Payment notification sent.' };
}

/** Resets payment status to 'pending'. */
export async function undoPaymentNotification(splitId: string): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const written = await writeSplitStatus(splitId, 'pending', {
    column: 'from_user_id',
    userId: me.id,
  });

  if ('error' in written) return fail(written.error);
  if (written.changed === 0) {
    return fail((await viewAsRefusal('Payment status')) ?? 'That split is no longer yours to change.');
  }

  revalidatePath('/split');
  revalidatePath('/split/balances');
  revalidatePath('/');

  return { status: 'success', message: 'Notification undone.' };
}

/** Collector confirms payment received (status = 'confirmed'). */
export async function confirmPaymentReceived(splitId: string): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const written = await writeSplitStatus(splitId, 'confirmed', {
    column: 'to_user_id',
    userId: me.id,
  });

  if ('error' in written) return fail(written.error);
  if (written.changed === 0) {
    return fail((await viewAsRefusal('Confirming a payment')) ?? 'Only the collector can confirm that one.');
  }

  revalidatePath('/split');
  revalidatePath('/split/balances');
  revalidatePath('/');

  return { status: 'success', message: 'Payment confirmed.' };
}

/** Collector disputes payment (status = 'disputed'). */
export async function disputePayment(splitId: string): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const written = await writeSplitStatus(splitId, 'disputed', {
    column: 'to_user_id',
    userId: me.id,
  });

  if ('error' in written) return fail(written.error);
  if (written.changed === 0) {
    return fail((await viewAsRefusal('Disputing a payment')) ?? 'Only the collector can dispute that one.');
  }

  revalidatePath('/split');
  revalidatePath('/split/balances');
  revalidatePath('/');

  return { status: 'success', message: 'Payment disputed.' };
}

/** Corrections reopen the delivery check before any amount can change. */
async function prepareDeliveryEdit(basketItemId: string): Promise<string | null> {
  const [me, collector, plan, items] = await Promise.all([
    getCurrentUser(), getCollector(), getWeeklyPlan(), getBasketItems(),
  ]);
  if (collector?.id !== me.id) return 'Only the collector can change the delivery check.';
  if (!plan?.id || !['ordered', 'delivered'].includes(plan.status) || !items.some((item) => item.id === basketItemId)) {
    return 'That item is not in the current order.';
  }
  if (plan.status === 'delivered') {
    const supabase = await createClient();
    const { error } = await supabase.from('weekly_plans').update({ status: 'ordered' })
      .eq('id', plan.id).eq('house_id', me.houseId);
    if (error) return error.message;
    revalidatePath('/split', 'layout');
    revalidatePath('/');
  }
  return null;
}

export async function updateSubstitutionDecision(
  substitutionId: string,
  decision: SubstitutionDecision
): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');
  if (!['pending', 'accepted', 'rejected'].includes(decision)) return fail('Choose a valid substitution decision.');
  const substitution = (await getSubstitutions()).find((sub) => sub.id === substitutionId);
  if (!substitution) return fail('That substitution is not in the current order.');
  const refusal = await prepareDeliveryEdit(substitution.basketItemId);
  if (refusal) return fail(refusal);

  const supabase = await createClient();
  const { error } = await supabase
    .from('substitutions')
    .update({ decision })
    .eq('id', substitutionId);

  if (error) return fail(error.message);

  revalidatePath('/split/reconcile');
  revalidatePath('/split');

  return { status: 'success', message: `Substitution ${decision}.` };
}

/** Records delivery receipt status and received quantity for a basket item. */
export async function updateItemReceived(
  basketItemId: string,
  received: boolean,
  receivedQuantity: number
): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');
  if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0) return fail('Enter a whole number of received packs.');
  const refusal = await prepareDeliveryEdit(basketItemId);
  if (refusal) return fail(refusal);

  const supabase = await createClient();
  const { error } = await supabase.from('delivery_receipts').upsert({
    basket_item_id: basketItemId,
    received,
    received_quantity: Math.max(0, receivedQuantity),
    recorded_at: new Date().toISOString(),
  });

  if (error) return fail(error.message);

  revalidatePath('/split/reconcile');
  revalidatePath('/split');

  return { status: 'success', message: 'Receipt updated.' };
}

/** Finalises the order reconciliation and sets weekly plan status to 'delivered'. */
export async function finaliseReconciliation(planId: string): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const [collector, plan, substitutions, items] = await Promise.all([
    getCollector(), getWeeklyPlan(), getSubstitutions(), getBasketItems(),
  ]);
  if (collector?.id !== me.id) return fail('Only the collector can check the delivery.');
  if (plan?.id !== planId || (plan.status !== 'ordered' && plan.status !== 'delivered')) {
    return fail('Place the order before checking the delivery.');
  }
  if (substitutions.some((sub) => sub.decision === 'pending')) {
    return fail('Review every substitution before completing the delivery check.');
  }
  if (items.some((item) => item.needsPackData)) {
    return fail('Add the missing pack prices on Basket before completing the delivery check.');
  }

  const posted = await postSplit();
  if (posted.status === 'error') return fail(posted.message);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('weekly_plans')
    .update({ status: 'delivered' })
    .eq('id', planId)
    .eq('house_id', me.houseId)
    .select('id');

  if (error) return fail(error.message);
  if (!data?.length) return fail('The delivery could not be updated. Refresh and try again.');

  revalidatePath('/split/reconcile');
  revalidatePath('/split');
  revalidatePath('/split/balances');
  revalidatePath('/');

  return { status: 'success', message: 'Delivery check saved.' };
}

/** Logs a Tesco substitution manually during delivery check. */
export async function addSubstitution(
  basketItemId: string,
  orderedName: string,
  orderedPrice: number,
  receivedName: string,
  receivedPrice: number
): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');
  const refusal = await prepareDeliveryEdit(basketItemId);
  if (refusal) return fail(refusal);

  const supabase = await createClient();
  const { error } = await supabase.from('substitutions').insert({
    basket_item_id: basketItemId,
    ordered_name: orderedName,
    ordered_price: Math.max(0, orderedPrice),
    received_name: receivedName,
    received_price: Math.max(0, receivedPrice),
    decision: 'accepted',
  });

  if (error) return fail(error.message);

  revalidatePath('/split/reconcile');
  revalidatePath('/split');
  return { status: 'success', message: 'Substitution logged.' };
}

/** Updates unit price / weight-based price for a basket item during delivery check. */
export async function updateItemPrice(
  basketItemId: string,
  newUnitPrice: number
): Promise<SplitActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');
  const refusal = await prepareDeliveryEdit(basketItemId);
  if (refusal) return fail(refusal);

  const supabase = await createClient();
  const { error } = await supabase
    .from('basket_items')
    .update({ unit_price: Math.max(0, newUnitPrice) })
    .eq('id', basketItemId);

  if (error) return fail(error.message);

  revalidatePath('/split/reconcile');
  revalidatePath('/split');
  revalidatePath('/basket');
  return { status: 'success', message: 'Price updated.' };
}
