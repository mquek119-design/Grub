'use client';

import { clsx } from '@/lib/clsx';
import { Icon } from '@/components/media/Icon';

export interface Appliance {
  id: string;
  name: string;
  icon: string;
  hint: string;
}

export const KITCHEN_APPLIANCES: Appliance[] = [
  { id: 'oven', name: 'Oven', icon: 'oven_gen', hint: 'Roasts, bakes & pizzas' },
  { id: 'stovetop_4', name: '4-Ring Stovetop', icon: 'skillet', hint: 'Full shared cooking space' },
  { id: 'stovetop_2', name: '2-Ring Hob', icon: 'cooking', hint: 'Campus kitchens (Rootes)' },
  { id: 'microwave', name: 'Microwave', icon: 'microwave', hint: 'Reheating & quick sides' },
  { id: 'air_fryer', name: 'Air Fryer', icon: 'mode_heat', hint: 'Quick crispy dinners' },
  { id: 'rice_cooker', name: 'Rice Cooker', icon: 'rice_bowl', hint: 'Fluffy rice on demand' },
  { id: 'blender', name: 'Blender', icon: 'blender', hint: 'Smoothies & sauces' },
  { id: 'slow_cooker', name: 'Slow Cooker', icon: 'soup_kitchen', hint: 'Batch stews & curries' },
];

interface KitchenSceneProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * Interactive illustrated kitchen scene in the Grub aesthetic.
 * Cream walls, sage-green cabinets, warm wood countertop.
 * Each appliance is tappable with a checkmark overlay when selected.
 */
