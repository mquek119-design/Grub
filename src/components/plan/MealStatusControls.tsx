'use client';

import { useState, useActionState } from 'react';
import { Icon } from '@/components/media/Icon';
import { useSubmitState } from '@/components/ui/SubmitButton';
import { clsx } from '@/lib/clsx';
import { bailFromMeal, setMealStatus, takeOverCooking, type PlanActionState } from '@/app/plan/actions';
import { addLeftover, type LeftoverActionState } from '@/app/leftovers/actions';
import { isDayPast } from '@/lib/weeks';
import type { MealStatus, Weekday } from '@/lib/types';

const INITIAL: PlanActionState = { status: 'idle', message: '' };
const LEFTOVER_INITIAL: LeftoverActionState = { status: 'idle', message: '' };

const OPTIONS: { status: MealStatus; label: string; icon: string }[] = [
  { status: 'cooked', label: 'Cooked it', icon: 'skillet' },
  { status: 'swapped', label: 'Made something else', icon: 'swap_horiz' },
  { status: 'skipped', label: "Didn't happen", icon: 'block' },
];

function StatusButton({
  option,
  active,
}: {
  option: (typeof OPTIONS)[number];
  active: boolean;
}) {
  const value = active ? 'planned' : option.status;
  const { pending, thisOne } = useSubmitState('status', value);

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={pending}
      aria-pressed={active}
      className={clsx(
        'flex items-center gap-xs px-md py-2 rounded-full border text-[13px] font-semibold transition-all disabled:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active
          ? 'border-primary bg-primary/10 text-primary shadow-2xs font-bold'
          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
      )}
    >
      <Icon
        name={thisOne ? 'progress_activity' : option.icon}
        className={clsx('text-[16px]', thisOne && 'animate-spin')}
      />
      {option.label}
    </button>
  );
}

function BailButton({ bailed }: { bailed: boolean }) {
  const { pending } = useSubmitState();

  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        'flex items-center gap-xs px-md py-2 rounded-full border text-[13px] font-semibold transition-all disabled:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        bailed
          ? 'border-secondary bg-secondary-fixed/40 text-secondary font-bold'
          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
      )}
    >
      <Icon
        name={pending ? 'progress_activity' : bailed ? 'undo' : 'person_off'}
        className={clsx('text-[16px]', pending && 'animate-spin')}
      />
      {bailed ? "I'm back in" : "I'm out"}
    </button>
  );
}

