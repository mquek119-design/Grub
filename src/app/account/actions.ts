'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, getHouse, getHousemates } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { formatPence } from '@/lib/money';
import { readViewAsId, viewAsRefusal } from '@/lib/viewAs';
import type { User } from '@/lib/types';

export interface AccountActionState {
  /**
   * `confirm-house` is a refusal that can be answered rather than one that ends
   * the road: the last member of a house cannot delete their account without
   * the house going too, so the action stops and asks instead of guessing.
   */
  status: 'idle' | 'error' | 'success' | 'confirm-house';
  message: string;
}

const fail = (message: string): AccountActionState => ({ status: 'error', message });

/**
 * Turns the two "you have not run the migration" Postgres codes into something
 * actionable. `42703` is a column this app writes but the database has not got;
 * `PGRST202` is a function it calls that does not exist. Both otherwise surface
 * as a bare message that reads like a bug in the app.
 */
function migrationHint(code: string | undefined): string {
  if (code === '42703') return ' — run supabase/migrations/0012_structured_payment_details.sql.';
  if (code === 'PGRST202') return ' — run supabase/migrations/0020_demo_write_functions.sql.';
  return '';
}

/** Digits only, then formatted 00-00-00 — people type it every which way. */
function normaliseSortCode(raw: string): string | null | 'invalid' {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return null;
  if (digits.length !== 6) return 'invalid';
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
}

function normaliseAccountNumber(raw: string): string | null | 'invalid' {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return null;
  // Most UK accounts are 8 digits; a few banks issue 6 or 7 and pad.
  if (digits.length < 6 || digits.length > 8) return 'invalid';
  return digits;
}

/** Updates user display name, room number, avatar accent, and custom avatar photo. */
export async function updateProfileInfo(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const me = await getCurrentUser();

  const name = String(formData.get('name') ?? '').trim();
  const roomRaw = String(formData.get('room') ?? '').trim();
  const room = roomRaw.toLowerCase() === 'n/a' || roomRaw === '' ? null : roomRaw;

  const accentRaw = String(formData.get('accent') ?? '').trim();
  const validAccents = ['green', 'orange', 'blue', 'purple', 'rust', 'olive'] as const;
  const accent = (validAccents as readonly string[]).includes(accentRaw)
    ? (accentRaw as User['accent'])
    : undefined;

  const avatarUrlRaw = String(formData.get('avatarUrl') ?? '').trim();
  const avatarUrl = avatarUrlRaw.length > 0 ? avatarUrlRaw : null;

  if (!name) return fail('Name is required.');
  if (name.length > 60) return fail('Keep your name under 60 characters.');

  const updates: {
    name: string;
    room: string | null;
    accent?: User['accent'];
    avatar_url: string | null;
  } = {
    name,
    room,
    avatar_url: avatarUrl,
  };
  if (accent) updates.accent = accent;

  const supabase = await createClient();
  const result = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', me.id)
    .select('id');

  if (result.error) return fail(result.error.message);

  revalidatePath('/account');
  revalidatePath('/settings');
  revalidatePath('/plan');
  revalidatePath('/', 'layout');

  return { status: 'success', message: 'Profile & avatar updated.' };
}

/** Logs the current user out and redirects to /welcome. */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/welcome');
}

/**
 * Saves how housemates pay you.
 *
 * Separate fields rather than one free-text box: a housemate reads these to
 * type a transfer, and free text let people omit the sort code or write "same
 * as last time". The shapes are checked so a typo is caught while typing, not
 * when money is already moving.
 *
 * The app still takes no custody of funds and never contacts a bank — this is
 * a typo guard, not a payment integration. A link alone is perfectly valid for
 * anyone who only uses Monzo.me or a Revolut tag.
 */
