'use client';

import { useState } from 'react';
import { clsx } from '@/lib/clsx';
import { Icon } from '@/components/media/Icon';
import { Stocky } from '@/components/mascot/Stocky';

export const STOCKY_PANTRY_QUOTES = [
  "Oi! Shut the door, I'm resting between grocery deliveries.",
  "Sneak peek: I live in the flat's pantry so nobody buys four bags of pasta.",
  "You found me! The secret bouillon cube watching your Tesco basket.",
  "Psst: Grub v2 is going to optimize your shared spice rack too.",
  "Two housemates bought cumin last week. Tragic. I wept.",
  "Keep this between us, but the collector always deserves the first slice.",
];

export interface Appliance {
  id: string;
  name: string;
  category: 'primary' | 'countertop' | 'baking';
  hint: string;
}

export const KITCHEN_APPLIANCES: Appliance[] = [
  { id: 'oven', name: 'Oven', category: 'baking', hint: 'Roasts, pizzas & bakes' },
  { id: 'stovetop_4', name: 'Stovetop', category: 'primary', hint: 'Pan frying, boiling & pasta' },
  { id: 'microwave', name: 'Microwave', category: 'countertop', hint: 'Reheating & quick sides' },
  { id: 'air_fryer', name: 'Air Fryer', category: 'countertop', hint: 'Crispy meals in 15 mins' },
  { id: 'blender', name: 'Blender', category: 'countertop', hint: 'Smoothies, soups & sauces' },
  { id: 'slow_cooker', name: 'Slow Cooker', category: 'countertop', hint: 'Batch curries & stews' },
  { id: 'rice_cooker', name: 'Rice Cooker', category: 'countertop', hint: 'Fluffy rice on demand' },
];

