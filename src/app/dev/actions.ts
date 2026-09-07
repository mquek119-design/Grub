'use server';

import { revalidatePath } from 'next/cache';
import { getBasketItems, getCurrentUser, getWeeklyPlan } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';

export interface DevResult {
  status: 'success' | 'error';
  message: string;
}

const fail = (message: string): DevResult => ({ status: 'error', message });

/**
 * Stands in for a Tesco van.
 *
 * Reconciliation is where the money rules actually live — substitutions charged
 * at the substitute's price, unreceived items refunded in full, partial
 * deliveries charged for what turned up — and none of it could be exercised,
 * because those rows only appear when a real order is delivered to a real UK
 * address. So the rules shipped having never been seen working.
 *
 * This writes exactly what a delivery writes and nothing else: substitutions,
 * delivery receipts. It contacts nobody, and every figure it uses comes from
 * basket lines that were priced by Tesco — it invents no prices of its own.
 */
export async function simulateDelivery(): Promise<DevResult> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const [plan, items] = await Promise.all([getWeeklyPlan(), getBasketItems()]);
  if (!plan?.id) return fail('No plan for this week yet.');

  const priced = items.filter((item) => !item.needsPackData && item.unitPrice > 0);
  if (priced.length < 3) {
    return fail('Build the basket first — a delivery needs at least three priced items.');
  }

  const supabase = await createClient();

  const itemIds = items.map((item) => item.id);
  await supabase.from('substitutions').delete().in('basket_item_id', itemIds);
  await supabase.from('delivery_receipts').delete().in('basket_item_id', itemIds);

  const substituted = priced[0];
  const pendingSub = priced.length > 3 ? priced[3] : priced[0];
  const missing = priced[1];
  const partial = priced.find((item) => item.quantity > 1) ?? priced[2];

  const substitutionsToInsert: Array<{
    basket_item_id: string;
    ordered_name: string;
    ordered_price: number;
    received_name: string;
    received_price: number;
    decision: 'pending' | 'accepted' | 'rejected';
  }> = [
    {
      basket_item_id: substituted.id,
      ordered_name: substituted.name,
      ordered_price: substituted.unitPrice,
      received_name: `${substituted.name} (Tesco Finest)`,
      received_price: Math.round(substituted.unitPrice * 1.25),
      decision: 'accepted',
    },
  ];

  if (pendingSub && pendingSub.id !== substituted.id) {
    substitutionsToInsert.push({
      basket_item_id: pendingSub.id,
      ordered_name: pendingSub.name,
      ordered_price: pendingSub.unitPrice,
      received_name: `${pendingSub.name} (Alternative Brand)`,
      received_price: Math.max(10, Math.round(pendingSub.unitPrice * 0.9)),
      decision: 'pending',
    });
  }

  const subRes = await supabase.from('substitutions').insert(substitutionsToInsert);
  if (subRes.error) return fail(`Substitutions: ${subRes.error.message}`);

  const receipts = await supabase.from('delivery_receipts').insert([
    ...priced
      .filter((item) => item.id !== missing.id && item.id !== partial.id)
      .map((item) => ({
        basket_item_id: item.id,
        received: true,
        received_quantity: item.quantity,
      })),
    { basket_item_id: missing.id, received: false, received_quantity: 0 },
    {
      basket_item_id: partial.id,
      received: true,
      received_quantity: Math.max(1, partial.quantity - 1),
    },
  ]);
  if (receipts.error) return fail(`Delivery receipts: ${receipts.error.message}`);

  const marked = await supabase
    .from('weekly_plans')
    .update({ status: 'ordered' })
    .eq('id', plan.id);
  if (marked.error) return fail(marked.error.message);

  revalidatePath('/', 'layout');

  return {
    status: 'success',
    message:
      `Delivered! Simulated ${substituted.name} (accepted replacement), ${pendingSub?.name ?? 'item'} (pending sub review), ` +
      `${missing.name} (refunded), and ${partial.name} (short delivered by 1). Reconcile on Split → Delivery.`,
  };
}

/**
 * Moves housemates through the payment flow so the collector's side can be seen.
 */
