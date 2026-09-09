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
      className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-1.5 pb-[max(0.5rem,calc(env(safe-area-inset-bottom,0px)+0.35rem))] bg-primary/95 backdrop-blur-md border-t border-white/10 shadow-ambient-modal"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            title={tab.label}
            className={clsx(
              'relative flex flex-col items-center justify-center transition-all duration-200 active:scale-90 px-3 py-1 rounded-2xl',
              isActive
                ? 'text-secondary'
                : 'text-[#A3C4A8] hover:text-white'
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-center rounded-xl transition-all duration-200',
                isActive
                  ? 'w-10 h-8 bg-white/12 border border-white/10 shadow-xs'
                  : 'w-10 h-8 hover:bg-white/5'
              )}
            >
              <Icon name={tab.icon} className="text-[21px]" />
            </div>
            {/* Discrete active micro-dot */}
            <span
              className={clsx(
                'w-1 h-1 rounded-full mt-0.5 transition-all duration-200',
                isActive ? 'bg-secondary scale-100 opacity-100' : 'scale-0 opacity-0'
              )}
            />
            {tab.href === '/basket' && basketHasUpdates && !isActive && (
              <span
                className="absolute top-1 right-2.5 w-2.5 h-2.5 bg-[#E07A5F] rounded-full border-2 border-primary animate-pulse"
                title="Missing pack prices"
              >
                <span className="sr-only">Missing pack prices</span>
              </span>
            )}
            <span className="sr-only">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
