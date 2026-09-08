'use client';

import { Icon } from '@/components/media/Icon';
import type { PlanStatus } from '@/lib/types';

interface SplitStepperProps {
  status: PlanStatus;
}

const STAGES = [
  {
    id: 'planning',
    stepNumber: '1',
    label: 'Planning',
    icon: 'edit_calendar',
    flag: 'Live estimate',
  },
  {
    id: 'ordered',
    stepNumber: '2',
    label: 'Ordered',
    icon: 'local_shipping',
    flag: 'Shop placed',
  },
  {
    id: 'delivered',
    stepNumber: '3',
    label: 'Reconciled',
    icon: 'fact_check',
    flag: 'Delivery checked',
  },
] as const;

export function SplitStepper({ status }: SplitStepperProps) {
  const currentIndex =
    status === 'delivered' ? 2 : status === 'ordered' || status === 'locked' ? 1 : 0;

  const currentStage = STAGES[currentIndex];
  const nextStage = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null;

  return (
    <div className="w-full bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-sm md:px-md md:py-sm shadow-sm mb-md">
      <div className="flex items-center justify-between gap-3 py-0.5">
        {/* Active stage details */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container ring-2 ring-primary ring-offset-2 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            <Icon name={currentStage.icon} className="text-base text-primary" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-title-sm text-sm font-bold text-primary truncate">
              {currentStage.stepNumber}. {currentStage.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed/40 text-primary shrink-0">
              {currentStage.flag}
            </span>
          </div>
        </div>

        {/* Arrow to next stage icon if progressing */}
        {nextStage && (
          <div className="flex items-center gap-2 shrink-0">
            <Icon name="arrow_forward" className="text-base text-on-surface-variant/60" />
            <div
              title={`Next: ${nextStage.label}`}
              className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity border border-surface-container-highest"
            >
              <Icon name={nextStage.icon} className="text-base" />
            </div>
          </div>
        )}

        {/* Final stage indicator */}
        {!nextStage && (
          <div className="flex items-center gap-1.5 shrink-0 text-secondary">
            <Icon name="verified" filled className="text-lg" />
            <span className="text-xs font-semibold text-secondary">All settled</span>
          </div>
        )}
      </div>
    </div>
  );
}
