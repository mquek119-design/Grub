import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { formatPence } from '@/lib/money';
import type { Pence } from '@/lib/types';

/**
 * Whether the basket clears Tesco's minimum spend.
 *
 * This is the app's founding premise made visible: one household order reaches
 * a threshold a single student cannot. Leaving it off meant the collector only
 * discovered a short basket at Tesco, after doing all the work.
 *
 * The shortfall is stated in money, not a percentage — "£6.40 short" tells you
 * what to do; "84%" does not.
 */
export function MinimumOrderBar({
  total,
  minimum,
  method,
}: {
  total: Pence;
  minimum: Pence;
  method: 'delivery' | 'collect';
}) {
  const met = total >= minimum;
  const shortfall = Math.max(0, minimum - total);
  const fraction = minimum > 0 ? Math.min(1, total / minimum) : 1;
  const label = method === 'collect' ? 'Click & Collect' : 'Delivery';

  // When minimum is comfortably met, keep it compact and quiet
  if (met) {
    return (
      <div className="flex items-center justify-between px-md py-sm rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs shadow-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <Icon name="check_circle" filled className="text-primary text-base" />
          <span>Clears Tesco {label} minimum ({formatPence(minimum)})</span>
        </span>
        <span className="font-numeric-data font-bold text-primary">{formatPence(total)}</span>
      </div>
    );
  }

  // When under the threshold, display prominent shortfall alert and progress bar
  return (
    <Card accent="secondary" className="flex flex-col gap-sm animate-fade-in">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="font-title-md text-title-md flex items-center gap-xs text-secondary">
            <Icon name="error" filled className="text-secondary" />
            {formatPence(shortfall)} short of {label} minimum
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Tesco {label} requires at least {formatPence(minimum)}. Currently at{' '}
            <strong className="font-numeric-data">{formatPence(total)}</strong>. Add a few household items or snacks to qualify.
          </p>
        </div>
      </div>

      <div
        className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={minimum}
        aria-valuenow={Math.min(total, minimum)}
        aria-label={`Progress toward the ${label} minimum`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 bg-secondary"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </Card>
  );
}

