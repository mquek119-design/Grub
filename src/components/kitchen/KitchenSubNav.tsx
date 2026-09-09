'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';

interface KitchenSubNavProps {
  current?: 'recipes' | 'leftovers' | 'pantry';
  className?: string;
}

const KITCHEN_TABS = [
  {
    href: '/recipes',
    key: 'recipes',
    label: 'Recipe Book',
    shortLabel: 'Recipes',
    icon: 'menu_book',
  },
  {
    href: '/leftovers',
    key: 'leftovers',
    label: 'Fridge Leftovers',
    shortLabel: 'Leftovers',
    icon: 'soup_kitchen',
  },
  {
    href: '/pantry',
    key: 'pantry',
    label: 'House Pantry',
    shortLabel: 'Pantry',
    icon: 'inventory_2',
  },
] as const;

export function KitchenSubNav({ current, className }: KitchenSubNavProps) {
  const pathname = usePathname();

  const activeKey =
    current ??
    (pathname.startsWith('/leftovers')
      ? 'leftovers'
      : pathname.startsWith('/pantry')
      ? 'pantry'
      : 'recipes');

  return (
    <nav
      aria-label="Kitchen Sections"
      className={clsx(
        'w-full sm:w-fit grid grid-cols-3 sm:inline-flex items-center gap-1 p-1 rounded-2xl bg-surface-container-low/90 border border-outline-variant/40 shadow-xs select-none',
        className
      )}
    >
      {KITCHEN_TABS.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={clsx(
              'flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-200 btn-tactile whitespace-nowrap text-center',
              isActive
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/60'
            )}
          >
            <Icon name={tab.icon} className="text-[15px] sm:text-[16px] shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
