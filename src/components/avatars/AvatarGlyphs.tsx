import type { SVGProps } from 'react';

export type AvatarId = 'ricky' | 'onion' | 'bap' | 'beanie' | 'noodz';

export interface AvatarOption {
  id: AvatarId;
  name: string;
  subtitle: string;
  description: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'ricky',
    name: 'Ricky',
    subtitle: 'Rice',
    description: 'Steamed rice bowl with chopsticks',
  },
  {
    id: 'onion',
    name: 'Onion',
    subtitle: 'Onion',
    description: 'Classic culinary yellow onion',
  },
  {
    id: 'bap',
    name: 'Bap',
    subtitle: 'Bread Roll',
    description: 'Crusty bakery morning bap',
  },
  {
    id: 'beanie',
    name: 'Beanie',
    subtitle: 'Bean',
    description: 'Savory kidney & pantry bean',
  },
  {
    id: 'noodz',
    name: 'Noodz',
    subtitle: 'Noodles',
    description: 'Wavy ramen noodles & chopsticks',
  },
];

export function isAvatarId(value: string): value is AvatarId {
  return AVATAR_OPTIONS.some((opt) => opt.id === value);
}

/** Parses avatar_url strings like "avatar:ricky" or "avatar:ricky?accent=rust" */
export function parseAvatarUrl(url: string | null | undefined): { avatarId: AvatarId | null; accentOverride?: string } {
  if (!url || !url.startsWith('avatar:')) {
    return { avatarId: null };
  }
  const raw = url.replace(/^avatar:/, '');
  const [avatarPart, queryPart] = raw.split('?');
  const [avatarId, accentFromColon] = avatarPart.split(':');
  
  let accentOverride: string | undefined = accentFromColon || undefined;
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    const acc = params.get('accent');
    if (acc) accentOverride = acc;
  }

  return {
    avatarId: isAvatarId(avatarId) ? avatarId : null,
    accentOverride,
  };
}

/**
 * Ricky (Rice): Classy minimalist rice bowl with chopsticks & steam grains.
 */
function RickyGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Chopsticks angled across */}
      <line x1="3" y1="4" x2="20" y2="9" strokeWidth="1.5" />
      <line x1="5" y1="2" x2="21" y2="7.5" strokeWidth="1.5" />
      
      {/* Fluffy rice mound */}
      <path
        d="M6.5 11C6.5 8.5 9 6.5 12 6.5C14.5 6.5 17 8 17.5 11"
        strokeWidth="1.75"
      />
      
      {/* Rice grains inside mound */}
      <circle cx="10" cy="8.5" r="0.6" fill="currentColor" />
      <circle cx="13" cy="8" r="0.6" fill="currentColor" />
      <circle cx="11.5" cy="10" r="0.6" fill="currentColor" />
      
      {/* Ceramic bowl */}
      <path
        d="M4.5 11H19.5C19.5 16 16.5 19 14.5 19H9.5C7.5 19 4.5 16 4.5 11Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      
      {/* Bowl foot */}
      <path d="M9 19H15V20.5C15 20.8 14.7 21 14.4 21H9.6C9.3 21 9 20.8 9 20.5V19Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Onion: Classy culinary onion bulb with papery skin striations and sprout.
 */
function OnionGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Sprout neck */}
      <path d="M12 2V6" strokeWidth="2" />
      <path d="M10 3.5C10.5 4.5 11 5.5 11 6" strokeWidth="1.5" />
      <path d="M14 3.5C13.5 4.5 13 5.5 13 6" strokeWidth="1.5" />

      {/* Main bulb body */}
      <path
        d="M12 6C7.5 6 4 10 4 14.5C4 18 7.5 21 12 21C16.5 21 20 18 20 14.5C20 10 16.5 6 12 6Z"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Inner layer contour curves */}
      <path d="M9 7C7 9.5 7 15 8.5 18" strokeWidth="1.3" strokeDasharray="1 0" />
      <path d="M15 7C17 9.5 17 15 15.5 18" strokeWidth="1.3" strokeDasharray="1 0" />
      <line x1="12" y1="7" x2="12" y2="20.5" strokeWidth="1.3" />

      {/* Root tufts */}
      <path d="M10.5 21V22.5" strokeWidth="1.5" />
      <path d="M12 21V23" strokeWidth="1.5" />
      <path d="M13.5 21V22.5" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Bap: Soft crusty British morning bap / roll with flour score slash on top.
 */
function BapGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Plump bun dome */}
      <path
        d="M3.5 14.5C3.5 8.5 7 5 12 5C17 5 20.5 8.5 20.5 14.5C20.5 17.5 18.5 19 12 19C5.5 19 3.5 17.5 3.5 14.5Z"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Bun base line */}
      <path d="M4 14.5C7.5 15.5 16.5 15.5 20 14.5" strokeWidth="1.3" />

      {/* Baker score cuts / flour slash on top */}
      <path d="M8.5 8.5C9.5 10 10.5 11.5 11.5 12.5" strokeWidth="1.6" />
      <path d="M13.5 8C14.5 9.5 15 11 15.5 12" strokeWidth="1.6" />

      {/* Flour sprinkle dots */}
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
      <circle cx="16" cy="11" r="0.6" fill="currentColor" />
      <circle cx="12" cy="7" r="0.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Beanie (Bean): Classy kidney/haricot bean silhouette with hilum curve.
 */
function BeanieGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Classic kidney bean contour */}
      <path
        d="M14.5 3.5C18.5 4.5 21 8.5 20.5 13C20 17.5 16 21 11.5 21C6.5 21 3.5 17 3.5 12C3.5 7 7.5 4 10.5 3.5C12 3.2 13.5 3.3 14.5 3.5Z"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Inner hilum indentation mark */}
      <path
        d="M9 9.5C7.8 11.2 7.8 13.5 9.2 15"
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {/* Eye / seed coat highlight */}
      <circle cx="9.2" cy="12.2" r="0.8" fill="currentColor" />
    </svg>
  );
}

/**
 * Noodz (Noodles): Graphic ramen noodles with chopsticks lifting wavy strands.
 */
function NoodzGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Chopsticks lifting noodles */}
      <line x1="2.5" y1="4" x2="21.5" y2="5" strokeWidth="1.6" />
      <line x1="2.5" y1="6.5" x2="21.5" y2="7.5" strokeWidth="1.6" />

      {/* Wavy noodle strands dropping down */}
      <path
        d="M8 7.5C7.5 9.5 9 11 8.5 13C8 15 9.5 16 9 17"
        strokeWidth="1.5"
      />
      <path
        d="M12 7.5C12.5 9.5 11 11 11.5 13C12 15 11 16 11.5 17"
        strokeWidth="1.5"
      />
      <path
        d="M16 7.5C15.5 9.5 17 11 16.5 13C16 15 17 16 16.5 17"
        strokeWidth="1.5"
      />

      {/* Bowl base */}
      <path
        d="M5 14H19C18.5 18 15.5 20.5 12 20.5C8.5 20.5 5.5 18 5 14Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </svg>
  );
}

interface AvatarGlyphProps extends SVGProps<SVGSVGElement> {
  id: AvatarId;
}

export function AvatarGlyph({ id, className, ...props }: AvatarGlyphProps) {
  switch (id) {
    case 'ricky':
      return <RickyGlyph className={className} {...props} />;
    case 'onion':
      return <OnionGlyph className={className} {...props} />;
    case 'bap':
      return <BapGlyph className={className} {...props} />;
    case 'beanie':
      return <BeanieGlyph className={className} {...props} />;
    case 'noodz':
      return <NoodzGlyph className={className} {...props} />;
    default:
      return null;
  }
}
