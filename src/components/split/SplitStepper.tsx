'use client';

import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';
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
    desc: 'Basket moves as house picks meals. Free to join or change.',
  },
  {
    id: 'ordered',
    stepNumber: '2',
    label: 'Delivery & Checking',
    icon: 'local_shipping',
    flag: 'Shop placed',
    desc: 'Order confirmed with Tesco. Awaiting supermarket delivery.',
  },
  {
    id: 'delivered',
    stepNumber: '3',
    label: 'Balances & Settle',
    icon: 'fact_check',
    flag: 'Ready to settle',
    desc: 'Delivery checked. Review posted split and settle up with collector.',
  },
] as const;

export function SplitStepper({ status }: SplitStepperProps) {
  const currentIndex =
    status === 'delivered' ? 2 : status === 'ordered' || status === 'locked' ? 1 : 0;

  const currentStage = STAGES[currentIndex];
  const nextStage = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null;

  return (
    <div className="w-full mb-md">
      {/* 1. Mobile View (Compact 1-line view to keep phone screens lightweight) */}
      <div className="md:hidden bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-sm shadow-xs">
        <div className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container ring-2 ring-primary ring-offset-2 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <Icon name={currentStage.icon} className="text-base text-primary" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-title-sm text-sm font-bold text-primary truncate">
                {currentStage.stepNumber}. {currentStage.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed/40 text-primary shrink-0">
                {currentStage.flag}
              </span>
            </div>
          </div>

          {nextStage && (
            <div className="flex items-center gap-1.5 shrink-0 opacity-70">
              <Icon name="arrow_forward" className="text-sm text-on-surface-variant/70" />
              <div
                title={`Next: ${nextStage.label}`}
                className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center border border-surface-container-highest"
              >
                <Icon name={nextStage.icon} className="text-sm" />
              </div>
            </div>
          )}

          {!nextStage && (
            <div className="flex items-center gap-1 shrink-0 text-secondary">
              <Icon name="verified" filled className="text-base" />
              <span className="text-xs font-bold">Settled</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Desktop View (Rich 3-column progression board connecting Planning -> Delivery -> Balances) */}
      <div className="hidden md:block bg-surface-container-lowest border border-surface-container-highest rounded-3xl p-md lg:p-lg shadow-sm">
        <div className="grid grid-cols-3 gap-md relative">
          {/* Subtle connecting progress track */}
          <div className="absolute top-5 left-[16%] right-[16%] h-0.5 bg-surface-container-highest -z-0">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{
                width: currentIndex === 0 ? '0%' : currentIndex === 1 ? '50%' : '100%',
              }}
            />
          </div>

          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={stage.id}
                className={clsx(
                  'relative z-10 flex flex-col items-center text-center p-md rounded-2xl transition-all duration-200 border',
                  isCurrent
                    ? 'bg-surface-container-low border-primary/40 shadow-xs ring-1 ring-primary/20'
                    : isCompleted
                    ? 'bg-surface-container-lowest/80 border-surface-container-highest/60 hover:bg-surface-container-low/30'
                    : 'bg-surface-container-lowest/40 border-transparent opacity-60'
                )}
              >
                {/* Stage Badge Icon */}
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-sm transition-all shadow-xs',
                    isCompleted
                      ? 'bg-primary text-on-primary'
                      : isCurrent
                      ? 'bg-primary-container text-on-primary-container ring-4 ring-primary/20'
                      : 'bg-surface-container text-on-surface-variant border border-surface-container-highest'
                  )}
                >
                  {isCompleted ? (
                    <Icon name="check" className="text-lg" />
                  ) : (
                    <Icon
                      name={stage.icon}
                      className={clsx('text-lg', isCurrent ? 'text-primary' : '')}
                    />
                  )}
                </div>

                {/* Step Title & Status Flag */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center mb-1">
                  <span
                    className={clsx(
                      'font-title-sm text-sm font-bold',
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-on-surface'
                        : 'text-on-surface-variant'
                    )}
                  >
                    {stage.stepNumber}. {stage.label}
                  </span>
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
                      isCurrent
                        ? 'bg-primary text-on-primary shadow-2xs'
                        : isCompleted
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    )}
                  >
                    {stage.flag}
                  </span>
                </div>

                {/* Explanatory description */}
                <p className="font-body-sm text-xs text-on-surface-variant max-w-[240px] leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
