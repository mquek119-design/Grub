'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { Stocky } from '@/components/mascot/Stocky';
import { formatPence } from '@/lib/money';
import { switchMeal, proposeOverlapMerge, cancelOverlapProposal, type PlanActionState } from '@/app/plan/actions';
import type { PlanOverlap, PlannedMeal } from '@/lib/types';
import type { WeekChoice } from '@/lib/weeks';
import { MEAL_TYPE_LABELS, WEEKDAY_LABELS } from '@/lib/types';

function CancelProposalButton({ mealId }: { mealId: string }) {
  const [state, formAction, isPending] = useActionState<PlanActionState, FormData>(
    cancelOverlapProposal,
    { status: 'idle', message: '' }
  );

  return (
    <form action={formAction} className="inline-flex items-center">
      <input type="hidden" name="mealId" value={mealId} />
      <button
        type="submit"
        disabled={isPending}
        className="px-2 py-0.5 text-[11px] font-semibold rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
        title="Withdraw proposal"
      >
        {isPending ? 'Cancelling…' : 'Cancel'}
      </button>
      {state.status === 'error' && state.message && (
        <span className="text-[11px] text-error font-medium">{state.message}</span>
      )}
    </form>
  );
}

function ProposeShareButton({
  myMealId,
  targetMealId,
  targetUserId,
  targetRecipeId,
}: {
  myMealId: string;
  targetMealId?: string;
  targetUserId: string;
  targetRecipeId: string;
}) {
  const [state, formAction, isPending] = useActionState<PlanActionState, FormData>(
    proposeOverlapMerge,
    { status: 'idle', message: '' }
  );

  return (
    <form action={formAction} className="inline-flex items-center gap-1">
      <input type="hidden" name="myMealId" value={myMealId} />
      <input type="hidden" name="targetMealId" value={targetMealId ?? ''} />
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <input type="hidden" name="targetRecipeId" value={targetRecipeId} />
      <button
        type="submit"
        disabled={isPending}
        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-secondary text-on-secondary-container hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
        title="Propose sharing this recipe to pool ingredients (both parties must agree)"
      >
        <Icon name="handshake" className="text-[14px]" />
        <span>{isPending ? 'Proposing…' : 'Propose to share'}</span>
      </button>
      {state.status === 'error' && state.message && (
        <span className="text-[11px] text-error font-medium">{state.message}</span>
      )}
    </form>
  );
}

function SwitchMealButton({
  oldMealId,
  newRecipeId,
  day,
  mealType,
  week,
}: {
  oldMealId: string;
  newRecipeId: string;
  day: string;
  mealType: string;
  week: string;
}) {
  const [state, formAction, isPending] = useActionState<PlanActionState, FormData>(switchMeal, {
    status: 'idle',
    message: '',
  });

  return (
    <form action={formAction} className="inline-flex items-center gap-1">
      <input type="hidden" name="oldMealId" value={oldMealId} />
      <input type="hidden" name="newRecipeId" value={newRecipeId} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="mealType" value={mealType} />
      <input type="hidden" name="week" value={week} />
      <button
        type="submit"
        disabled={isPending}
        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-secondary text-on-secondary-container hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
        title="Switch your meal to this recipe to share ingredients with flatmates"
      >
        <Icon name="swap_horiz" className="text-[14px]" />
        <span>{isPending ? 'Switching…' : 'Cook this'}</span>
      </button>
      {state.status === 'error' && state.message && (
        <span className="text-[11px] text-error font-medium">{state.message}</span>
      )}
    </form>
  );
}

/**
 * "You could cook different things from the same shopping."
 *
 * Framed as an offer and toned as one — see `overlaps.ts` for why this replaced
 * a red "Conflict Detected" panel. The saving is last and small on purpose: the
 * useful part is the recipe, not a number that makes someone feel billed for
 * wanting a curry. Nothing here blocks anything.
 */
