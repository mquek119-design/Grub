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

const SIZE_MAP = {
  sm: 'w-9 h-9',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

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
          'relative shrink-0 transition-transform duration-300',
          animate && 'hover:scale-105 active:scale-95'
        )}
        aria-label={`Stocky the bouillon cube mascot (${mood})`}
        role="img"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Subtle Ground Shadow */}
          <ellipse cx="50" cy="92" rx="32" ry="5" fill="#1B4332" fillOpacity="0.12" />

          {/* Cube Back Depth & Isometric Foil Fold (Top & Right sides) */}
          <path
            d="M24 24 L76 24 L86 16 L34 16 Z"
            fill="#D97706"
            className="transition-colors"
          />
          <path
            d="M76 24 L86 16 L86 68 L76 76 Z"
            fill="#B45309"
            className="transition-colors"
          />

          {/* Foil Wrap Corner Crease Lines */}
          <path
            d="M76 24 L86 16 M76 76 L86 68"
            stroke="#FDE68A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M81 20 L81 68"
            stroke="#92400E"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Main Front Cube Face */}
          <rect
            x="20"
            y="24"
            width="56"
            height="52"
            rx="10"
            fill="#E9B949"
            stroke="#1B4332"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Foil Shine Highlights */}
          <path
            d="M26 30 C26 28, 28 26, 31 26 L42 26"
            stroke="#FEF3C7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="28" cy="38" r="2" fill="#FEF3C7" />

          {/* Little Feet */}
          <ellipse cx="36" cy="78" rx="7" ry="4" fill="#D97706" stroke="#1B4332" strokeWidth="2.5" />
          <ellipse cx="60" cy="78" rx="7" ry="4" fill="#D97706" stroke="#1B4332" strokeWidth="2.5" />

          {/* Little Arms / Hands */}
          {mood === 'smug' ? (
            <>
              {/* Hands on hips */}
              <path
                d="M20 54 C13 54, 13 64, 21 64"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M76 54 C83 54, 83 64, 75 64"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : mood === 'stressed' ? (
            <>
              {/* Arms clutching cheeks */}
              <path
                d="M17 48 C21 44, 26 48, 26 54"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M79 48 C75 44, 70 48, 70 54"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : mood === 'cooking' ? (
            <>
              {/* Left hand waving, right holding wooden spoon */}
              <path
                d="M20 52 C12 48, 12 40, 18 36"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Wooden Spoon */}
              <path d="M78 62 L88 38" stroke="#A16207" strokeWidth="3" strokeLinecap="round" />
              <ellipse
                cx="90"
                cy="34"
                rx="5"
                ry="7"
                transform="rotate(20 90 34)"
                fill="#CA8A04"
                stroke="#1B4332"
                strokeWidth="2.5"
              />
              <path
                d="M74 54 C78 52, 82 56, 80 60"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : mood === 'split' ? (
            <>
              {/* Left hand holding shiny coin or mini receipt ribbon */}
              <path
                d="M20 52 C14 56, 14 62, 22 62"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Golden £ Coin */}
              <circle cx="16" cy="46" r="6.5" fill="#FBBF24" stroke="#1B4332" strokeWidth="2" />
              <text
                x="16"
                y="49.5"
                textAnchor="middle"
                fontSize="8"
                fontWeight="900"
                fill="#1B4332"
                fontFamily="sans-serif"
              >
                £
              </text>
              <path
                d="M76 52 C82 56, 82 62, 74 62"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              {/* Friendly open arms */}
              <path
                d="M20 52 C14 52, 12 60, 20 62"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M76 52 C82 52, 84 60, 76 62"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}

          {/* Cheeks / Blush */}
          <ellipse cx="32" cy="54" rx="4.5" ry="2.5" fill="#F87171" fillOpacity="0.45" />
          <ellipse cx="64" cy="54" rx="4.5" ry="2.5" fill="#F87171" fillOpacity="0.45" />

          {/* FACIAL EXPRESSIONS */}
          {mood === 'asleep' ? (
            <>
              {/* Closed curved sleeping eyes */}
              <path
                d="M32 46 C35 49, 39 49, 42 46"
                stroke="#1B4332"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M54 46 C57 49, 61 49, 64 46"
                stroke="#1B4332"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Tiny relaxed mouth */}
              <circle cx="48" cy="56" r="2" fill="#1B4332" />
              {/* Floating 'Z z' */}
              <text
                x="68"
                y="30"
                fontSize="11"
                fontWeight="bold"
                fill="#2D6A4F"
                className="animate-pulse"
              >
                z
              </text>
              <text
                x="76"
                y="20"
                fontSize="14"
                fontWeight="extrabold"
                fill="#1B4332"
                className="animate-pulse"
              >
                Z
              </text>
            </>
          ) : mood === 'stressed' ? (
            <>
              {/* Wide alarmed eyes */}
              <circle cx="36" cy="45" r="5" fill="#1B4332" />
              <circle cx="60" cy="45" r="5" fill="#1B4332" />
              <circle cx="37.5" cy="43.5" r="1.8" fill="#FFF" />
              <circle cx="61.5" cy="43.5" r="1.8" fill="#FFF" />
              {/* Wavy nervous mouth */}
              <path
                d="M38 58 Q43 54, 48 58 T58 58"
                stroke="#1B4332"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Sweat Drop */}
              <path
                d="M72 32 C72 32, 69 37, 72 40 C74 42, 77 40, 77 37 C77 34, 72 32, 72 32 Z"
                fill="#38BDF8"
                stroke="#0284C7"
                strokeWidth="1"
              />
            </>
          ) : mood === 'smug' ? (
            <>
              {/* Smug / Winking eye */}
              <path
                d="M32 46 C35 43, 39 43, 42 46"
                stroke="#1B4332"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Big confident eye */}
              <circle cx="60" cy="44" r="5.5" fill="#1B4332" />
              <circle cx="58.5" cy="42" r="2" fill="#FFF" />
              {/* Smug side grin */}
              <path
                d="M40 54 Q48 57, 56 52"
                stroke="#1B4332"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Sparkle star */}
              <path
                d="M74 24 L76 28 L80 30 L76 32 L74 36 L72 32 L68 30 L72 28 Z"
                fill="#FBBF24"
              />
            </>
          ) : mood === 'cooking' ? (
            <>
              {/* Chef Toque / Mini Hat on head */}
              <path
                d="M38 24 C36 17, 44 14, 48 16 C52 13, 60 17, 58 24 Z"
                fill="#FFFFFF"
                stroke="#1B4332"
                strokeWidth="2.5"
              />
              <rect
                x="38"
                y="22"
                width="20"
                height="4"
                rx="1"
                fill="#FFFFFF"
                stroke="#1B4332"
                strokeWidth="2"
              />
              {/* Excited cooking eyes */}
              <circle cx="36" cy="45" r="5.5" fill="#1B4332" />
              <circle cx="60" cy="45" r="5.5" fill="#1B4332" />
              <circle cx="34.5" cy="43" r="2" fill="#FFF" />
              <circle cx="58.5" cy="43" r="2" fill="#FFF" />
              {/* Big open happy mouth */}
              <path
                d="M40 53 Q48 64, 56 53 Z"
                fill="#991B1B"
                stroke="#1B4332"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d="M44 57 Q48 60, 52 57" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Neutral / Happy eyes */}
              <circle cx="36" cy="45" r="5" fill="#1B4332" />
              <circle cx="60" cy="45" r="5" fill="#1B4332" />
              <circle cx="34.5" cy="43" r="1.8" fill="#FFF" />
              <circle cx="58.5" cy="43" r="1.8" fill="#FFF" />
              {/* Cute gentle curve smile */}
              <path
                d="M40 54 Q48 61, 56 54"
                stroke="#1B4332"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}

          {/* Mini Apron with 'GRUB' tag (present in cooking/split or default) */}
          {(mood === 'cooking' || mood === 'split' || mood === 'smug') && (
            <g>
              <path
                d="M38 64 L58 64 L56 74 L40 74 Z"
                fill="#1B4332"
                stroke="#1B4332"
                strokeWidth="1.5"
              />
              <text
                x="48"
                y="71.5"
                textAnchor="middle"
                fontSize="5.5"
                fontWeight="900"
                fill="#F7F5EF"
                letterSpacing="0.5"
                fontFamily="sans-serif"
              >
                GRUB
              </text>
            </g>
          )}
        </svg>
      </div>

      {caption && (
        <div className="px-2.5 py-1 rounded-xl bg-surface-container-high border border-outline-variant/50 text-[11px] font-semibold text-on-surface shadow-xs animate-fade-in whitespace-nowrap">
          {caption}
        </div>
      )}
    </div>
  );
}
