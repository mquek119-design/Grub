'use client';

import { useState, useTransition } from 'react';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { Stocky } from '@/components/mascot/Stocky';
import { formatPence } from '@/lib/money';
import { buildBasket, type BasketActionState } from '@/app/basket/actions';

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
}: {
  hasBasket: boolean;
  mealCount: number;
  overlapSavings: number;
}) {
  const [state, setState] = useState<BasketActionState>({ status: 'idle', message: '' });
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    setConfirming(false);
    startTransition(async () => setState(await buildBasket()));
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
              : `Synced with ${mealCount} planned meal${mealCount === 1 ? '' : 's'}. Shared ingredients are pooled automatically to minimize cost.`}
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
