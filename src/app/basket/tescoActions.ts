'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { TescoProvider } from '../../../lib/tesco/providers/tesco/index';
import { inferSessionExpiry, type TescoSession } from '../../../lib/tesco/providers/tesco/auth';
import {
  saveTescoSessionToDb,
  loadTescoSessionFromDb,
} from '@/lib/supabase/tescoSession';
import {
  isTescoOrderingEnabled,
  TESCO_ORDERING_UNAVAILABLE_MESSAGE,
} from '@/lib/tescoOrdering';

export interface TescoActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  authenticated?: boolean;
  expiresAt?: string;
  syncedCount?: number;
  totalCost?: number;
}

const fail = (message: string): TescoActionState => ({ status: 'error', message });

/** Checks if a valid Tesco session exists in the database and is unexpired. */
export async function checkTescoSession(): Promise<TescoActionState> {
  try {
    const session = await loadTescoSessionFromDb();
    if (!session || !session.cookies || session.cookies.length === 0) {
      return { status: 'idle', authenticated: false, message: 'No active Tesco session.' };
    }
    return {
      status: 'success',
      authenticated: true,
      expiresAt: session.expiresAt,
      message: 'Tesco session active.',
    };
  } catch (err: any) {
    return fail(err?.message || 'Failed to check Tesco session.');
  }
}

/** Imports exported browser cookies (JSON string or array) and saves to database. */
export async function importTescoSession(cookiesJson: string): Promise<TescoActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  try {
    const parsed = JSON.parse(cookiesJson);
    const cookies = Array.isArray(parsed) ? parsed : parsed.cookies;

    if (!Array.isArray(cookies) || cookies.length === 0) {
      return fail('Invalid cookie data. Please paste a valid Cookie-Editor JSON array.');
    }

    const session: TescoSession = {
      cookies,
      expiresAt: inferSessionExpiry(cookies),
      lastLogin: new Date().toISOString(),
    };

    await saveTescoSessionToDb(session);

    return {
      status: 'success',
      authenticated: true,
      expiresAt: session.expiresAt,
      message: `Tesco session imported with ${cookies.length} cookies`,
    };
  } catch (err: any) {
    return fail(`Failed to import session: ${err?.message || 'Invalid JSON format'}`);
  }
}

/** Synchronizes this week's basket items to Tesco's online trolley. */
export async function syncBasketToTesco(planId: string): Promise<TescoActionState> {
  if (!isTescoOrderingEnabled()) return fail(TESCO_ORDERING_UNAVAILABLE_MESSAGE);

  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const sessionCheck = await checkTescoSession();
  if (!sessionCheck.authenticated) {
    return fail('Tesco session required. Please import cookies under My Account or Basket settings.');
  }

  const supabase = await createClient();

  // Fetch basket items for this weekly plan
  const itemsResp = await supabase
    .from('basket_items')
    .select('*')
    .eq('plan_id', planId);

  if (itemsResp.error) return fail(itemsResp.error.message);
  const items = itemsResp.data || [];

  if (items.length === 0) return fail('Basket is empty.');

  const syncable = items.filter((item) => item.tesco_product_id && item.quantity > 0);
  if (syncable.length === 0) {
    return fail('No items have valid Tesco product IDs. Build the basket first.');
  }

  try {
    const session = await loadTescoSessionFromDb();
    if (!session) {
      return fail('Tesco session not found in database.');
    }

    const provider = new TescoProvider(session);

    let priceNote = '';
    let repricedCount = 0;
    let syncedCount = 0;
    for (const item of syncable) {
      await provider.addToBasket(item.tesco_product_id!, item.quantity);
      syncedCount += 1;
    }

    // Fetch actual basket from Tesco trolley to update local database prices
    try {
      const actualBasket = await provider.getBasket();
      for (const actualItem of actualBasket.items) {
        if (!actualItem.product_uid) continue;
        const localMatch = items.find((i) => i.tesco_product_id === actualItem.product_uid);
        if (localMatch) {
          const actualPricePence = Math.round(actualItem.unit_price * 100);
          if (actualPricePence !== localMatch.unit_price) repricedCount += 1;
          await supabase
            .from('basket_items')
            .update({ unit_price: actualPricePence })
            .eq('id', localMatch.id);
        }
      }
    } catch (_basketErr) {
      priceNote =
        ' Prices could not be reconciled against the Tesco trolley, so the split still uses estimates.';
    }

    // Mark plan as locked (trolley ready, awaiting shopper order placement)
    await supabase
      .from('weekly_plans')
      .update({ status: 'locked' })
      .eq('id', planId)
      .eq('house_id', me.houseId);

    revalidatePath('/basket');
    revalidatePath('/split');
    revalidatePath('/plan');
    revalidatePath('/');

    return {
      status: 'success',
      authenticated: true,
      syncedCount,
      message:
        `Pushed ${syncedCount} item${syncedCount === 1 ? '' : 's'} to your Tesco basket.` +
        (repricedCount > 0
          ? ` ${repricedCount} price${repricedCount === 1 ? '' : 's'} updated to Tesco's actual charge.`
          : '') +
        priceNote,
    };
  } catch (err: any) {
    return fail(`Tesco sync error: ${err?.message || 'Could not connect to Tesco'}`);
  }
}

/** Confirms that the order has been placed and paid for on Tesco, locking the week and activating splits. */
export async function confirmOrderPlaced(planId: string): Promise<TescoActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('weekly_plans')
    .update({ status: 'ordered' })
    .eq('id', planId)
    .eq('house_id', me.houseId);

  if (error) return fail(error.message);

  revalidatePath('/basket');
  revalidatePath('/plan');
  revalidatePath('/split');
  revalidatePath('/');

  return {
    status: 'success',
    message: 'Order confirmed! The week is locked and financial splits are active.',
  };
}

/** Runs a checkout dry-run to retrieve actual slot pricing and total checkout cost. */
export async function startTescoCheckout(): Promise<TescoActionState> {
  if (!isTescoOrderingEnabled()) return fail(TESCO_ORDERING_UNAVAILABLE_MESSAGE);

  const me = await getCurrentUser();
  if (!me.houseId) return fail('Join a house first.');

  const supabase = await createClient();
  const houseResp = await supabase
    .from('houses')
    .select('fulfillment_method, delivery_postcode, click_collect_store')
    .eq('id', me.houseId)
    .single();

  if (houseResp.error) {
    return fail(`Failed to load house settings: ${houseResp.error.message}`);
  }
  const house = houseResp.data;

  const sessionCheck = await checkTescoSession();
  if (!sessionCheck.authenticated) {
    return fail('Tesco session required. Please import cookies under My Account settings.');
  }

  try {
    const session = await loadTescoSessionFromDb();
    if (!session) {
      return fail('Tesco session not found in database.');
    }

    const provider = new TescoProvider(session);
    const orderResult = await provider.checkout(true, {
      fulfillmentMethod: house.fulfillment_method,
      postcode: house.delivery_postcode || undefined,
      collectStore: house.click_collect_store,
    });

    return {
      status: 'success',
      totalCost: Math.round(orderResult.total * 100),
      message: `Checkout preview fetched. Total: £${orderResult.total.toFixed(2)}`,
    };
  } catch (err: any) {
    return fail(`Checkout preview error: ${err?.message || 'Could not fetch checkout preview'}`);
  }
}
