import { clsx } from '@/lib/clsx';
import type { User } from '@/lib/types';
import { AvatarGlyph, parseAvatarUrl } from './AvatarGlyphs';

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

export type AvatarSize = keyof typeof SIZE_CLASSES;

interface AvatarProps {
  user: Pick<User, 'name' | 'accent' | 'avatarUrl'>;
  size?: AvatarSize;
  className?: string;
  /** Ring drawn around the circle — used to mark "you" or a meal group. */
  ring?: 'none' | 'primary' | 'secondary' | 'error' | 'surface';
}

const RING_CLASSES = {
  none: '',
  primary: 'ring-2 ring-primary',
  secondary: 'ring-2 ring-secondary-container',
  error: 'ring-2 ring-error',
  surface: 'ring-2 ring-surface-container-lowest',
} as const;

export function Avatar({ user, size = 'md', className, ring = 'none' }: AvatarProps) {
  const { avatarId, accentOverride } = parseAvatarUrl(user.avatarUrl);
  const effectiveAccent = (accentOverride as User['accent']) || user.accent || 'green';
  const accentClass = ACCENT_CLASSES[effectiveAccent] ?? ACCENT_CLASSES.green;

  const isCustomPhoto = Boolean(user.avatarUrl && !avatarId);

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      // role=img + aria-label so the avatar announces as the person whether it
      // renders initials or an avatar glyph.
      role="img"
      aria-label={user.name}
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-bold shrink-0 overflow-hidden select-none',
        SIZE_CLASSES[size],
        RING_CLASSES[ring],
        !isCustomPhoto && accentClass,
        className
      )}
      title={user.name}
    >
      {avatarId ? (
        <AvatarGlyph id={avatarId} className={GLYPH_SIZE_CLASSES[size]} />
      ) : isCustomPhoto ? (
        <img loading="lazy" src={user.avatarUrl!} alt="" className="w-full h-full object-cover" />
      ) : (
        initials
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
