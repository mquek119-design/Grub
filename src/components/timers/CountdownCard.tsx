'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';

/**
 * Order-cutoff countdown.
 *
 * Per DESIGN.md the track is green until under 6 hours remain, then it turns
 * Secondary Orange. The first render deliberately shows a placeholder so the
 * server and client markup agree — the real value lands on mount.
 */

const URGENT_THRESHOLD_MS = 6 * 3600_000;

function breakdown(msRemaining: number) {
  const clamped = Math.max(0, msRemaining);
  const totalMinutes = Math.floor(clamped / 60_000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    seconds: Math.floor((clamped % 60_000) / 1000),
  };
}

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

interface CountdownCardProps {
  cutoffAt: string;
  /** Length of the planning window, used to size the progress bar. */
  windowHours?: number;
}

export function CountdownCard({ cutoffAt, windowHours = 24 }: CountdownCardProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const target = new Date(cutoffAt).getTime();
    let wasOpen = target > Date.now();
    const tick = () => {
      const next = target - Date.now();
      setRemaining(next);
      if (wasOpen && next <= 0) {
        wasOpen = false;
        router.refresh();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cutoffAt, router]);

  const isUrgent = remaining !== null && remaining < URGENT_THRESHOLD_MS;
  const locked = remaining !== null && remaining <= 0;
  const { hours, minutes, seconds } = breakdown(remaining ?? 0);

  const elapsedFraction =
    remaining === null ? 0 : 1 - Math.min(1, Math.max(0, remaining / (windowHours * 3600_000)));

  function handleNudgeFlat() {
    const timeStr = new Date(cutoffAt).toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const hoursLeft = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    const shareText = `🛒 Hey flat! Grub cutoff for this week's Tesco shop is at ${timeStr} (${hoursLeft} left). Lock in your dinners and add your staples: ${typeof window !== 'undefined' ? window.location.origin : ''}/plan`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: 'Grub Planning Cutoff',
          text: shareText,
          url: `${window.location.origin}/plan`,
        })
        .catch(() => {});
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }

  return (
    <Card className="flex flex-col justify-between gap-sm">
      <div>
        <h2 className="font-title-md text-title-md text-on-surface mb-xs">Planning cutoff</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {locked ? 'Planning is closed for this week.' : 'Choose your meals before planning closes.'}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-sm">
        <div
          className={clsx(
            'font-numeric-data text-display-lg tabular-nums',
            locked ? 'text-on-surface-variant' : isUrgent ? 'text-secondary-container' : 'text-primary'
          )}
        >
          {remaining === null ? '--:--' : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
        </div>
        <span
          className={clsx(
            'font-label-caps text-label-caps uppercase tracking-wider mt-xs',
            isUrgent && !locked ? 'text-secondary font-bold' : 'text-on-surface-variant'
          )}
        >
          {locked ? 'Locked' : isUrgent ? 'Cutoff approaching' : 'Until lock'}
        </span>
      </div>

      <div
        className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(elapsedFraction * 100)}
        aria-label="Time elapsed in planning window"
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-1000',
            isUrgent ? 'bg-secondary-container' : 'bg-primary'
          )}
          style={{ width: `${elapsedFraction * 100}%` }}
        />
      </div>

      {!locked && remaining !== null && (
        <button
          type="button"
          onClick={handleNudgeFlat}
          className="mt-xs h-9 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-outline-variant/40 btn-tactile"
        >
          <Icon name="share" className="text-[15px] text-[#25D366]" />
          <span>Nudge Flat on WhatsApp</span>
        </button>
      )}
    </Card>
  );
}
