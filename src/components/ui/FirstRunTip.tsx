'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/media/Icon';
import { Stocky } from '@/components/mascot/Stocky';
import { clsx } from '@/lib/clsx';

const TIP_STORAGE_PREFIX = 'grub:first-run-tip:';

const TIPS = {
  feed: {
    title: 'Your house at a glance',
    body: "Tonight's cook, this week's meals, and whoever still owes money from last Thursday.",
  },
  plan: {
    title: 'Build the week together',
    body: 'Pick what you fancy before the cutoff. If two of you need onions, you buy one bag instead of two.',
  },
  basket: {
    title: 'Check the shop before it goes',
    body: 'Quantities, own-brand swaps, and assumed packs. The collector pushes the final cart to Tesco.',
  },
  split: {
    title: 'Pay for what you share',
    body: 'Calculated item by item down to the penny. No round numbers, no guessing, no kitchen debates.',
  },
} as const;

export type FirstRunTipKey = keyof typeof TIPS;

export function FirstRunTip({
  tab,
  className,
}: {
  tab: FirstRunTipKey;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const storageKey = `${TIP_STORAGE_PREFIX}${tab}`;
  const tip = TIPS[tab];

  useEffect(() => {
    // Hidden first by default on all platforms as requested.
    // User can tap the lightbulb guide button whenever they want to open it.
    setVisible(false);
  }, [storageKey]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, 'dismissed');
    } catch {
      // Dismissing works for current session
    }
    setVisible(false);
  }

  function reopen() {
    setVisible(true);
    // Auto-dismiss again after 7s
    setTimeout(() => {
      dismiss();
    }, 7000);
  }

  const positionClasses =
    tab === 'basket'
      ? 'bottom-[calc(9.75rem+env(safe-area-inset-bottom,16px))] lg:bottom-6 right-4 lg:right-6'
      : 'bottom-[calc(5.25rem+env(safe-area-inset-bottom,12px))] md:bottom-6 right-4 md:right-6';

  if (!visible) {
    return (
      <button
        type="button"
        onClick={reopen}
        title="View page guide"
        aria-label={`Open ${tab} guide`}
        className={clsx(
          'fixed z-40 w-12 h-12 rounded-full bg-secondary-fixed text-secondary shadow-ambient-card hover:shadow-ambient-modal hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-secondary-container/60 btn-tactile',
          positionClasses,
          className
        )}
      >
        <Stocky mood="smug" size="sm" />
      </button>
    );
  }

  return (
    <aside
      aria-label={`${tip.title} — first-run guidance`}
      className={clsx(
        'fixed z-[60] max-w-sm w-[calc(100%-2rem)] rounded-2xl border border-secondary-container/60 bg-surface-container-lowest p-md shadow-ambient-modal backdrop-blur-md transition-all',
        positionClasses,
        className
      )}
    >
      <div className="flex items-start gap-sm">
        <div className="shrink-0 mt-0.5">
          <Stocky mood="smug" size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-xs mb-0.5">
            <p className="font-title-sm text-title-sm font-semibold text-on-surface">{tip.title}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">
              Stocky&apos;s Tip
            </span>
          </div>
          <p className="font-body-sm text-[13px] leading-snug text-on-surface-variant">{tip.body}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={`Dismiss ${tab} guide`}
          className="-m-1 shrink-0 rounded-full p-1 text-on-surface-variant hover:bg-secondary-container/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
    </aside>
  );
}
