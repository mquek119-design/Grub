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
    try {
      setVisible(window.localStorage.getItem(storageKey) !== 'dismissed');
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
      // The guidance still works for this visit; it simply cannot persist.
      setVisible(true);
    }
  }, [storageKey]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, 'dismissed');
    } catch {
      // Dismissing must still work for the current visit when storage is blocked.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label={`${tip.title} — first-run guidance`}
      className={clsx(
        'flex items-start gap-sm rounded-xl border border-secondary-container/40 bg-secondary-fixed/40 p-md',
        className
      )}
    >
      <Icon name="lightbulb" filled className="mt-0.5 shrink-0 text-[20px] text-secondary" />
      <div className="min-w-0 flex-1">
        <p className="font-title-md text-title-md text-on-surface">{tip.title}</p>
        <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">{tip.body}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={`Dismiss ${tab} guide`}
        className="-m-1 shrink-0 rounded-full p-1 text-on-surface-variant hover:bg-secondary-container/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </aside>
  );
}
