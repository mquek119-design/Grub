'use client';

import { useEffect, useMemo, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Avatar } from '@/components/avatars/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { useToast } from '@/components/ui/Toast';
import { clsx } from '@/lib/clsx';
import {
  addLeftover,
  clearLeftover,
  type LeftoverActionState,
} from '@/app/leftovers/actions';
import type { Leftover, User } from '@/lib/types';

/**
 * A note on the fridge door, not inventory.
 *
 * No cost, no allocation, no claim history. The food was paid for by whoever
 * cooked it and offering it round is a gift — the moment this feature starts
 * tracking who owes whom for a bowl of chilli it has ruined the thing it was
 * for. Taking a portion only reduces the count.
 */

const INITIAL: LeftoverActionState = { status: 'idle', message: '' };

const SHELF_LIVES = [
  { days: 2, label: '2 days' },
  { days: 3, label: '3 days' },
  { days: 5, label: '5 days' },
];

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" icon="add" pending={pending} className="shrink-0">
      Add
    </Button>
  );
}

function countdown(daysLeft: number): { label: string; tone: 'ok' | 'soon' | 'gone' } {
  if (daysLeft < 0) return { label: 'Past its date', tone: 'gone' };
  if (daysLeft === 0) return { label: 'Eat today', tone: 'soon' };
  if (daysLeft === 1) return { label: 'Eat by tomorrow', tone: 'soon' };
  return { label: `${daysLeft} days left`, tone: 'ok' };
}

function LeftoverRow({ leftover, cook }: { leftover: Leftover; cook: User | undefined }) {
  const [state, action] = useActionState(clearLeftover, INITIAL);
  const { toast } = useToast();
  const { label, tone } = countdown(leftover.daysLeft);

  useEffect(() => {
    if (state.status === 'success') toast(state.message);
  }, [state, toast]);

  return (
    <li
      className={clsx(
        'py-sm flex items-center justify-between gap-sm',
        tone === 'gone' && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-sm min-w-0">
        {cook && <Avatar user={cook} size="sm" />}
        <div className="min-w-0">
          <p className="font-body-lg text-body-lg font-semibold truncate">
            {leftover.description}
          </p>
          <p className="font-body-sm text-[12px] text-on-surface-variant">
            Feeds {leftover.portions} · made {leftover.madeOn} ·{' '}
            <span
              className={clsx(
                'font-semibold',
                tone === 'gone' ? 'text-error' : tone === 'soon' ? 'text-secondary' : 'text-primary'
              )}
            >
              {label}
            </span>
          </p>
        </div>
      </div>

      <form action={action} className="shrink-0">
        <input type="hidden" name="leftoverId" value={leftover.id} />
        <SubmitButton variant="outline" size="sm">
          {tone === 'gone' ? 'Bin it' : 'Take a portion'}
        </SubmitButton>
      </form>
    </li>
  );
}

export function LeftoversBoard({
  leftovers,
  housemates,
}: {
  leftovers: Leftover[];
  housemates: User[];
}) {
  const [state, action] = useActionState(addLeftover, INITIAL);
  // Memoize housemates lookup Map to avoid recreation on every render
  const byId = useMemo(() => new Map(housemates.map((user) => [user.id, user])), [housemates]);

  return (
    <Card className="flex flex-col gap-sm">
      <div className="min-w-0">
        <h2 className="font-title-md text-title-md">On the fridge</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Cooked too much? Add the spare portions here. Taking food reduces the count, and
          nobody owes anybody for it.
        </p>
      </div>

      {leftovers.length > 0 ? (
        <ul className="flex flex-col divide-y divide-surface-container-highest">
          {leftovers.map((leftover) => (
            <LeftoverRow
              key={leftover.id}
              leftover={leftover}
              cook={byId.get(leftover.createdBy)}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg bg-surface-container-low px-md py-lg text-center">
          <p className="font-body-lg text-body-lg font-semibold">The fridge board is clear</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Add anything worth saving from the bin.
          </p>
        </div>
      )}

      <form action={action} className="flex flex-col gap-sm">
        <div className="flex flex-wrap gap-sm">
          <input
            name="description"
            required
            maxLength={80}
            placeholder="Chilli"
            className="flex-1 min-w-[8rem] h-11 px-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-body-lg"
          />
          <label className="flex items-center gap-xs">
            <span className="sr-only">Portions</span>
            <input
              name="portions"
              type="number"
              min={1}
              max={20}
              defaultValue={2}
              aria-label="Portions"
              className="w-16 h-11 px-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary font-numeric-data text-center"
            />
            <span className="font-body-sm text-[13px] text-on-surface-variant">portions</span>
          </label>
          <select
            name="days"
            defaultValue={3}
            aria-label="Eat within"
            className="h-11 pl-2 pr-6 rounded-lg bg-surface-container-low border-none text-[13px] font-semibold text-on-surface-variant focus:ring-2 focus:ring-primary"
          >
            {SHELF_LIVES.map((option) => (
              <option key={option.days} value={option.days}>
                Eat within {option.label}
              </option>
            ))}
          </select>
          <AddButton />
        </div>

        {state.status !== 'idle' && (
          <p
            role="status"
            className={clsx(
              'font-body-sm text-body-sm',
              state.status === 'error' ? 'text-error' : 'text-primary'
            )}
          >
            {state.message}
          </p>
        )}
      </form>
    </Card>
  );
}
