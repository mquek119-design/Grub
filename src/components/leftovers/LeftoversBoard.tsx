'use client';

import { useEffect, useMemo, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Avatar } from '@/components/avatars/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Icon } from '@/components/media/Icon';
import { useToast } from '@/components/ui/Toast';
import { clsx } from '@/lib/clsx';
import {
  addLeftover,
  clearLeftover,
  type LeftoverActionState,
} from '@/app/leftovers/actions';
import type { Leftover, User } from '@/lib/types';

const INITIAL: LeftoverActionState = { status: 'idle', message: '' };

const SHELF_LIVES = [
  { days: 2, label: '2 days' },
  { days: 3, label: '3 days' },
  { days: 5, label: '5 days' },
];

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" icon="add" pending={pending} className="w-full sm:w-auto">
      Post Leftover
    </Button>
  );
}

function countdown(daysLeft: number): { label: string; tone: 'ok' | 'soon' | 'gone' } {
  if (daysLeft < 0) return { label: 'Past date', tone: 'gone' };
  if (daysLeft === 0) return { label: 'Eat today', tone: 'soon' };
  if (daysLeft === 1) return { label: 'Eat tomorrow', tone: 'soon' };
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
        'p-md rounded-xl bg-surface-container-lowest border border-surface-container-highest flex flex-col sm:flex-row sm:items-center justify-between gap-md transition-all hover:border-outline-variant/60',
        tone === 'gone' && 'opacity-60 bg-surface-container-low'
      )}
    >
      <div className="flex items-center gap-md min-w-0">
        <div className="relative shrink-0">
          {cook ? (
            <Avatar user={cook} size="md" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
              <Icon name="kitchen" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-xs flex-wrap">
            <span className="font-title-md text-title-md text-on-surface font-semibold truncate">
              {leftover.description}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
              {leftover.portions} portion{leftover.portions === 1 ? '' : 's'}
            </span>
          </div>
          <p className="font-body-sm text-[12px] text-on-surface-variant flex items-center gap-xs">
            <span>Made {leftover.madeOn}</span>
            <span aria-hidden="true">•</span>
            <span
              className={clsx(
                'font-semibold flex items-center gap-0.5',
                tone === 'gone' ? 'text-error' : tone === 'soon' ? 'text-secondary' : 'text-primary'
              )}
            >
              <Icon
                name={tone === 'gone' ? 'warning' : tone === 'soon' ? 'schedule' : 'timer'}
                className="text-[14px]"
              />
              {label}
            </span>
          </p>
        </div>
      </div>

      <form action={action} className="shrink-0 self-end sm:self-center">
        <input type="hidden" name="leftoverId" value={leftover.id} />
        <SubmitButton variant={tone === 'gone' ? 'danger' : 'outline'} size="sm">
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
  const byId = useMemo(() => new Map(housemates.map((user) => [user.id, user])), [housemates]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
      {/* Left Column: Fridge Board Items */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-md min-w-0">
        <Card className="flex flex-col gap-md">
          <div className="flex items-center justify-between gap-md border-b border-surface-container-highest pb-md">
            <div>
              <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs">
                <Icon name="kitchen" className="text-primary text-lg" />
                On the Fridge Board
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Spare meals available for anyone in the house to claim.
              </p>
            </div>
            <span className="px-sm py-xs bg-primary-container text-on-primary-container text-xs font-bold rounded-full shrink-0">
              {leftovers.length} Available
            </span>
          </div>

          {leftovers.length > 0 ? (
            <ul className="flex flex-col gap-sm">
              {leftovers.map((leftover) => (
                <LeftoverRow
                  key={leftover.id}
                  leftover={leftover}
                  cook={byId.get(leftover.createdBy)}
                />
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-surface-container-low px-md py-xl text-center flex flex-col items-center gap-xs">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant mb-xs">
                <Icon name="set_meal" className="text-2xl" />
              </div>
              <p className="font-title-md text-title-md text-on-surface">The fridge board is clear</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                Got extra portions from dinner? Post them here before they disappear at the back of shelf two.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Right Column: Share Form & Etiquette */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-lg lg:sticky lg:top-[90px]">
        <Card accent="primary" className="flex flex-col gap-md">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs">
              <Icon name="add_circle" className="text-primary" />
              Share Leftovers
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Post spare portions for the house to grab.
            </p>
          </div>

          <form action={action} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label htmlFor="leftover-desc" className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                What did you cook?
              </label>
              <input
                id="leftover-desc"
                name="description"
                required
                maxLength={80}
                placeholder="e.g. Chilli Con Carne, Pasta Bake"
                className="w-full h-11 px-sm rounded-lg bg-surface-container-low border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none text-body-lg text-on-surface"
              />
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <div className="flex flex-col gap-xs">
                <label htmlFor="leftover-portions" className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Portions
                </label>
                <input
                  id="leftover-portions"
                  name="portions"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={2}
                  className="w-full h-11 px-sm rounded-lg bg-surface-container-low border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none font-numeric-data text-body-lg text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label htmlFor="leftover-days" className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Best Within
                </label>
                <select
                  id="leftover-days"
                  name="days"
                  defaultValue={3}
                  className="w-full h-11 px-xs rounded-lg bg-surface-container-low border border-surface-container-highest text-base sm:text-body-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {SHELF_LIVES.map((option) => (
                    <option key={option.days} value={option.days}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <AddButton />

            {state.status !== 'idle' && (
              <p
                role="status"
                className={clsx(
                  'font-body-sm text-body-sm p-xs rounded-lg text-center',
                  state.status === 'error' ? 'bg-error-container/40 text-error' : 'bg-primary-container/40 text-primary'
                )}
              >
                {state.message}
              </p>
            )}
          </form>
        </Card>

        {/* Fridge Etiquette Card */}
        <Card className="flex flex-col gap-sm bg-surface-container-low/60 border-dashed">
          <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-xs">
            <Icon name="eco" className="text-primary text-sm" />
            House Rules for Leftovers
          </h3>
          <ul className="space-y-xs text-body-sm text-on-surface-variant">
            <li className="flex items-start gap-xs">
              <Icon name="check" className="text-primary text-xs mt-1 shrink-0" />
              <span>Leftovers on this board are <strong>100% free</strong> to take — no debt or tracking.</span>
            </li>
            <li className="flex items-start gap-xs">
              <Icon name="check" className="text-primary text-xs mt-1 shrink-0" />
              <span>Taking a portion reduces the remaining count automatically.</span>
            </li>
            <li className="flex items-start gap-xs">
              <Icon name="check" className="text-primary text-xs mt-1 shrink-0" />
              <span>Always mark meals that have passed their safe date as binned.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
