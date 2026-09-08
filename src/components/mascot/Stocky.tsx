import React from 'react';
import { clsx } from '@/lib/clsx';

export type StockyMood = 'neutral' | 'smug' | 'stressed' | 'asleep' | 'cooking' | 'split';
export type StockySize = 'sm' | 'md' | 'lg' | 'xl';

interface StockyProps {
  mood?: StockyMood;
  size?: StockySize;
  caption?: string;
  captionPosition?: 'top' | 'right' | 'bottom';
  className?: string;
  animate?: boolean;
}

const SIZE_MAP: Record<StockySize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

/**
 * Stocky — The Honest Bouillon Cube.
 *
 * Grounded, calm, dry, and distinctly British.
 * Inspired by vintage mid-century grocer packaging (Oxo/Knorr/vintage print).
 * Never bubbly, never kawaii, never corporate.
 */
export function Stocky({
  mood = 'neutral',
  size = 'md',
  caption,
  captionPosition = 'right',
  className,
  animate = true,
}: StockyProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 select-none',
        captionPosition === 'top' && 'flex-col-reverse',
        captionPosition === 'bottom' && 'flex-col',
        captionPosition === 'right' && 'flex-row',
        className
      )}
    >
      <div
        className={clsx(
          SIZE_MAP[size],
          'relative shrink-0 transition-transform duration-200',
          animate && 'hover:-translate-y-0.5'
        )}
        aria-label={`Stocky the bouillon cube (${mood})`}
        role="img"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Flat Graphic Cast Shadow */}
          <polygon
            points="24,78 72,78 88,88 38,88"
            fill="#1B4332"
            fillOpacity="0.08"
          />

          {/* ISOMETRIC CUBE GEOMETRY */}

          {/* Top Isometric Face (Foil wrapper top) */}
          <polygon
            points="24,34 56,16 88,34 56,52"
            fill="#F4E285"
            stroke="#1B4332"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Top Face Diagonal Foil Crease */}
          <line
            x1="24"
            y1="34"
            x2="88"
            y2="34"
            stroke="#1B4332"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            strokeOpacity="0.6"
          />

          {/* Right Isometric Face (Foil envelope fold) */}
          <polygon
            points="56,52 88,34 88,72 56,88"
            fill="#1B4332"
            stroke="#1B4332"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Envelope fold cross lines on right side */}
          <line
            x1="56"
            y1="52"
            x2="88"
            y2="72"
            stroke="#2D6A4F"
            strokeWidth="1.5"
          />
          <line
            x1="56"
            y1="88"
            x2="88"
            y2="34"
            stroke="#2D6A4F"
            strokeWidth="1.5"
          />
          <polygon
            points="56,52 72,62 56,88"
            fill="#143427"
            fillOpacity="0.5"
          />

          {/* Front Face (Ochre / Tan Cube Face) */}
          <polygon
            points="24,34 56,52 56,88 24,72"
            fill="#D4A574"
            stroke="#1B4332"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Silver / Foil Edge Highlight Strip */}
          <polyline
            points="24,34 56,52 56,88"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.5"
          />

          {/* ACCESSORIES PER MOOD */}

          {/* Cooking: Minimalist Mid-century Wooden Spoon leaning against cube */}
          {mood === 'cooking' && (
            <g>
              {/* Spoon Handle */}
              <line
                x1="12"
                y1="82"
                x2="19"
                y2="52"
                stroke="#A77A4D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="82"
                x2="19"
                y2="52"
                stroke="#1B4332"
                strokeWidth="1"
                strokeLinecap="round"
              />
              {/* Spoon Bowl */}
              <ellipse
                cx="21"
                cy="46"
                rx="4.5"
                ry="7"
                transform="rotate(-15 21 46)"
                fill="#C49A6C"
                stroke="#1B4332"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Split: Minimalist Receipt Tape ribbon */}
          {mood === 'split' && (
            <g>
              <polygon
                points="16,66 26,62 26,86 21,83 16,86"
                fill="#FAFAF7"
                stroke="#1B4332"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <text
                x="21"
                y="74"
                textAnchor="middle"
                fontSize="6"
                fontWeight="900"
                fill="#1B4332"
                fontFamily="monospace"
              >
                £
              </text>
              <line x1="18" y1="77" x2="24" y2="77" stroke="#1B4332" strokeWidth="1" />
              <line x1="18" y1="79.5" x2="23" y2="79.5" stroke="#1B4332" strokeWidth="1" />
            </g>
          )}

          {/* Stressed: Single clean graphic sweat bead */}
          {mood === 'stressed' && (
            <path
              d="M48 38 C48 38 45 42 48 45 C50 46.5 52 45 52 42 C52 39 48 38 48 38 Z"
              fill="#74C0FC"
              stroke="#1B4332"
              strokeWidth="1.2"
            />
          )}

          {/* FACIAL EXPRESSIONS ON FRONT OCHRE FACE */}

          {mood === 'asleep' ? (
            /* Asleep: Two minimal horizontal slit lines */
            <g>
              <line x1="33" y1="52" x2="39" y2="52" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="43" y1="57" x2="49" y2="57" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="39" y1="67" x2="44" y2="67" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : mood === 'smug' ? (
            /* Smug: One arched brow, knowing half-smirk, subtle foil gleam */
            <g>
              {/* Left eyebrow raised */}
              <path d="M33 46 Q36 43 40 45" stroke="#1B4332" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              {/* Eyes */}
              <circle cx="36" cy="50" r="2.8" fill="#1B4332" />
              <circle cx="47" cy="55" r="2.8" fill="#1B4332" />
              {/* Knowing dry smirk */}
              <path d="M36 65 Q42 68 47 63" stroke="#1B4332" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              {/* Foil star glint */}
              <path d="M80 26 L82 30 L86 31 L82 32 L80 36 L78 32 L74 31 L78 30 Z" fill="#FFFFFF" stroke="#1B4332" strokeWidth="1" />
            </g>
          ) : mood === 'stressed' ? (
            /* Stressed: One slightly raised eye, dry wavy line mouth */
            <g>
              <circle cx="35" cy="51" r="3.2" fill="#1B4332" />
              <circle cx="47" cy="54" r="2.6" fill="#1B4332" />
              {/* Wavy mouth */}
              <path d="M35 66 Q39 63 43 66 T49 64" stroke="#1B4332" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </g>
          ) : mood === 'cooking' ? (
            /* Cooking: Focused, practical gaze */
            <g>
              <circle cx="36" cy="51" r="2.8" fill="#1B4332" />
              <circle cx="47" cy="56" r="2.8" fill="#1B4332" />
              <line x1="38" y1="65" x2="45" y2="67" stroke="#1B4332" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ) : mood === 'split' ? (
            /* Split: Calm, approving glance toward the receipt */
            <g>
              <circle cx="35" cy="50" r="2.8" fill="#1B4332" />
              <circle cx="46" cy="55" r="2.8" fill="#1B4332" />
              <line x1="37" y1="64" x2="44" y2="65" stroke="#1B4332" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ) : (
            /* Neutral / Default: Deadpan dot eyes and clean straight line mouth */
            <g>
              <circle cx="36" cy="51" r="2.8" fill="#1B4332" />
              <circle cx="47" cy="56" r="2.8" fill="#1B4332" />
              <line x1="37" y1="65" x2="45" y2="67" stroke="#1B4332" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {/* Vintage Stamp 'GRUB' wordmark on lower front edge */}
          <text
            x="32"
            y="72"
            fontSize="4"
            fontWeight="800"
            letterSpacing="0.8"
            fill="#1B4332"
            fillOpacity="0.4"
            fontFamily="monospace"
            transform="rotate(18 32 72)"
          >
            GRUB
          </text>
        </svg>
      </div>

      {caption && (
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary bg-surface-container-high border border-outline-variant/60 rounded px-2 py-0.5 whitespace-nowrap shadow-xs">
          {caption}
        </span>
      )}
    </div>
  );
}
