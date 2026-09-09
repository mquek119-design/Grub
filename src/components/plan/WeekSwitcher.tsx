import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';
import { currentWeekStart, nextWeekStart, weekRangeLabel, type WeekChoice } from '@/lib/weeks';

/**
 * Two weeks, and they are not the same kind of object.
 *
 * This week becomes a record the moment the shop is placed: the food is bought,
 * the split is settled and the only honest thing to do is show what you have.
 * Next week is still a decision. Putting them behind one heading meant the tab
 * flipped between "what do you fancy?" and "here is what you have" with nothing
 * to say which you were looking at, and no way to think about the week ahead
 * while this one was still in the fridge.
 *
 * Links rather than buttons, so a week is a URL you can send to a housemate.
 */
export function WeekSwitcher({
  week,
  thisWeekLocked,
  nextWeekMealCount,
}: {
  week: WeekChoice;
  /** True once this week's shop is placed — it stops being editable. */
  thisWeekLocked: boolean;
  nextWeekMealCount: number;
}) {
  const options: {
    key: WeekChoice;
    href: string;
    label: string;
    range: string;
    note: string;
    icon: string;
  }[] = [
    {
      key: 'this',
      href: '/plan',
      label: 'This week',
      range: weekRangeLabel(currentWeekStart()),
      note: thisWeekLocked ? 'Locked in' : 'Still open',
      icon: thisWeekLocked ? 'lock' : 'edit_calendar',
    },
    {
      key: 'next',
      href: '/plan?week=next',
      label: 'Next week',
      range: weekRangeLabel(nextWeekStart()),
      note:
        nextWeekMealCount === 0
          ? 'Nothing yet'
          : `${nextWeekMealCount} meal${nextWeekMealCount === 1 ? '' : 's'}`,
      icon: 'event_upcoming',
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Which week"
      className="grid grid-cols-2 gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-surface-container-low border border-surface-container-highest shadow-xs"
    >
      {options.map((option) => {
        const active = option.key === week;
        return (
          <Link
            key={option.key}
            href={option.href}
            role="tab"
            aria-selected={active}
            className={clsx(
              'flex flex-col gap-1 px-2.5 py-2 sm:px-md sm:py-sm rounded-xl transition-all duration-200 btn-tactile',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'bg-surface-container-lowest shadow-ambient-card border border-primary/25 font-semibold'
                : 'hover:bg-surface-container/70 opacity-75 hover:opacity-100'
            )}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <Icon
                name={option.icon}
                className={clsx(
                  'text-[16px] sm:text-[17px] shrink-0',
                  active ? 'text-primary' : 'text-on-surface-variant'
                )}
              />
              <span
                className={clsx(
                  'font-title-md text-[13.5px] sm:text-title-md leading-tight',
                  active ? 'text-on-surface font-bold' : 'text-on-surface-variant'
                )}
              >
                {option.label}
              </span>
            </span>
            <div className="flex flex-col gap-0.5 text-left min-w-0 font-numeric-data">
              <span className="text-[11px] sm:text-[12px] text-on-surface/90 font-medium leading-tight">
                {option.range}
              </span>
              <span
                className={clsx(
                  'text-[10px] sm:text-[11px] font-medium leading-tight',
                  active ? 'text-primary font-semibold' : 'text-on-surface-variant/80'
                )}
              >
                {option.note}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
