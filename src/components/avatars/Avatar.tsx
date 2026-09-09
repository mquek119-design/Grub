'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from '@/lib/clsx';
import type { User } from '@/lib/types';
import { AvatarGlyph, parseAvatarUrl, AVATAR_OPTIONS } from './AvatarGlyphs';

/**
 * Curated palette for housemate avatars and initials.
 * All combinations satisfy WCAG AAA contrast ratios.
 */
export const ACCENT_CLASSES: Record<User['accent'], string> = {
  green: 'bg-[#D8F3DC] text-[#1B4332]',
  orange: 'bg-[#FDECD0] text-[#7C4A1E]',
  rust: 'bg-[#FCDAD1] text-[#8C2D19]',
  blue: 'bg-[#cfe4ff] text-[#001d36]',
  purple: 'bg-[#e6ddff] text-[#22005d]',
  olive: 'bg-[#E5ECD6] text-[#2D4519]',
};

/**
 * High-contrast saturated badge colors for the initial corner tag.
 * Allows instant flatmate identification without obscuring the character glyph.
 */
export const BADGE_ACCENT_CLASSES: Record<User['accent'], string> = {
  green: 'bg-[#1B4332] text-[#D8F3DC]',
  orange: 'bg-[#7C4A1E] text-[#FDECD0]',
  rust: 'bg-[#8C2D19] text-[#FCDAD1]',
  blue: 'bg-[#002D57] text-[#CFE4FF]',
  purple: 'bg-[#2E1065] text-[#E6DDFF]',
  olive: 'bg-[#2D4519] text-[#E5ECD6]',
};

const SIZE_CLASSES = {
  xs: 'w-4 h-4 text-[8px]',
  sm: 'w-8 h-8 text-[12px]',
  md: 'w-10 h-10 text-[14px]',
  lg: 'w-16 h-16 text-[22px]',
  xl: 'w-24 h-24 text-[32px]',
} as const;

const GLYPH_SIZE_CLASSES = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
} as const;

const BADGE_SIZE_CLASSES = {
  xs: 'hidden',
  sm: 'w-3.5 h-3.5 text-[8px] -bottom-0.5 -right-0.5 ring-[1.5px]',
  md: 'w-4 h-4 text-[9.5px] -bottom-0.5 -right-0.5 ring-[1.5px]',
  lg: 'w-5 h-5 text-[11px] bottom-0 right-0 ring-2',
  xl: 'w-7 h-7 text-[14px] bottom-0.5 right-0.5 ring-2',
} as const;

export type AvatarSize = keyof typeof SIZE_CLASSES;

export interface AvatarProps {
  user: Pick<User, 'name' | 'accent' | 'avatarUrl'>;
  size?: AvatarSize;
  className?: string;
  /** Ring drawn around the circle — used to mark "you" or a meal group. */
  ring?: 'none' | 'primary' | 'secondary' | 'error' | 'surface';
  /** Whether to show the micro-initial badge in the corner for character avatars. Defaults to true. */
  showInitialBadge?: boolean;
  /** Whether tap/click or hover reveals the floating name tooltip. Defaults to true. */
  interactive?: boolean;
  /** Placement direction of the floating tooltip. Defaults to 'top'. */
  tooltipPlacement?: 'top' | 'bottom';
}

const RING_CLASSES = {
  none: '',
  primary: 'ring-2 ring-primary',
  secondary: 'ring-2 ring-secondary-container',
  error: 'ring-2 ring-error',
  surface: 'ring-2 ring-surface-container-lowest',
} as const;