function QuickLeftoverForm({
  defaultDescription,
  onClose,
}: {
  defaultDescription: string;
  onClose: () => void;
}) {
  const [state, action] = useActionState(addLeftover, LEFTOVER_INITIAL);
  const [portions, setPortions] = useState(2);
  const [days, setDays] = useState(3);
  const { pending } = useSubmitState();

  return (
    <form action={action} className="flex flex-col gap-sm p-md rounded-xl bg-surface-container-low border border-primary/20 animate-fade-in-up mt-xs">
      <div className="flex items-center justify-between gap-sm">
        <span className="font-title-md text-sm font-bold text-on-surface flex items-center gap-xs">
          <Icon name="soup_kitchen" className="text-primary text-[18px]" />
          Add Extra Portions to Leftovers Board
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-md"
          aria-label="Close"
        >
          <Icon name="close" className="text-sm" />
        </button>
      </div>

      <div className="flex flex-col gap-xs">
        <label htmlFor="leftover-description" className="font-label-caps text-[11px] text-on-surface-variant font-semibold uppercase">
          Description
        </label>
        <input
          id="leftover-description"
          type="text"
          name="description"
          defaultValue={defaultDescription}
          required
          maxLength={80}
          className="px-sm py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex items-center justify-between gap-md flex-wrap">
        <div className="flex flex-col gap-xs">
          <span className="font-label-caps text-[11px] text-on-surface-variant font-semibold uppercase">
            Portions
          </span>
          <div className="flex items-center gap-xs">
            <input type="hidden" name="portions" value={portions} />
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPortions(num)}
                className={clsx(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  portions === num
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-xs">
          <span className="font-label-caps text-[11px] text-on-surface-variant font-semibold uppercase">
            Eat by
          </span>
          <div className="flex items-center gap-xs">
            <input type="hidden" name="days" value={days} />
            {[2, 3, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={clsx(
                  'px-sm py-1 rounded-lg text-xs font-bold transition-colors',
                  days === d
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                )}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.message && (
        <p
          role="status"
          className={clsx(
            'font-body-sm text-xs font-semibold',
            state.status === 'error' ? 'text-error' : 'text-primary'
          )}
        >
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-xs mt-xs">
        <button
          type="button"
          onClick={onClose}
          className="px-sm py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-md py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-xs"
        >
          <Icon name={pending ? 'progress_activity' : 'add'} className={clsx('text-sm', pending && 'animate-spin')} />
          Put on Board
        </button>
      </div>
    </form>
  );
}

export function MealStatusControls({
  mealId,
  recipeTitle = 'Leftovers',
  status,
  bailed,
  day,
  weekStartDate,
  isCook = false,
  otherDinersBailed = [],
  cookBailed = false,
}: {
  mealId: string;
  recipeTitle?: string;
  status: MealStatus;
  bailed: boolean;
  day: Weekday;
  weekStartDate: string;
  isCook?: boolean;
  otherDinersBailed?: { userId: string; name: string }[];
  cookBailed?: boolean;
}) {
  const [statusState, statusAction] = useActionState(setMealStatus, INITIAL);
  const [bailState, bailAction] = useActionState(bailFromMeal, INITIAL);
  const [takeoverState, takeoverAction] = useActionState(takeOverCooking, INITIAL);
  const [showLeftoverForm, setShowLeftoverForm] = useState(false);

  const error = [statusState, bailState, takeoverState].find((state) => state.status === 'error');
  const dayIsPast = isDayPast(weekStartDate, day);

  if (!dayIsPast) {
    return null;
  }

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex flex-wrap gap-xs items-center">
        <span className="font-label-caps text-[11px] text-on-surface-variant font-semibold uppercase mr-1">
          Meal:
        </span>
        {OPTIONS.map((option) => (
          <form key={option.status} action={statusAction}>
            <input type="hidden" name="mealId" value={mealId} />
            <StatusButton option={option} active={status === option.status} />
          </form>
        ))}
      </div>

      <div className="flex flex-wrap gap-xs items-center pt-1">
        <span className="font-label-caps text-[11px] text-on-surface-variant font-semibold uppercase mr-1">
          You:
        </span>
        <form action={bailAction}>
          <input type="hidden" name="mealId" value={mealId} />
          <input type="hidden" name="undo" value={bailed ? 'true' : 'false'} />
          <BailButton bailed={bailed} />
        </form>

        {status !== 'skipped' && (status === 'cooked' || bailed || otherDinersBailed.length > 0) && (
          <button
            type="button"
            onClick={() => setShowLeftoverForm((prev) => !prev)}
            className="flex items-center gap-xs px-md py-2 rounded-full border border-primary/40 bg-primary/5 text-primary text-[13px] font-semibold hover:bg-primary/10 transition-colors"
          >
            <Icon name="soup_kitchen" className="text-[16px]" />
            + Put cooked portions in Leftovers
          </button>
        )}
      </div>

      {showLeftoverForm && (
        <QuickLeftoverForm
          defaultDescription={recipeTitle}
          onClose={() => setShowLeftoverForm(false)}
        />
      )}

      {/* Clarifying Helper Text */}
      {status === 'skipped' && (
        <p className="font-body-sm text-[12px] text-amber-800 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-center gap-xs">
          <Icon name="block" className="text-amber-700 text-sm shrink-0" />
          <span>Entire meal was skipped — raw ingredients remain in the fridge for anyone to use.</span>
        </p>
      )}

      {bailed && (
        <p className="font-body-sm text-[12px] text-on-surface-variant bg-surface-container-low p-2 rounded-lg border border-outline-variant/30 flex items-center gap-xs">
          <Icon name="person_off" className="text-secondary text-sm shrink-0" />
          <span>You opted out of eating — your paid share stays in the fridge for you. Nobody else&apos;s split moves.</span>
        </p>
      )}

      {cookBailed && !isCook && (
        <div className="flex items-center justify-between gap-sm p-sm rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800">
          <div className="flex items-center gap-xs text-[12px]">
            <Icon name="warning" className="text-amber-600 shrink-0 text-base" />
            <span>The cook is out! Volunteer to take over cooking for tonight.</span>
          </div>
          <form action={takeoverAction}>
            <input type="hidden" name="mealId" value={mealId} />
            <button
              type="submit"
              className="px-sm py-1 rounded bg-amber-600 text-white font-bold text-[11px] uppercase tracking-wider hover:bg-amber-700 transition-colors shrink-0"
            >
              Take Over Cooking
            </button>
          </form>
        </div>
      )}

      {otherDinersBailed.length > 0 && (
        <div className="flex items-center gap-xs p-xs px-sm rounded-lg bg-secondary-fixed/30 border border-secondary-container/30 text-[12px] text-secondary">
          <Icon name="info" className="text-base shrink-0" />
          <span>
            {otherDinersBailed.map((d) => d.name).join(', ')}{' '}
            {otherDinersBailed.length === 1 ? 'has' : 'have'} bailed — extra portion available in fridge!
          </span>
        </div>
      )}

      {error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {error.message}
        </p>
      )}
    </div>
  );
}

