'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';

type Tone = 'info' | 'suggest' | 'check' | 'good' | 'danger';

const TONES: Record<Tone, { box: string; icon: string; defaultIcon: string }> = {
  info: {
    box: 'bg-surface-container-lowest border-l-4 border-l-secondary border border-outline-variant/30 shadow-2xs',
    icon: 'text-secondary',
    defaultIcon: 'info',
  },
  suggest: {
    box: 'bg-amber-500/10 border-l-4 border-l-amber-500 border border-amber-500/20 shadow-2xs',
    icon: 'text-amber-700',
    defaultIcon: 'lightbulb',
  },
  check: {
    box: 'bg-amber-500/15 border-l-4 border-l-amber-600 border border-amber-500/30 shadow-2xs',
    icon: 'text-amber-800',
    defaultIcon: 'help',
  },
  good: {
    box: 'bg-primary/5 border-l-4 border-l-primary border border-primary/20 shadow-2xs',
    icon: 'text-primary',
    defaultIcon: 'check_circle',
  },
  danger: {
    box: 'bg-error-container/20 border-l-4 border-l-error border border-error/30 shadow-2xs',
    icon: 'text-error',
    defaultIcon: 'warning',
  },
};

const NOTICE_STORAGE_PREFIX = 'grub:notice-dismissed:';

export function Notice({
  tone = 'info',
  icon,
  title,
  children,
  className,
  role,
  id,
  dismissible = true,
}: {
  tone?: Tone;
  icon?: string;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
  id?: string;
  dismissible?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const style = TONES[tone];
  const storageKey = id ? `${NOTICE_STORAGE_PREFIX}${id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (window.localStorage.getItem(storageKey) === 'true') {
        setDismissed(true);
      }
    } catch {
      // Storage unavailable
    }
  }, [storageKey]);

  function handleDismiss() {
    setDismissed(true);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, 'true');
      } catch {
        // Storage unavailable
      }
    }
  }

  if (dismissed) return null;

  return (
    <div
      role={role}
      className={clsx(
        'flex items-start justify-between gap-md p-md rounded-xl transition-all',
        style.box,
        className
      )}
    >
      <div className="flex items-start gap-sm min-w-0 flex-1">
        <Icon
          name={icon ?? style.defaultIcon}
          filled
          className={clsx('mt-0.5 shrink-0 text-[18px]', style.icon)}
        />
        <div className="min-w-0 flex flex-col gap-xs">
          {title && <p className="font-title-md text-title-md font-bold text-on-surface">{title}</p>}
          <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{children}</div>
        </div>
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notice"
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors shrink-0 -mr-1 -mt-1"
        >
          <Icon name="close" className="text-base" />
        </button>
      )}
    </div>
  );
}
