'use client';

import { useState, useTransition } from 'react';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { Stocky } from '@/components/mascot/Stocky';
import { formatPence } from '@/lib/money';
import { buildBasket, type BasketActionState } from '@/app/basket/actions';

import { clsx } from '@/lib/clsx';

/**
 * Rebuilds the basket from the plan.
 *
 * The basket is derived, not authored: regenerating discards manual edits, so
 * when one already exists the button asks first rather than silently wiping
 * the collector's adjustments.
 */
export function BuildBasketPanel({
  hasBasket,
  mealCount,
  overlapSavings,
  variant = 'banner',
}: {
  hasBasket: boolean;
  mealCount: number;
  overlapSavings: number;
  variant?: 'banner' | 'card';
}) {
  const [state, setState] = useState<BasketActionState>({ status: 'idle', message: '' });
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    setConfirming(false);
    startTransition(async () => setState(await buildBasket()));
  }

  if (variant === 'banner' && hasBasket) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm p-3.5 sm:px-4 sm:py-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Stocky mood="smug" size="sm" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-title-md text-[13.5px] font-bold text-on-surface">Plan Synced</span>
              {mealCount > 0 && (
                <span className="font-body-sm text-[11px] text-on-surface-variant font-medium">
                  ({mealCount} meals)
                </span>
              )}
            </div>
            <p className="font-body-sm text-[11.5px] text-on-surface-variant truncate">
              Shared ingredients pooled automatically across housemates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          {overlapSavings > 0 && (
            <div className="bg-primary/10 text-primary border border-primary/20 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shrink-0">
              <span className="font-label-caps text-[9px] uppercase font-bold tracking-wider">Pooled Savings</span>
              <span className="font-numeric-data text-xs font-bold">{formatPence(overlapSavings)}</span>
            </div>
          )}

          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={run}
                disabled={pending}
                className="px-2.5 py-1 rounded-lg bg-error text-on-error text-[11px] font-semibold hover:opacity-90 transition-opacity"
              >
                {pending ? 'Re-syncing…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-2 py-1 rounded-lg border border-outline-variant/60 text-on-surface-variant text-[11px] font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={pending || mealCount === 0}
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container text-on-surface text-[12px] font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Icon name={pending ? 'progress_activity' : 'sync'} className={clsx('text-[14px]', pending && 'animate-spin')} />
              <span>{pending ? 'Syncing…' : 'Re-sync plan'}</span>
            </button>
          )}
        </div>

        {state.message && (
          <p
            role="status"
            className={`font-body-sm text-xs w-full mt-1 ${
              state.status === 'error' ? 'text-error' : 'text-primary'
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card accent={state.status === 'error' ? 'error' : 'primary'} className="flex flex-col gap-sm shadow-xs border border-outline-variant/40">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="font-title-md text-title-md font-bold text-on-surface">
            {hasBasket ? 'Plan Sync & Pooling' : 'Build the basket'}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
            {mealCount === 0
              ? 'Plan some meals first in the Plan tab.'
              : `Synced with ${mealCount} planned meal${mealCount === 1 ? '' : 's'}. Shared ingredients are pooled automatically.`}
          </p>
        </div>
        {overlapSavings > 0 && (
          <div className="flex items-center gap-2 shrink-0 bg-primary/10 px-sm py-xs rounded-xl border border-primary/20">
            <Stocky mood="smug" size="sm" />
            <div className="text-right">
              <span className="block font-label-caps text-[10px] uppercase font-bold text-primary tracking-wider">
                Saved pooling
              </span>
              <span className="block font-numeric-data text-body-lg font-bold text-primary">
                {formatPence(overlapSavings)}
              </span>
            </div>
          </div>
        )}
      </div>

      {confirming ? (
        <div className="flex flex-col gap-sm pt-xs border-t border-outline-variant/30">
          <p className="font-body-sm text-xs text-on-surface-variant">
            This re-optimizes from the meal plan. Any manual quantity edits you made in the basket will be reset.
          </p>
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={run}
              className="flex-1 h-10 rounded-xl bg-error text-on-error text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Confirm re-sync
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 h-10 rounded-xl border border-outline-variant/60 text-on-surface-variant text-xs font-semibold hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending || mealCount === 0}
          onClick={() => (hasBasket ? setConfirming(true) : run())}
          className={
            hasBasket
              ? 'w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-on-surface font-semibold text-xs flex items-center justify-center gap-xs transition-colors disabled:opacity-50 mt-xs shadow-xs'
              : 'w-full h-12 rounded-xl bg-secondary text-on-secondary-container font-title-md text-title-md flex items-center justify-center gap-sm hover:shadow-md transition-all font-bold disabled:opacity-50 mt-xs'
          }
        >
          <Icon name={pending ? 'progress_activity' : 'sync'} className={pending ? 'animate-spin' : undefined} />
          {pending ? 'Optimising…' : hasBasket ? 'Re-sync basket from plan' : 'Build basket from plan'}
        </button>
      )}

      {state.message && (
        <p
          role="status"
          className={`font-body-sm text-body-sm ${
            state.status === 'error' ? 'text-error' : 'text-primary'
          }`}
        >
          {state.message}
        </p>
      )}
    </Card>
  );
}
