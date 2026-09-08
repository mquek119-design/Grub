'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';

const TIP_STORAGE_PREFIX = 'grub:first-run-tip:';

const TIPS = {
  feed: {
    title: 'Your house at a glance',
    body: 'See the cutoff, this week’s meals, jobs for tonight and anything the house needs to settle.',
  },
  plan: {
    title: 'Build the week together',
    body: 'Pick meals or join a housemate before the cutoff. Shared ingredients are combined when the basket is built.',
  },
  basket: {
    title: 'Check the shop before it goes',
    body: 'Review quantities, pack matches and swaps here. Only the collector sends the finished basket to Tesco.',
  },
  split: {
    title: 'Pay for what you share',
    body: 'Your share is calculated item by item. After delivery, reconcile any changes before everyone settles up.',
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

  if (!visible) {
    return (
      <button
        type="button"
        onClick={reopen}
        title="View page guide"
        aria-label={`Open ${tab} guide`}
        className={clsx(
          'fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 w-10 h-10 rounded-full bg-secondary-fixed/90 text-secondary shadow-md hover:scale-105 transition-all flex items-center justify-center border border-secondary-container',
          className
        )}
      >
        <Icon name="lightbulb" filled className="text-[20px]" />
      </button>
    );
  }

  return (
    <aside
      aria-label={`${tip.title} — first-run guidance`}
      className={clsx(
        'fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 max-w-sm w-[calc(100%-2rem)] rounded-2xl border border-secondary-container/60 bg-surface-container-lowest p-md shadow-elevated-card backdrop-blur-md transition-all',
        className
      )}
    >
      <div className="flex items-start gap-sm">
        <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary shrink-0 mt-0.5">
          <Icon name="lightbulb" filled className="text-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-xs mb-0.5">
            <p className="font-title-sm text-title-sm font-semibold text-on-surface">{tip.title}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">
              Tip
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
