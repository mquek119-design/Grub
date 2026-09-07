'use client';

import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';
import type { PlanStatus } from '@/lib/types';

interface SplitStepperProps {
  status: PlanStatus;
}

const STEPS: { id: PlanStatus | 'settled'; label: string; icon: string }[] = [
  { id: 'planning', label: '1. Planning', icon: 'edit_calendar' },
  { id: 'ordered', label: '2. Ordered', icon: 'local_shipping' },
  { id: 'delivered', label: '3. Reconciled', icon: 'fact_check' },
];

export function SplitStepper({ status }: SplitStepperProps) {
  const currentIndex =
    status === 'delivered' ? 2 : status === 'ordered' || status === 'locked' ? 1 : 0;

  return (
    <div className="w-full bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-sm md:p-md shadow-sm mb-md">
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-xs">
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-2 flex-1 min-w-[120px]">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all',
                  isComplete
                    ? 'bg-primary text-on-primary'
                    : isCurrent
                    ? 'bg-primary-container text-on-primary-container ring-2 ring-primary ring-offset-2'
                    : 'bg-surface-container text-on-surface-variant'
                )}
              >
                {isComplete ? <Icon name="check" className="text-sm" /> : <Icon name={step.icon} className="text-sm" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={clsx(
                    'font-title-sm text-xs md:text-sm font-semibold truncate',
                    isCurrent ? 'text-primary font-bold' : isComplete ? 'text-on-surface' : 'text-on-surface-variant'
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[11px] text-on-surface-variant truncate">
                  {isComplete ? 'Done' : isCurrent ? 'Active stage' : 'Pending'}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={clsx(
                    'hidden sm:block h-0.5 flex-1 min-w-[1rem] rounded',
                    isComplete ? 'bg-primary' : 'bg-surface-container-highest'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
