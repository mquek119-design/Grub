'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';
import { TABS, activeTabHref } from './tabs';

interface BottomNavProps {
  /** Dot when saved basket items need pack prices. */
  basketHasUpdates?: boolean;
}

export function BottomNav({ basketHasUpdates = false }: BottomNavProps) {
  const pathname = usePathname();
  const active = activeTabHref(pathname);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-2 py-2 pb-safe bg-primary border-t border-primary/10 shadow-lg"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={clsx(
              'relative flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.88] px-2 py-1 rounded-xl',
              isActive
                ? 'text-secondary font-bold'
                : 'text-[#A3C4A8] hover:text-white'
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-center rounded-full transition-all duration-200',
                isActive ? 'w-11 h-7 bg-white/12 border border-white/10 shadow-xs' : 'w-11 h-7'
              )}
            >
              <Icon name={tab.icon} className="text-[20px]" />
            </div>
            {tab.href === '/basket' && basketHasUpdates && !isActive && (
              <span className="absolute top-1 right-3 w-2.5 h-2.5 bg-[#E07A5F] rounded-full border-2 border-primary animate-pulse" title="Missing pack prices">
                <span className="sr-only">Missing pack prices</span>
              </span>
            )}
            <span className="font-label-caps text-[10px] tracking-wide mt-0.5">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