export async function updatePaymentDetails(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const me = await getCurrentUser();

  const bankName = String(formData.get('bankName') ?? '').trim();
  const link = String(formData.get('paymentLink') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();

  const sortCode = normaliseSortCode(String(formData.get('sortCode') ?? ''));
  if (sortCode === 'invalid') {
    return fail('A sort code is six digits, e.g. 04-00-04.');
  }

  const accountNumber = normaliseAccountNumber(String(formData.get('accountNumber') ?? ''));
  if (accountNumber === 'invalid') {
    return fail('An account number is eight digits.');
  }

  // Half a bank detail is worse than none — a housemate cannot pay with only
  // one of the two, and a partly-filled panel looks usable.
  if ((sortCode === null) !== (accountNumber === null)) {
    return fail('Give both the sort code and the account number, or neither.');
  }

  if (note.length > 300) return fail('Keep the note under 300 characters.');

  const supabase = await createClient();
  const actingAs = await readViewAsId();

  if (actingAs) {
    const { data, error } = await supabase.rpc('demo_update_payment_details', {
      p_target: actingAs,
      p_bank_name: (bankName || null) as string,
      p_sort_code: sortCode as string,
      p_account_number: accountNumber as string,
      p_payment_link: (link || null) as string,
      p_note: (note || null) as string,
    });

    if (error) return fail(`${error.message}${migrationHint(error.code)}`);
    if ((data ?? 0) === 0) return fail('Could not save those details.');
  } else {
    const result = await supabase
      .from('profiles')
      .update({
        payment_bank_name: bankName || null,
        payment_sort_code: sortCode,
        payment_account_number: accountNumber,
        payment_link: link || null,
        payment_details_text: note || null,
      })
      .eq('id', me.id)
      .select('id');

    if (result.error) return fail(`${result.error.message}${migrationHint(result.error.code)}`);
    if ((result.data?.length ?? 0) === 0) return fail('Could not save those details.');
  }

  revalidatePath('/account');
  revalidatePath('/split');

  const hasAny = Boolean(sortCode || link);
  return {
    status: 'success',
    message: hasAny
      ? 'Saved. Housemates will see this when you are the collector.'
      : 'Cleared. Housemates will be told you have no details set.',
  };
}

/** Saves dietary preferences. Same field the Plan tab writes. */
export async function updateDietaryPreferences(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const me = await getCurrentUser();

  const preferences = formData
    .getAll('preference')
    .map((value) => String(value).trim())
    .filter(Boolean);

  const custom = String(formData.get('custom') ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const merged = [...new Set([...preferences, ...custom])];

  const supabase = await createClient();
  const actingAs = await readViewAsId();

  if (actingAs) {
    const { data, error } = await supabase.rpc('demo_update_dietary', {
      p_target: actingAs,
      p_dietary: merged,
    });
    if (error) return fail(`${error.message}${migrationHint(error.code)}`);
    if ((data ?? 0) === 0) return fail('Could not save that dietary profile.');
  } else {
    const result = await supabase
      .from('profiles')
      .update({ dietary_preferences: merged })
      .eq('id', me.id)
      .select('id');

    if (result.error) return fail(result.error.message);
    if ((result.data?.length ?? 0) === 0) return fail('Could not save that dietary profile.');
  }

  revalidatePath('/account');
  revalidatePath('/plan');
  revalidatePath('/settings');
  return { status: 'success', message: 'Dietary profile saved.' };
}

/**
 * Leaves the house.
 */
export async function leaveHouse(): Promise<AccountActionState> {
  const me = await getCurrentUser();
  if (!me.houseId) return fail('You are not in a house.');

  const [house, housemates] = await Promise.all([getHouse(), getHousemates()]);
  const others = housemates.filter((user) => user.id !== me.id);

  if (others.length === 0) {
    return fail(
      'You are the only member. Leaving would orphan the house and everything in it — ' +
        'invite someone first, or simply stop using it.'
    );
  }

  const supabase = await createClient();

  if (house.collectorUserId === me.id) {
    const successor = others.find((user) => user.isAdmin) ?? others[0];
    const handover = await supabase
      .from('houses')
      .update({ collector_user_id: successor.id })
      .eq('id', house.id);
    if (handover.error) return fail(`Could not hand over the collector role: ${handover.error.message}`);
  }

  const result = await supabase
    .from('profiles')
    .update({ house_id: null, is_admin: false })
    .eq('id', me.id);

  if (result.error) return fail(result.error.message);

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

/**
 * Deletes your account.
 */
export async function deleteAccount(alsoDeleteHouse = false): Promise<AccountActionState> {
  const me = await getCurrentUser();
  const supabase = await createClient();

  const splits = await supabase
    .from('splits')
    .select('amount, status, from_user_id, to_user_id')
    .or(`from_user_id.eq.${me.id},to_user_id.eq.${me.id}`)
    .neq('status', 'confirmed');

  if (splits.error) return fail(`Could not check your balances: ${splits.error.message}`);

  const owed = (splits.data ?? []).filter((row) => row.from_user_id === me.id);
  const owing = (splits.data ?? []).filter((row) => row.to_user_id === me.id);

  const shares = await supabase
    .from('expense_shares')
    .select('amount, settled, user_id')
    .eq('user_id', me.id)
    .eq('settled', false);

  if (shares.error) return fail(`Could not check your balances: ${shares.error.message}`);
  const unsettledExpenses = shares.data ?? [];

  const owedTotal =
    owed.reduce((sum, row) => sum + row.amount, 0) +
    unsettledExpenses.reduce((sum, row) => sum + row.amount, 0);
  const owingTotal = owing.reduce((sum, row) => sum + row.amount, 0);

  if (owedTotal > 0 || owingTotal > 0) {
    const parts: string[] = [];
    if (owedTotal > 0) parts.push(`you still owe ${formatPence(owedTotal)}`);
    if (owingTotal > 0) parts.push(`the house still owes you ${formatPence(owingTotal)}`);
    return fail(
      `Settle up first — ${parts.join(' and ')}. Deleting now would wipe those off ` +
        'everybody\u2019s balances, and nobody else would be told.'
    );
  }

  if (me.houseId) {
    const [house, housemates] = await Promise.all([getHouse(), getHousemates()]);
    const others = housemates.filter((user) => user.id !== me.id && !user.isDemo);

    if (others.length === 0) {
      if (!alsoDeleteHouse) {
        return {
          status: 'confirm-house',
          message: `You are the only member of ${house.name}, so it goes too — every recipe, plan, basket, split and pantry item in it.`,
        };
      }

      const { data, error } = await supabase.rpc('delete_house', { p_house_id: house.id });
      if (error) return fail(`Could not delete the house: ${error.message}${migrationHint(error.code)}`);
      if ((data ?? 0) === 0) return fail('That house is not yours to delete.');
    } else if (house.collectorUserId === me.id) {
      const successor = others.find((user) => user.isAdmin) ?? others[0];
      const handover = await supabase
        .from('houses')
        .update({ collector_user_id: successor.id })
        .eq('id', house.id);
      if (handover.error) {
        return fail(`Could not hand the collector role over: ${handover.error.message}`);
      }
    }
  }

  const removed = await supabase.from('profiles').delete().eq('id', me.id).select('id');
  if (removed.error) return fail(removed.error.message);
  if ((removed.data ?? []).length === 0) {
    return fail(
      (await viewAsRefusal('Deleting an account')) ??
        'Nothing was deleted — that account is not yours to remove.'
    );
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