export function KitchenScene({ selected, onChange }: KitchenSceneProps) {
  const toggleAppliance = (id: string) => {
    // If selecting 2-ring hob, unselect 4-ring and vice-versa
    if (id === 'stovetop_2') {
      const next = selected.filter((x) => x !== 'stovetop_4');
      onChange(next.includes(id) ? next.filter((x) => x !== id) : [...next, id]);
      return;
    }
    if (id === 'stovetop_4') {
      const next = selected.filter((x) => x !== 'stovetop_2');
      onChange(next.includes(id) ? next.filter((x) => x !== id) : [...next, id]);
      return;
    }

    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-title-md text-title-md font-bold text-on-surface">
            Your Kitchen
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Tap the appliances your flat has. Grub filters recipes to what you can actually cook.
          </p>
        </div>
        <span className="text-xs font-bold font-numeric-data text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {selected.length} Selected
        </span>
      </div>

      {/* Kitchen illustration */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/40">
        <svg
          viewBox="0 0 400 320"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Wall */}
          <rect width="400" height="320" fill="#FAF7F2" />

          {/* Wall tile pattern (subtle) */}
          <pattern id="tiles" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none" stroke="#E8E4DC" strokeWidth="0.5" />
          </pattern>
          <rect width="400" height="160" fill="url(#tiles)" />

          {/* Window */}
          <rect x="150" y="12" width="100" height="70" rx="4" fill="#D8F3DC" stroke="#1B4332" strokeWidth="1.5" />
          <line x1="200" y1="12" x2="200" y2="82" stroke="#1B4332" strokeWidth="1" />
          <line x1="150" y1="47" x2="250" y2="47" stroke="#1B4332" strokeWidth="1" />
          {/* Window sill */}
          <rect x="145" y="80" width="110" height="6" rx="1" fill="#D4A574" />
          {/* Tiny plant on sill */}
          <circle cx="175" cy="76" r="5" fill="#2D6A4F" />
          <circle cx="182" cy="73" r="4" fill="#3E8B57" />
          <rect x="175" y="76" width="5" height="5" rx="1" fill="#D4A574" />

          {/* Wall shelf */}
          <rect x="290" y="60" width="80" height="5" rx="1" fill="#C8B89A" />
          <rect x="28" y="60" width="80" height="5" rx="1" fill="#C8B89A" />

          {/* Countertop surface */}
          <rect x="0" y="155" width="400" height="14" rx="0" fill="#D4A574" />
          {/* Wood grain lines */}
          <line x1="0" y1="159" x2="400" y2="159" stroke="#C49A6C" strokeWidth="0.5" />
          <line x1="0" y1="163" x2="400" y2="163" stroke="#C49A6C" strokeWidth="0.5" />

          {/* Lower cabinets */}
          <rect x="0" y="169" width="400" height="151" fill="#2D6A4F" />

          {/* Cabinet panels */}
          <rect x="10" y="178" width="85" height="115" rx="4" fill="#245A42" stroke="#1E4D38" strokeWidth="1" />
          <rect x="105" y="178" width="85" height="115" rx="4" fill="#245A42" stroke="#1E4D38" strokeWidth="1" />
          <rect x="210" y="178" width="85" height="115" rx="4" fill="#245A42" stroke="#1E4D38" strokeWidth="1" />
          <rect x="305" y="178" width="85" height="115" rx="4" fill="#245A42" stroke="#1E4D38" strokeWidth="1" />

          {/* Cabinet handles */}
          <rect x="47" y="228" width="12" height="3" rx="1.5" fill="#D4A574" />
          <rect x="142" y="228" width="12" height="3" rx="1.5" fill="#D4A574" />
          <rect x="247" y="228" width="12" height="3" rx="1.5" fill="#D4A574" />
          <rect x="342" y="228" width="12" height="3" rx="1.5" fill="#D4A574" />

          {/* Floor */}
          <rect x="0" y="300" width="400" height="20" fill="#E8DED1" />

          {/* Floor rug */}
          <ellipse cx="200" cy="310" rx="70" ry="8" fill="#D4A574" opacity="0.4" />
        </svg>

        {/* Appliance buttons overlaid on the SVG */}
        <div className="absolute inset-0">
          {/* Upper shelf items */}
          <ApplianceButton
            appliance={KITCHEN_APPLIANCES.find((a) => a.id === 'microwave')!}
            isSelected={selected.includes('microwave')}
            onClick={() => toggleAppliance('microwave')}
            style={{ left: '5%', top: '8%', width: '22%', height: '20%' }}
          />
          <ApplianceButton
            appliance={KITCHEN_APPLIANCES.find((a) => a.id === 'rice_cooker')!}
            isSelected={selected.includes('rice_cooker')}
            onClick={() => toggleAppliance('rice_cooker')}
            style={{ left: '73%', top: '8%', width: '22%', height: '20%' }}
          />

          {/* Counter items */}
          <ApplianceButton
            appliance={KITCHEN_APPLIANCES.find((a) => a.id === 'blender')!}
            isSelected={selected.includes('blender')}
            onClick={() => toggleAppliance('blender')}
            style={{ left: '3%', top: '28%', width: '20%', height: '22%' }}
          />
          <ApplianceButton
            appliance={KITCHEN_APPLIANCES.find((a) => a.id === 'stovetop_4')!}
            isSelected={selected.includes('stovetop_4')}
            onClick={() => toggleAppliance('stovetop_4')}
            style={{ left: '27%', top: '28%', width: '22%', height: '22%' }}
          />
          <ApplianceButton
            appliance={KITCHEN_APPLIANCES.find((a) => a.id === 'stovetop_2')!}
            isSelected={selected.includes('stovetop_2')}
            onClick={() => toggleAppliance('stovetop_2')}
            style={{ left: '51%', top: '28%', width: '22%', height: '22%' }}
          />
          <ApplianceButton
            appliance={KITCHEN_APPLIANCES.find((a) => a.id === 'air_fryer')!}
            isSelected={selected.includes('air_fryer')}
            onClick={() => toggleAppliance('air_fryer')}
            style={{ left: '76%', top: '28%', width: '21%', height: '22%' }}
          />

          {/* Below counter — oven */}
          <ApplianceButton
            appliance={KITCHEN_APPLIANCES.find((a) => a.id === 'oven')!}
            isSelected={selected.includes('oven')}
            onClick={() => toggleAppliance('oven')}
            style={{ left: '27%', top: '56%', width: '22%', height: '30%' }}
          />

          {/* Below counter — slow cooker stored in cabinet */}
          <ApplianceButton
            appliance={KITCHEN_APPLIANCES.find((a) => a.id === 'slow_cooker')!}
            isSelected={selected.includes('slow_cooker')}
            onClick={() => toggleAppliance('slow_cooker')}
            style={{ left: '53%', top: '56%', width: '22%', height: '30%' }}
          />
        </div>
      </div>

      {/* Fallback text list for accessibility */}
      <p className="font-body-xs text-[10px] text-on-surface-variant text-center">
        {selected.length === 0
          ? 'Tap the kitchen above to select your appliances'
          : `Selected: ${selected.map((id) => KITCHEN_APPLIANCES.find((a) => a.id === id)?.name).filter(Boolean).join(', ')}`}
      </p>
    </div>
  );
}

function ApplianceButton({
  appliance,
  isSelected,
  onClick,
  style,
}: {
  appliance: Appliance;
  isSelected: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${appliance.name} — ${appliance.hint}`}
      style={style}
      className={clsx(
        'absolute rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer group',
        isSelected
          ? 'bg-primary/15 ring-2 ring-primary/60 shadow-md backdrop-blur-[1px]'
          : 'bg-transparent hover:bg-on-surface/5'
      )}
    >
      <span
        className={clsx(
          'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200',
          isSelected
            ? 'bg-primary text-on-primary shadow-sm scale-105'
            : 'bg-surface-container-lowest/80 text-on-surface-variant group-hover:bg-surface-container group-hover:scale-105'
        )}
      >
        <Icon name={appliance.icon} className="text-[20px] sm:text-[22px]" />
      </span>
      <span
        className={clsx(
          'text-[9px] sm:text-[10px] font-bold leading-tight text-center px-1 transition-colors',
          isSelected ? 'text-primary' : 'text-on-surface-variant/80'
        )}
      >
        {appliance.name}
      </span>
      {isSelected && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
          <Icon name="check" className="text-[12px]" />
        </span>
      )}
    </button>
  );
}