interface KitchenSceneProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function KitchenScene({ selected, onChange }: KitchenSceneProps) {
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stockyQuoteIndex, setStockyQuoteIndex] = useState(0);

  const toggleAppliance = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const isSelected = (id: string) => selected.includes(id);

  return (
    <div className="flex flex-col gap-sm">
      {/* Header bar with live counter badge */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-title-md text-sm font-bold text-on-surface">
            Interactive Flat Kitchen
          </h3>
          <p className="font-body-xs text-[11px] text-on-surface-variant">
            Tap the appliances directly in the kitchen to select what your flat has.
          </p>
        </div>
        <div
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all',
            selected.length > 0
              ? 'bg-primary/10 border border-primary/30 text-primary'
              : 'bg-surface-container text-on-surface-variant'
          )}
        >
          <span
            className={clsx(
              'w-2 h-2 rounded-full transition-colors',
              selected.length > 0 ? 'bg-primary animate-pulse' : 'bg-on-surface-variant/40'
            )}
          />
          <span className="font-numeric-data">{selected.length} Selected</span>
        </div>
      </div>

      {/* Illustrated Kitchen Scene Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/50 shadow-inner bg-[#FAF7F2]">
        <svg
          viewBox="0 0 800 580"
          className="w-full h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Tile grid pattern */}
            <pattern id="backsplashTiles" width="28" height="28" patternUnits="userSpaceOnUse">
              <rect width="28" height="28" fill="#F4F0E8" stroke="#E6E0D4" strokeWidth="1" />
            </pattern>

            {/* Oven glow gradient */}
            <radialGradient id="ovenGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE082" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#FFB74D" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#E65100" stopOpacity="0.2" />
            </radialGradient>

            {/* Smoothie blender gradient */}
            <linearGradient id="smoothieFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F48FB1" />
              <stop offset="100%" stopColor="#C2185B" />
            </linearGradient>

            {/* Stew slow cooker gradient */}
            <linearGradient id="stewFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFB74D" />
              <stop offset="100%" stopColor="#D84315" />
            </linearGradient>
          </defs>

          {/* 1. ROOM WALL & BACKSPLASH */}
          <rect width="800" height="580" fill="#FAF7F2" />
          {/* Backsplash tiles between counter and shelf */}
          <rect x="0" y="160" width="800" height="135" fill="url(#backsplashTiles)" />
          {/* Subtle wall panel division line */}
          <line x1="0" y1="160" x2="800" y2="160" stroke="#E6E0D4" strokeWidth="1.5" />

          {/* 2. UPPER SHELVES */}
          {/* Left shelf under microwave */}
          <rect x="40" y="145" width="190" height="14" rx="2" fill="#C89D73" stroke="#A97C52" strokeWidth="1" />
          {/* Wooden shelf brackets */}
          <polygon points="65,159 65,185 75,185 75,159" fill="#A97C52" />
          <polygon points="190,159 190,185 200,185 200,159" fill="#A97C52" />

          {/* Right decorative shelf */}
          <rect x="580" y="125" width="180" height="14" rx="2" fill="#C89D73" stroke="#A97C52" strokeWidth="1" />
          <polygon points="605,139 605,165 615,165 615,139" fill="#A97C52" />
          <polygon points="725,139 725,165 735,165 735,139" fill="#A97C52" />

          {/* Decor items on right shelf */}
          {/* Terracotta plant pot */}
          <rect x="600" y="92" width="28" height="33" rx="2" fill="#C86D51" />
          <rect x="597" y="90" width="34" height="6" rx="2" fill="#B2593E" />
          {/* Trailing eucalyptus leaves */}
          <path d="M610 90 Q600 65 590 80 Q580 95 585 115 Q580 135 585 145" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="590" cy="78" r="4.5" fill="#40916C" />
          <circle cx="583" cy="98" r="5" fill="#52B788" />
          <circle cx="585" cy="120" r="4.5" fill="#40916C" />
          <circle cx="586" cy="142" r="4" fill="#52B788" />

          {/* Wooden cutting board */}
          <rect x="650" y="70" width="40" height="55" rx="4" fill="#D4A574" stroke="#B38656" strokeWidth="1" />
          <circle cx="670" cy="80" r="4" fill="#FAF7F2" stroke="#B38656" strokeWidth="1" />

          {/* Stacked ceramic bowls */}
          <ellipse cx="720" cy="120" rx="18" ry="6" fill="#D8F3DC" stroke="#1B4332" strokeWidth="1" />
          <ellipse cx="720" cy="113" rx="15" ry="5" fill="#FAF7F2" stroke="#1B4332" strokeWidth="1" />

          {/* 3. COUNTERTOP */}
          {/* Main oak surface */}
          <rect x="0" y="280" width="800" height="22" fill="#D4A574" stroke="#B38656" strokeWidth="1" />
          {/* Wood highlight grain */}
          <line x1="0" y1="284" x2="800" y2="284" stroke="#E5BE94" strokeWidth="1" />
          <line x1="0" y1="292" x2="800" y2="292" stroke="#C49666" strokeWidth="0.8" />

          {/* 4. LOWER CABINETS */}
          {/* Left cabinets */}
          <rect x="0" y="302" width="300" height="200" fill="#2D6A4F" />

          {/* Left top drawer - Cutlery Drawer */}
          <g
            className="cursor-pointer group select-none"
            onClick={() => setDrawerOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
            aria-label="Kitchen cutlery drawer"
          >
            {drawerOpen ? (
              <g className="animate-fade-in">
                {/* Extended drawer body */}
                <rect x="25" y="325" width="250" height="52" rx="4" fill="#1E4734" stroke="#132E20" strokeWidth="1.2" />
                {/* Cutlery divider lines */}
                <line x1="105" y1="332" x2="105" y2="370" stroke="#132E20" strokeWidth="1" />
                <line x1="185" y1="332" x2="185" y2="370" stroke="#132E20" strokeWidth="1" />
                {/* Forks */}
                <rect x="55" y="338" width="4" height="24" rx="1" fill="#CFD8DC" />
                <line x1="53" y1="338" x2="61" y2="338" stroke="#CFD8DC" strokeWidth="2" />
                {/* Wooden Spoons */}
                <rect x="140" y="342" width="4" height="22" rx="1" fill="#C89D73" />
                <ellipse cx="142" cy="340" rx="5" ry="4" fill="#C89D73" />
                {/* Whisk */}
                <rect x="220" y="345" width="3" height="20" rx="1" fill="#B0BEC5" />
                <ellipse cx="221.5" cy="342" rx="4" ry="5" fill="none" stroke="#B0BEC5" strokeWidth="1" />
                {/* Handle */}
                <rect x="135" y="365" width="30" height="5" rx="2.5" fill="#D4A574" />
              </g>
            ) : (
              <>
                <rect x="25" y="318" width="250" height="48" rx="4" fill="#245A42" stroke="#1B4332" strokeWidth="1.2" className="group-hover:brightness-105 transition-all" />
                <rect x="135" y="338" width="30" height="5" rx="2.5" fill="#D4A574" className="group-hover:scale-105 origin-center transition-transform" />
              </>
            )}
          </g>

          {/* Middle drawer */}
          <rect x="25" y="378" width="250" height="55" rx="4" fill="#245A42" stroke="#1B4332" strokeWidth="1.2" />
          <rect x="135" y="401" width="30" height="5" rx="2.5" fill="#D4A574" />
          {/* Bottom drawer */}
          <rect x="25" y="443" width="250" height="50" rx="4" fill="#245A42" stroke="#1B4332" strokeWidth="1.2" />
          <rect x="135" y="465" width="30" height="5" rx="2.5" fill="#D4A574" />

          {/* Right cabinets - SECRET PANTRY */}
          <rect x="500" y="302" width="300" height="200" fill="#2D6A4F" />

          {cabinetOpen ? (
            /* OPEN PANTRY INTERIOR WITH STOCKY */
            <g>
              {/* Dark interior pantry shadow */}
              <rect x="505" y="308" width="285" height="190" rx="3" fill="#132E20" stroke="#0D1F16" strokeWidth="1.5" />

              {/* Upper wooden shelf */}
              <rect x="505" y="388" width="285" height="10" fill="#C89D73" stroke="#A97C52" strokeWidth="0.8" />

              {/* Upper shelf pantry items */}
              {/* Cans of chopped tomatoes */}
              <rect x="525" y="342" width="28" height="46" rx="2" fill="#F8F9FA" stroke="#CFD8DC" strokeWidth="1" />
              <rect x="525" y="354" width="28" height="22" fill="#EE1C2E" />
              <text x="528" y="369" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">TOMS</text>

              <rect x="558" y="342" width="28" height="46" rx="2" fill="#F8F9FA" stroke="#CFD8DC" strokeWidth="1" />
              <rect x="558" y="354" width="28" height="22" fill="#EE1C2E" />
              <text x="561" y="369" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">TOMS</text>

              {/* Olive oil bottle with cork */}
              <rect x="598" y="338" width="22" height="50" rx="3" fill="#FFE082" stroke="#B38656" strokeWidth="1" />
              <rect x="605" y="328" width="8" height="10" rx="1" fill="#C89D73" />
              <line x1="598" y1="360" x2="620" y2="360" stroke="#B38656" strokeWidth="0.8" />

              {/* Bag of pasta with red clip */}
              <rect x="632" y="330" width="42" height="58" rx="4" fill="#FFF8E1" stroke="#FFE082" strokeWidth="1.2" />
              <rect x="643" y="325" width="20" height="6" rx="2" fill="#EE1C2E" />
              <text x="638" y="362" fill="#C49666" fontSize="7" fontWeight="bold" fontFamily="sans-serif">PASTA</text>

              {/* Bouillon cube box on lower shelf */}
              <rect x="525" y="442" width="46" height="50" rx="3" fill="#F4E285" stroke="#1B4332" strokeWidth="1.2" />
              <text x="530" y="468" fill="#1B4332" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">STOCK</text>
              <text x="532" y="478" fill="#2D6A4F" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">CUBES</text>

              {/* Wooden riser for Stocky */}
              <rect x="590" y="478" width="105" height="18" rx="2" fill="#C89D73" stroke="#A97C52" strokeWidth="1" />

              {/* STOCKY HIMSELF SITTING ON THE SHELF */}
              <g
                transform="translate(610, 395) scale(0.95)"
                className="cursor-pointer group select-none transition-transform hover:scale-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setStockyQuoteIndex((prev) => (prev + 1) % STOCKY_PANTRY_QUOTES.length);
                }}
              >
                {/* Cast Shadow */}
                <polygon points="24,78 72,78 88,88 38,88" fill="#1B4332" fillOpacity="0.35" />

                {/* Top Isometric Face (Foil wrapper top) */}
                <polygon points="24,34 56,16 88,34 56,52" fill="#F4E285" stroke="#1B4332" strokeWidth="2.5" strokeLinejoin="round" />
                <line x1="24" y1="34" x2="88" y2="34" stroke="#1B4332" strokeWidth="1.2" strokeDasharray="2 2" strokeOpacity="0.6" />

                {/* Right Isometric Face (Foil envelope fold) */}
                <polygon points="56,52 88,34 88,72 56,88" fill="#1B4332" stroke="#1B4332" strokeWidth="2.5" strokeLinejoin="round" />
                <line x1="56" y1="52" x2="88" y2="72" stroke="#2D6A4F" strokeWidth="1.5" />
                <line x1="56" y1="88" x2="88" y2="34" stroke="#2D6A4F" strokeWidth="1.5" />

                {/* Left Isometric Face (Vintage grocer green body) */}
                <polygon points="24,34 56,52 56,88 24,72" fill="#2D6A4F" stroke="#1B4332" strokeWidth="2.5" strokeLinejoin="round" />

                {/* Front label banner */}
                <polygon points="28,42 52,55 52,65 28,52" fill="#F4E285" stroke="#1B4332" strokeWidth="1.2" />

                {/* Eyes */}
                <circle cx="37" cy="56" r="2.5" fill="#1B4332" />
                <circle cx="47" cy="62" r="2.5" fill="#1B4332" />
                <circle cx="36.2" cy="55.2" r="0.8" fill="#FAF7F2" />
                <circle cx="46.2" cy="61.2" r="0.8" fill="#FAF7F2" />

                {/* Smug smile */}
                <path d="M37 63 Q43 68 49 67" fill="none" stroke="#1B4332" strokeWidth="1.6" strokeLinecap="round" />

                {/* Cheeks */}
                <ellipse cx="34" cy="61" rx="2.5" ry="1.5" fill="#EE1C2E" fillOpacity="0.3" />
                <ellipse cx="50" cy="68" rx="2.5" ry="1.5" fill="#EE1C2E" fillOpacity="0.3" />

                <text x="31" y="50" fill="#1B4332" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">STOCKY</text>
              </g>

              {/* Swung Open Left Door */}
              <polygon
                points="505,310 522,314 522,492 505,498"
                fill="#245A42"
                stroke="#1B4332"
                strokeWidth="1.4"
                className="cursor-pointer hover:brightness-110"
                onClick={() => setCabinetOpen(false)}
              />
              <rect x="517" y="395" width="3" height="24" rx="1.5" fill="#D4A574" />

              {/* Swung Open Right Door */}
              <polygon
                points="785,310 768,314 768,492 785,498"
                fill="#245A42"
                stroke="#1B4332"
                strokeWidth="1.4"
                className="cursor-pointer hover:brightness-110"
                onClick={() => setCabinetOpen(false)}
              />
              <rect x="769" y="395" width="3" height="24" rx="1.5" fill="#D4A574" />

              {/* Speech balloon from Stocky */}
              <g transform="translate(515, 316)">
                <rect x="0" y="0" width="265" height="66" rx="8" fill="#FAF7F2" stroke="#1B4332" strokeWidth="1.5" />
                <polygon points="130,66 138,74 146,66" fill="#FAF7F2" stroke="#1B4332" strokeWidth="1.5" />
                <line x1="131" y1="65" x2="145" y2="65" stroke="#FAF7F2" strokeWidth="2.5" />
                <text x="10" y="18" fill="#D66A4E" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                  🎉 SNEAK PEEK UNLOCKED!
                </text>
                <text x="10" y="34" fill="#1B4332" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                  &ldquo;{STOCKY_PANTRY_QUOTES[stockyQuoteIndex]}&rdquo;
                </text>
                <text x="10" y="50" fill="#2D6A4F" fontSize="8.5" fontWeight="500" fontFamily="sans-serif">
                  Tap Stocky for more · Tap doors to close
                </text>
              </g>
            </g>
          ) : (
            /* CLOSED PANTRY DOORS */
            <g
              className="cursor-pointer group select-none"
              role="button"
              tabIndex={0}
              onClick={() => setCabinetOpen(true)}
              aria-label="Pantry cabinet (tap to open secret feature)"
            >
              {/* Right paneled doors */}
              <rect
                x="515"
                y="318"
                width="125"
                height="175"
                rx="4"
                fill="#245A42"
                stroke="#1B4332"
                strokeWidth="1.2"
                className="transition-all group-hover:brightness-110"
              />
              <rect x="625" y="390" width="5" height="32" rx="2.5" fill="#D4A574" className="transition-transform group-hover:scale-105 origin-center" />
              <rect
                x="655"
                y="318"
                width="120"
                height="175"
                rx="4"
                fill="#245A42"
                stroke="#1B4332"
                strokeWidth="1.2"
                className="transition-all group-hover:brightness-110"
              />
              <rect x="665" y="390" width="5" height="32" rx="2.5" fill="#D4A574" className="transition-transform group-hover:scale-105 origin-center" />

              {/* Playful sparkling keyhole hint */}
              <circle cx="645" cy="406" r="3.5" fill="#F4E285" className="animate-pulse" />
            </g>
          )}

          {/* 5. FLOOR & BOHO HALF-SUN RUG */}
          <rect x="0" y="502" width="800" height="78" fill="#EAE2D5" />
          <line x1="0" y1="525" x2="800" y2="525" stroke="#DFD6C8" strokeWidth="1" />
          <line x1="0" y1="550" x2="800" y2="550" stroke="#DFD6C8" strokeWidth="1" />

          {/* Half sun woven rug in front of oven */}
          <g transform="translate(400, 502)">
            {/* Outer rug arch */}
            <path d="M-150 0 A 150 70 0 0 1 150 0 Z" fill="#F4EFE6" stroke="#D8CFC0" strokeWidth="1.5" />
            {/* Terracotta arch */}
            <path d="M-115 0 A 115 52 0 0 1 115 0 Z" fill="#D66A4E" />
            {/* Mustard sun core */}
            <path d="M-65 0 A 65 30 0 0 1 65 0 Z" fill="#E5A93C" />
            {/* Sun rays */}
            <line x1="0" y1="-30" x2="0" y2="-45" stroke="#F4EFE6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-35" y1="-25" x2="-45" y2="-38" stroke="#F4EFE6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="35" y1="-25" x2="45" y2="-38" stroke="#F4EFE6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-60" y1="-10" x2="-75" y2="-15" stroke="#F4EFE6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="60" y1="-10" x2="75" y2="-15" stroke="#F4EFE6" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* ============================================================ */}
          {/* APPLIANCES — INTERACTIVE CLICK TARGETS WITH ILLUSTRATED ART */}
          {/* ============================================================ */}

          {/* 1. MICROWAVE (Top shelf) */}
          <g
            onClick={() => toggleAppliance('microwave')}
            className="cursor-pointer group"
            role="button"
            aria-pressed={isSelected('microwave')}
            tabIndex={0}
          >
            {/* Microwave body */}
            <rect x="52" y="52" width="165" height="92" rx="8" fill="#F8F9FA" stroke="#CFD8DC" strokeWidth="2" />
            {/* Glass door */}
            <rect x="60" y="60" width="112" height="76" rx="5" fill="#263238" stroke="#37474F" strokeWidth="1.5" />
            {/* Internal turntable platter */}
            <ellipse cx="116" cy="115" rx="36" ry="10" fill="#455A64" opacity="0.6" />
            {/* Door handle bar */}
            <rect x="160" y="70" width="6" height="56" rx="3" fill="#ECEFF1" stroke="#B0BEC5" strokeWidth="1" />
            {/* Control panel on right */}
            <rect x="178" y="60" width="32" height="76" rx="4" fill="#ECEFF1" />
            {/* Digital LED display */}
            <rect x="182" y="66" width="24" height="15" rx="2" fill="#1B262C" />
            <text x="194" y="77" textAnchor="middle" fill="#00E676" fontSize="9" fontWeight="bold" fontFamily="monospace">12:00</text>
            {/* Keypad dots & dial */}
            <circle cx="188" cy="90" r="2" fill="#78909C" />
            <circle cx="200" cy="90" r="2" fill="#78909C" />
            <circle cx="188" cy="98" r="2" fill="#78909C" />
            <circle cx="200" cy="98" r="2" fill="#78909C" />
            <circle cx="194" cy="116" r="7" fill="#CFD8DC" stroke="#90A4AE" strokeWidth="1" />

            {/* Selected highlight border & checkmark badge */}
            {isSelected('microwave') ? (
              <>
                <rect x="48" y="48" width="173" height="100" rx="10" fill="rgba(45, 106, 79, 0.08)" stroke="#1B4332" strokeWidth="3" />
                <g transform="translate(210, 52)">
                  <circle r="12" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M-4.5 0 L-1.5 3 L5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <rect x="85" y="128" width="100" height="18" rx="9" fill="#1B4332" />
                <text x="135" y="141" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">Microwave</text>
              </>
            ) : (
              <rect x="48" y="48" width="173" height="100" rx="10" fill="transparent" stroke="#2D6A4F" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </g>

          {/* 2. AIR FRYER (Countertop Left) */}
          <g
            onClick={() => toggleAppliance('air_fryer')}
            className="cursor-pointer group"
            role="button"
            aria-pressed={isSelected('air_fryer')}
            tabIndex={0}
          >
            {/* Air Fryer body (curved pod) */}
            <path
              d="M50 280 L50 215 C50 195, 62 182, 85 180 L125 180 C148 182, 160 195, 160 215 L160 280 Z"
              fill="#2C3E50"
              stroke="#1A252F"
              strokeWidth="2"
            />
            {/* Top touch panel */}
            <path
              d="M65 184 L145 184 C152 184, 154 189, 150 196 L140 215 L70 215 L60 196 C56 189, 58 184, 65 184 Z"
              fill="#1A252F"
            />
            <text x="105" y="204" textAnchor="middle" fill="#FF7043" fontSize="10" fontWeight="bold" fontFamily="monospace">200°C</text>
            {/* Basket seam */}
            <path d="M54 225 L156 225" stroke="#1A252F" strokeWidth="1.5" />
            {/* Basket pull handle */}
            <rect x="94" y="235" width="22" height="36" rx="4" fill="#34495E" stroke="#1A252F" strokeWidth="1.5" />
            <rect x="98" y="242" width="14" height="22" rx="2" fill="#1A252F" />
            {/* Chrome accent line */}
            <path d="M58 274 L152 274" stroke="#95A5A6" strokeWidth="1.2" />

            {/* Selected highlight */}
            {isSelected('air_fryer') ? (
              <>
                <rect x="42" y="174" width="126" height="112" rx="10" fill="rgba(45, 106, 79, 0.08)" stroke="#1B4332" strokeWidth="3" />
                <g transform="translate(158, 180)">
                  <circle r="12" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M-4.5 0 L-1.5 3 L5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <rect x="58" y="266" width="94" height="18" rx="9" fill="#1B4332" />
                <text x="105" y="279" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">Air Fryer</text>
              </>
            ) : (
              <rect x="42" y="174" width="126" height="112" rx="10" fill="transparent" stroke="#2D6A4F" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </g>

          {/* 3. BLENDER (Countertop Mid-Left) */}
          <g
            onClick={() => toggleAppliance('blender')}
            className="cursor-pointer group"
            role="button"
            aria-pressed={isSelected('blender')}
            tabIndex={0}
          >
            {/* Motor Base */}
            <path d="M185 280 L188 245 L242 245 L245 280 Z" fill="#37474F" stroke="#263238" strokeWidth="1.5" />
            {/* Speed Dial knob */}
            <circle cx="215" cy="262" r="7" fill="#B0BEC5" stroke="#263238" strokeWidth="1" />
            <line x1="215" y1="258" x2="215" y2="264" stroke="#263238" strokeWidth="1.5" />
            {/* Glass Pitcher */}
            <path d="M192 244 L196 172 L234 172 L238 244 Z" fill="#E0F7FA" stroke="#80DEEA" strokeWidth="1.5" opacity="0.9" />
            {/* Smoothie inside */}
            <path d="M193 243 L195 195 L235 195 L237 243 Z" fill="url(#smoothieFill)" opacity="0.85" />
            {/* Measurement lines */}
            <line x1="230" y1="205" x2="234" y2="205" stroke="#FFFFFF" strokeWidth="1" />
            <line x1="228" y1="215" x2="234" y2="215" stroke="#FFFFFF" strokeWidth="1" />
            <line x1="230" y1="225" x2="234" y2="225" stroke="#FFFFFF" strokeWidth="1" />
            {/* Pitcher Handle */}
            <path d="M236 182 C248 185, 250 220, 237 228" fill="none" stroke="#80DEEA" strokeWidth="3" strokeLinecap="round" />
            {/* Pitcher Lid */}
            <rect x="194" y="165" width="42" height="8" rx="2" fill="#263238" />
            <rect x="210" y="161" width="10" height="5" rx="1.5" fill="#37474F" />

            {/* Selected highlight */}
            {isSelected('blender') ? (
              <>
                <rect x="178" y="156" width="76" height="130" rx="10" fill="rgba(45, 106, 79, 0.08)" stroke="#1B4332" strokeWidth="3" />
                <g transform="translate(244, 164)">
                  <circle r="12" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M-4.5 0 L-1.5 3 L5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <rect x="176" y="266" width="80" height="18" rx="9" fill="#1B4332" />
                <text x="216" y="279" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">Blender</text>
              </>
            ) : (
              <rect x="178" y="156" width="76" height="130" rx="10" fill="transparent" stroke="#2D6A4F" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </g>

          {/* 4. STOVETOP (Center Range Top with Burners and Cooking Pot) */}
          <g
            onClick={() => toggleAppliance('stovetop_4')}
            className="cursor-pointer group"
            role="button"
            aria-pressed={isSelected('stovetop_4')}
            tabIndex={0}
          >
            {/* Stove top deck */}
            <rect x="300" y="270" width="200" height="12" fill="#37474F" stroke="#263238" strokeWidth="1" />
            {/* Burner trivets */}
            <ellipse cx="335" cy="275" rx="18" ry="4" fill="#263238" stroke="#1A252F" strokeWidth="1.5" />
            <ellipse cx="465" cy="275" rx="18" ry="4" fill="#263238" stroke="#1A252F" strokeWidth="1.5" />
            <ellipse cx="370" cy="275" rx="14" ry="3.5" fill="#263238" stroke="#1A252F" strokeWidth="1.5" />

            {/* Cozy Cooking Dutch Oven Pot on rear burner */}
            <g transform="translate(390, 232)">
              {/* Pot body */}
              <rect x="0" y="15" width="55" height="28" rx="6" fill="#2D6A4F" stroke="#1B4332" strokeWidth="1.5" />
              {/* Handles */}
              <rect x="-6" y="20" width="7" height="6" rx="2" fill="#1B4332" />
              <rect x="54" y="20" width="7" height="6" rx="2" fill="#1B4332" />
              {/* Lid */}
              <path d="M0 16 Q27.5 7 55 16 Z" fill="#245A42" stroke="#1B4332" strokeWidth="1.5" />
              {/* Lid Knob */}
              <rect x="24" y="5" width="7" height="5" rx="1.5" fill="#D4A574" />
              {/* Gentle steam curls */}
              <path d="M22 2 Q20 -6 24 -12" fill="none" stroke="#B0BEC5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
              <path d="M30 3 Q33 -5 29 -11" fill="none" stroke="#B0BEC5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* Selected highlight */}
            {isSelected('stovetop_4') ? (
              <>
                <rect x="295" y="222" width="210" height="64" rx="8" fill="rgba(45, 106, 79, 0.08)" stroke="#1B4332" strokeWidth="3" />
                <g transform="translate(495, 230)">
                  <circle r="12" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M-4.5 0 L-1.5 3 L5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <rect x="350" y="260" width="100" height="18" rx="9" fill="#1B4332" />
                <text x="400" y="273" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">Stovetop (Hob)</text>
              </>
            ) : (
              <rect x="295" y="222" width="210" height="64" rx="8" fill="transparent" stroke="#2D6A4F" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </g>

          {/* 5. OVEN (Center Freestanding Range & Window) */}
          <g
            onClick={() => toggleAppliance('oven')}
            className="cursor-pointer group"
            role="button"
            aria-pressed={isSelected('oven')}
            tabIndex={0}
          >
            {/* Stove front body / frame */}
            <rect x="300" y="282" width="200" height="220" fill="#ECEFF1" stroke="#37474F" strokeWidth="2" />

            {/* Stove control knobs panel */}
            <rect x="300" y="282" width="200" height="34" fill="#CFD8DC" stroke="#B0BEC5" strokeWidth="1" />
            {/* 5 rotary knobs */}
            <circle cx="325" cy="299" r="6" fill="#37474F" />
            <circle cx="350" cy="299" r="6" fill="#37474F" />
            {/* Central digital timer */}
            <rect x="382" y="291" width="36" height="16" rx="2" fill="#212121" />
            <text x="400" y="303" textAnchor="middle" fill="#00E676" fontSize="9" fontWeight="bold" fontFamily="monospace">180°C</text>
            <circle cx="450" cy="299" r="6" fill="#37474F" />
            <circle cx="475" cy="299" r="6" fill="#37474F" />

            {/* Oven Door */}
            <rect x="310" y="322" width="180" height="162" rx="4" fill="#37474F" stroke="#263238" strokeWidth="2" />
            {/* Door Handle */}
            <rect x="328" y="330" width="144" height="7" rx="3.5" fill="#ECEFF1" stroke="#90A4AE" strokeWidth="1" />

            {/* Oven Window Glass */}
            <rect
              x="325"
              y="348"
              width="150"
              height="118"
              rx="4"
              fill={isSelected('oven') ? 'url(#ovenGlow)' : '#212121'}
              stroke="#455A64"
              strokeWidth="2"
            />
            {/* Wire oven racks inside */}
            <line x1="335" y1="385" x2="465" y2="385" stroke={isSelected('oven') ? '#B26A00' : '#424242'} strokeWidth="1.5" />
            <line x1="335" y1="420" x2="465" y2="420" stroke={isSelected('oven') ? '#B26A00' : '#424242'} strokeWidth="1.5" />
            {isSelected('oven') && (
              <ellipse cx="400" cy="407" rx="45" ry="12" fill="#FFE082" opacity="0.35" />
            )}

            {/* Bottom storage drawer */}
            <rect x="310" y="488" width="180" height="12" fill="#B0BEC5" />

            {/* Selected highlight */}
            {isSelected('oven') ? (
              <>
                <rect x="304" y="318" width="192" height="170" rx="8" fill="rgba(45, 106, 79, 0.08)" stroke="#1B4332" strokeWidth="3.5" />
                <g transform="translate(488, 328)">
                  <circle r="12" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M-4.5 0 L-1.5 3 L5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <rect x="360" y="450" width="80" height="20" rx="10" fill="#1B4332" />
                <text x="400" y="464" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">Oven</text>
              </>
            ) : (
              <rect x="304" y="318" width="192" height="170" rx="8" fill="transparent" stroke="#2D6A4F" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </g>

          {/* 6. SLOW COOKER (Countertop Mid-Right) */}
          <g
            onClick={() => toggleAppliance('slow_cooker')}
            className="cursor-pointer group"
            role="button"
            aria-pressed={isSelected('slow_cooker')}
            tabIndex={0}
          >
            {/* Stainless / White Base */}
            <rect x="525" y="235" width="105" height="45" rx="12" fill="#ECEFF1" stroke="#90A4AE" strokeWidth="1.5" />
            {/* Side Handles */}
            <rect x="518" y="244" width="8" height="14" rx="3" fill="#37474F" />
            <rect x="629" y="244" width="8" height="14" rx="3" fill="#37474F" />
            {/* Front control knob */}
            <circle cx="577" cy="257" r="6" fill="#37474F" />
            <circle cx="590" cy="257" r="2" fill="#E53935" />
            {/* Ceramic crockpot rim */}
            <ellipse cx="577" cy="235" rx="46" ry="12" fill="#212121" stroke="#90A4AE" strokeWidth="1" />
            {/* Stew inside */}
            <ellipse cx="577" cy="236" rx="42" ry="9" fill="url(#stewFill)" />
            {/* Glass Lid */}
            <path d="M536 235 Q577 218 618 235 Z" fill="#CFD8DC" opacity="0.6" stroke="#90A4AE" strokeWidth="1" />
            {/* Lid knob */}
            <circle cx="577" cy="222" r="5" fill="#263238" />

            {/* Selected highlight */}
            {isSelected('slow_cooker') ? (
              <>
                <rect x="512" y="214" width="132" height="70" rx="10" fill="rgba(45, 106, 79, 0.08)" stroke="#1B4332" strokeWidth="3" />
                <g transform="translate(638, 222)">
                  <circle r="12" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M-4.5 0 L-1.5 3 L5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <rect x="532" y="266" width="90" height="18" rx="9" fill="#1B4332" />
                <text x="577" y="279" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">Slow Cooker</text>
              </>
            ) : (
              <rect x="512" y="214" width="132" height="70" rx="10" fill="transparent" stroke="#2D6A4F" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </g>

          {/* 7. RICE COOKER (Countertop Right) */}
          <g
            onClick={() => toggleAppliance('rice_cooker')}
            className="cursor-pointer group"
            role="button"
            aria-pressed={isSelected('rice_cooker')}
            tabIndex={0}
          >
            {/* Japanese style rice cooker body */}
            <path
              d="M660 280 L660 230 C660 215, 672 204, 705 204 C738 204, 750 215, 750 230 L750 280 Z"
              fill="#FFFFFF"
              stroke="#CFD8DC"
              strokeWidth="2"
            />
            {/* Top lid flip seam */}
            <path d="M662 225 Q705 220 748 225" stroke="#B0BEC5" strokeWidth="1.5" fill="none" />
            {/* Chrome open latch */}
            <rect x="700" y="222" width="10" height="6" rx="1.5" fill="#CFD8DC" stroke="#78909C" strokeWidth="0.8" />
            {/* Top steam cap */}
            <ellipse cx="705" cy="204" rx="8" ry="3" fill="#ECEFF1" stroke="#90A4AE" strokeWidth="1" />
            {/* Front control switch */}
            <rect x="692" y="242" width="26" height="22" rx="3" fill="#ECEFF1" stroke="#B0BEC5" strokeWidth="1" />
            <circle cx="700" cy="250" r="2.5" fill="#FFB300" />
            <circle cx="710" cy="250" r="2.5" fill="#43A047" />
            <rect x="698" y="256" width="14" height="4" rx="1.5" fill="#78909C" />

            {/* Selected highlight */}
            {isSelected('rice_cooker') ? (
              <>
                <rect x="652" y="196" width="106" height="88" rx="10" fill="rgba(45, 106, 79, 0.08)" stroke="#1B4332" strokeWidth="3" />
                <g transform="translate(752, 202)">
                  <circle r="12" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M-4.5 0 L-1.5 3 L5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <rect x="660" y="266" width="90" height="18" rx="9" fill="#1B4332" />
                <text x="705" y="279" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">Rice Cooker</text>
              </>
            ) : (
              <rect x="652" y="196" width="106" height="88" rx="10" fill="transparent" stroke="#2D6A4F" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </g>
        </svg>
      </div>

      {/* Secret Sneak Peek Card when Cabinet is Open */}
      {cabinetOpen && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-secondary-fixed/30 via-surface-container-lowest to-secondary-fixed/20 border-2 border-secondary/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-ambient-card animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <Stocky mood="smug" size="sm" className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-caps text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary text-on-secondary shadow-xs">
                  🎉 Secret Sneak Peek Unlocked
                </span>
                <span className="text-xs font-bold text-on-surface">
                  Stocky lives in the pantry!
                </span>
              </div>
              <p className="font-body-xs text-xs text-on-surface-variant mt-1 leading-relaxed italic">
                &ldquo;{STOCKY_PANTRY_QUOTES[stockyQuoteIndex]}&rdquo;
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setStockyQuoteIndex((prev) => (prev + 1) % STOCKY_PANTRY_QUOTES.length)}
              className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface text-xs font-bold transition-colors cursor-pointer"
            >
              Ask Stocky
            </button>
            <button
              type="button"
              onClick={() => setCabinetOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
            >
              Close Cupboard
            </button>
          </div>
        </div>
      )}

      {/* Drawer hint if user opened the cutlery drawer */}
      {drawerOpen && !cabinetOpen && (
        <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs animate-fade-in">
          <span className="text-on-surface-variant flex items-center gap-2">
            <span>🍴</span>
            <span><strong>Cutlery drawer:</strong> Just spoons & whisks here! Try clicking the right cabinet doors ➔</span>
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="text-on-surface-variant hover:text-primary font-bold text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* Quick Interactive Pills Tray below kitchen */}
      <div className="flex flex-col gap-xs pt-1">
        <span className="font-body-xs text-[10px] text-on-surface-variant font-medium text-center">
          Tap above or toggle appliances below:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {KITCHEN_APPLIANCES.map((app) => {
            const active = isSelected(app.id);
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => toggleAppliance(app.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all btn-tactile cursor-pointer',
                  active
                    ? 'bg-primary text-on-primary shadow-sm ring-1 ring-primary'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                )}
              >
                <span
                  className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                    active ? 'bg-white/25 text-white' : 'bg-outline-variant/30 text-transparent'
                  )}
                >
                  ✓
                </span>
                <span>{app.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