export async function simulatePayments(
  stage: 'notified' | 'confirmed' | 'pending' | 'mixed'
): Promise<DevResult> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const plan = await getWeeklyPlan();
  if (!plan?.id) return fail('No plan for this week yet.');

  const supabase = await createClient();
  const splits = await supabase.from('splits').select('id, from_user_id').eq('plan_id', plan.id);
  if (splits.error) return fail(splits.error.message);

  const rows = splits.data ?? [];
  if (rows.length === 0) {
    return fail('No split has been posted yet — post it first, then come back.');
  }

  const others = rows.filter((row) => row.from_user_id !== me.id);
  if (others.length === 0) {
    return fail('Only your own row exists, and moving that would prove nothing.');
  }

  if (stage === 'mixed') {
    // Distribute states across housemates for comprehensive testing
    const states: ('notified' | 'confirmed' | 'pending' | 'disputed')[] = ['notified', 'confirmed', 'disputed', 'pending'];
    let count = 0;
    for (let i = 0; i < others.length; i++) {
      const status = states[i % states.length];
      const res = await supabase.from('splits').update({ status }).eq('id', others[i].id);
      if (!res.error) count++;
    }
    revalidatePath('/', 'layout');
    return {
      status: 'success',
      message: `Set mixed payment states across ${count} housemates (Paid, Settled, Disputed, Owes).`,
    };
  }

  const target = stage === 'pending' ? others : others.slice(0, Math.ceil(others.length / 2));

  const updated = await supabase
    .from('splits')
    .update({ status: stage })
    .in(
      'id',
      target.map((row) => row.id)
    )
    .select('id');
  if (updated.error) return fail(updated.error.message);

  const changed = updated.data?.length ?? 0;
  if (changed === 0) {
    return fail(
      'Nothing changed — row-level security only lets you touch a split you are on. Swap collector to yourself and try again.'
    );
  }

  revalidatePath('/', 'layout');

  const label =
    stage === 'notified'
      ? 'say they have paid'
      : stage === 'confirmed'
        ? 'are settled'
        : 'are back to owing';

  return {
    status: 'success',
    message: `${changed} housemate${changed === 1 ? '' : 's'} ${label}.`,
  };
}

/** Wipes the simulated delivery, so the week can be run through again. */
export async function clearDelivery(): Promise<DevResult> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const [plan, items] = await Promise.all([getWeeklyPlan(), getBasketItems()]);
  if (!plan?.id) return fail('No plan for this week yet.');

  const supabase = await createClient();
  const itemIds = items.map((item) => item.id);

  if (itemIds.length > 0) {
    const subs = await supabase.from('substitutions').delete().in('basket_item_id', itemIds);
    if (subs.error) return fail(subs.error.message);
    const receipts = await supabase.from('delivery_receipts').delete().in('basket_item_id', itemIds);
    if (receipts.error) return fail(receipts.error.message);
  }

  await supabase.from('weekly_plans').update({ status: 'ordered' }).eq('id', plan.id);
  revalidatePath('/', 'layout');

  return { status: 'success', message: 'Delivery cleared. The week is back to ordered.' };
}

/**
 * Rotates the collector to the next housemate.
 */
export async function rotateCollector(): Promise<DevResult> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const supabase = await createClient();
  const [house, members] = await Promise.all([
    supabase.from('houses').select('collector_user_id').eq('id', me.houseId).maybeSingle(),
    supabase.from('profiles').select('id, name').eq('house_id', me.houseId).order('created_at'),
  ]);

  if (house.error) return fail(house.error.message);
  if (members.error) return fail(members.error.message);

  const people = members.data ?? [];
  if (people.length < 2) return fail('Seed the demo housemates first.');

  const currentIndex = people.findIndex((row) => row.id === house.data?.collector_user_id);
  const next = people[(currentIndex + 1) % people.length];

  const updated = await supabase
    .from('houses')
    .update({ collector_user_id: next.id })
    .eq('id', me.houseId);
  if (updated.error) return fail(updated.error.message);

  revalidatePath('/', 'layout');

  return {
    status: 'success',
    message:
      next.id === me.id
        ? 'You are the collector now — the Split tab shows who owes you.'
        : `${next.name} is the collector now, so you are a payer: the Split tab shows what you owe and lets you mark it paid.`,
  };
}