export function Avatar({
  user,
  size = 'md',
  className,
  ring = 'none',
  showInitialBadge = true,
  interactive = true,
  tooltipPlacement = 'top',
}: AvatarProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { avatarId, accentOverride } = parseAvatarUrl(user.avatarUrl);
  const effectiveAccent = (accentOverride as User['accent']) || user.accent || 'green';
  const accentClass = ACCENT_CLASSES[effectiveAccent] ?? ACCENT_CLASSES.green;
  const badgeAccentClass = BADGE_ACCENT_CLASSES[effectiveAccent] ?? BADGE_ACCENT_CLASSES.green;

  const isCustomPhoto = Boolean(user.avatarUrl && !avatarId);
  const hasAvatarGraphic = Boolean(avatarId || isCustomPhoto);

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const firstInitial = user.name.trim()[0]?.toUpperCase() ?? '';

  const charName = avatarId
    ? AVATAR_OPTIONS.find((o) => o.id === avatarId)?.name ?? null
    : null;
  const tooltipLabel = charName ? `${user.name} (${charName})` : user.name;

  const handleTap = () => {
    if (!interactive) return;
    setTooltipOpen((prev) => {
      const next = !prev;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (next) {
        timeoutRef.current = setTimeout(() => {
          setTooltipOpen(false);
        }, 2500);
      }
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      role="img"
      aria-label={tooltipLabel}
      title={tooltipLabel}
      onClick={handleTap}
      onMouseEnter={() => {
        if (interactive) setTooltipOpen(true);
      }}
      onMouseLeave={() => {
        if (interactive) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setTooltipOpen(false);
        }
      }}
      className={clsx(
        'relative inline-flex items-center justify-center shrink-0 select-none transition-transform',
        interactive && 'cursor-pointer hover:scale-[1.03]',
        (tooltipOpen || undefined) && 'z-30',
        'hover:z-30',
        SIZE_CLASSES[size],
        className
      )}
    >
      {/* Inner Avatar Disc */}
      <span
        className={clsx(
          'w-full h-full inline-flex items-center justify-center rounded-full font-bold overflow-hidden',
          RING_CLASSES[ring],
          !isCustomPhoto && accentClass
        )}
      >
        {avatarId ? (
          <AvatarGlyph id={avatarId} className={GLYPH_SIZE_CLASSES[size]} />
        ) : isCustomPhoto ? (
          <img loading="lazy" src={user.avatarUrl!} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </span>

      {/* Micro-Initial Corner Badge: lets flatmates identify who it is at a single glance */}
      {hasAvatarGraphic && showInitialBadge && size !== 'xs' && (
        <span
          aria-hidden="true"
          data-testid="avatar-initial-badge"
          className={clsx(
            'absolute flex items-center justify-center rounded-full font-black leading-none uppercase shadow-xs ring-surface-container-lowest z-10 pointer-events-none',
            BADGE_SIZE_CLASSES[size],
            badgeAccentClass
          )}
        >
          {firstInitial}
        </span>
      )}

      {/* Tap-to-Reveal / Hover Floating Name Tooltip */}
      {interactive && tooltipOpen && (
        <span
          role="tooltip"
          className={clsx(
            'absolute pointer-events-none z-50 whitespace-nowrap px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[11px] font-semibold shadow-lg transition-all duration-150',
            tooltipPlacement === 'bottom'
              ? 'top-[calc(100%+6px)] left-1/2 -translate-x-1/2'
              : 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2'
          )}
        >
          {tooltipLabel}
          <span
            aria-hidden="true"
            className={clsx(
              'absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-neutral-900 dark:bg-neutral-100',
              tooltipPlacement === 'bottom' ? '-top-0.5' : '-bottom-0.5'
            )}
          />
        </span>
      )}
    </span>
  );
}

interface AvatarStackProps {
  users: Pick<User, 'name' | 'accent' | 'avatarUrl'>[];
  size?: AvatarSize;
  className?: string;
  dimmed?: boolean;
}

export function AvatarStack({ users, size = 'sm', className, dimmed }: AvatarStackProps) {
  return (
    <span className={clsx('flex -space-x-2', dimmed && 'opacity-50', className)}>
      {users.map((user) => (
        <Avatar key={user.name} user={user} size={size} ring="surface" />
      ))}
    </span>
  );
}