export function OverlapHints({
  overlaps,
  currentUserId,
  planMeals = [],
  week = 'this',
}: {
  overlaps: PlanOverlap[];
  currentUserId?: string;
  planMeals?: PlannedMeal[];
  week?: WeekChoice;
}) {
  if (overlaps.length === 0) return null;

  return (
    <div className="flex flex-col gap-sm">
      {overlaps.map((overlap) => {
        const isUserCookingSeparately = currentUserId ? overlap.userIds.includes(currentUserId) : false;
        const myMeal = isUserCookingSeparately
          ? planMeals.find(
              (m) =>
                m.day === overlap.day &&
                m.mealType === overlap.mealType &&
                m.participants.some((p) => p.userId === currentUserId && !p.optedOut)
            )
          : undefined;

        const otherMeal = planMeals.find(
          (m) =>
            m.day === overlap.day &&
            m.mealType === overlap.mealType &&
            m.id !== myMeal?.id
        );
        const otherCookId = otherMeal?.cookedByUserId ?? overlap.userIds.find((id) => id !== currentUserId);

        return (
          <div
            key={`${overlap.day}-${overlap.mealType}`}
            className="flex flex-col gap-sm p-md rounded-lg bg-secondary-fixed/40 border border-secondary-container/40"
          >
            <div className="flex items-start gap-sm">
              <Stocky mood="cooking" size="sm" className="shrink-0 mt-0.5" />
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="font-semibold text-on-surface">
                  {WEEKDAY_LABELS[overlap.day]} {MEAL_TYPE_LABELS[overlap.mealType].toLowerCase()}:
                  shop once, cook separately.
                </strong>{' '}
                {overlap.message} These would use what is already going in the basket:
              </p>
            </div>

            <ul className="flex flex-col gap-xs">
              {overlap.suggestions.map((suggestion) => (
                <li
                  key={suggestion.recipeId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-sm px-3 py-2.5 sm:px-md sm:py-sm rounded-lg bg-surface-container-lowest border border-surface-container-highest hover:border-secondary-container transition-colors"
                >
                  <Link
                    href={`/recipes/${suggestion.recipeId}?day=${overlap.day}&mealType=${overlap.mealType}&week=${week}`}
                    className="min-w-0 flex-1 hover:opacity-90 transition-opacity"
                  >
                    <span className="font-body-md sm:font-body-lg font-semibold block line-clamp-2 leading-snug">
                      {suggestion.title}
                    </span>
                    <span className="font-body-sm text-[11.5px] sm:text-[12px] text-on-surface-variant">
                      Shares {suggestion.shares.join(', ')}
                    </span>
                  </Link>

                  <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto pt-1 sm:pt-0">
                    {myMeal && otherCookId && (
                      myMeal.proposalCreatedBy === currentUserId &&
                      myMeal.proposalToUserId === otherCookId &&
                      myMeal.proposalRecipeId === suggestion.recipeId ? (
                        <div className="flex items-center gap-1.5 bg-secondary-container/40 border border-secondary/30 rounded-md px-2 py-0.5">
                          <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                            <Icon name="schedule" className="text-[13px]" />
                            <span>Proposed</span>
                          </span>
                          <CancelProposalButton mealId={myMeal.id} />
                        </div>
                      ) : (
                        <ProposeShareButton
                          myMealId={myMeal.id}
                          targetMealId={otherMeal?.id}
                          targetUserId={otherCookId}
                          targetRecipeId={suggestion.recipeId}
                        />
                      )
                    )}
                    {myMeal && !otherCookId && (
                      <SwitchMealButton
                        oldMealId={myMeal.id}
                        newRecipeId={suggestion.recipeId}
                        day={overlap.day}
                        mealType={overlap.mealType}
                        week={week}
                      />
                    )}
                    <Link
                      href={`/recipes/${suggestion.recipeId}?day=${overlap.day}&mealType=${overlap.mealType}&week=${week}`}
                      className="text-on-surface-variant hover:text-on-surface p-1 rounded"
                      aria-label={`View recipe for ${suggestion.title}`}
                    >
                      <Icon name="chevron_right" className="text-[18px]" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <p className="font-body-sm text-[12px] text-on-surface-variant">
              Nobody has to change anything — cooking what you fancy is the point.{' '}
              {overlap.missedSaving > 0 ? (
                <>
                  Buying the same ingredients twice costs the house about{' '}
                  <span className="font-numeric-data font-semibold text-on-surface">
                    {formatPence(overlap.missedSaving)}
                  </span>.
                </>
              ) : (
                <>Sharing ingredients reduces duplicate multi-packs and cuts down on food waste.</>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
