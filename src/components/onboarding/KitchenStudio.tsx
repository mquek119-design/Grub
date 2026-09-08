'use client';

import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';

export interface Appliance {
  id: string;
  name: string;
  category: 'primary' | 'countertop' | 'extra';
  icon: string;
  hint: string;
}

export const KITCHEN_APPLIANCES: Appliance[] = [
  {
    id: 'air_fryer',
    name: 'Air Fryer',
    category: 'countertop',
    icon: 'mode_heat',
    hint: 'Quick crispy student dinners',
  },
  {
    id: 'microwave',
    name: 'Microwave',
    category: 'countertop',
    icon: 'microwave',
    hint: 'Reheating leftovers & quick sides',
  },
  {
    id: 'oven',
    name: 'Oven',
    category: 'primary',
    icon: 'oven_gen',
    hint: 'Roasts, bakes & pizzas',
  },
  {
    id: 'stovetop_4',
    name: '4-Ring Stovetop',
    category: 'primary',
    icon: 'skillet',
    hint: 'Full shared cooking space',
  },
  {
    id: 'stovetop_2',
    name: '2-Ring Hob',
    category: 'primary',
    icon: 'cooking',
    hint: 'Campus hall kitchens (Rootes)',
  },
  {
    id: 'blender',
    name: 'Blender',
    category: 'extra',
    icon: 'blender',
    hint: 'Smoothies, pastes & sauces',
  },
  {
    id: 'rice_cooker',
    name: 'Rice Cooker',
    category: 'countertop',
    icon: 'rice_bowl',
    hint: 'Fluffy rice on demand',
  },
  {
    id: 'slow_cooker',
    name: 'Slow Cooker',
    category: 'extra',
    icon: 'soup_kitchen',
    hint: 'Batch stews & curries',
  },
];

interface KitchenStudioProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function KitchenStudio({ selected, onChange }: KitchenStudioProps) {
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
            Kitchen Appliances
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Tap what your flat kitchen has so Grub only filters recipes you can actually cook.
          </p>
        </div>
        <span className="text-xs font-bold font-numeric-data text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {selected.length} Selected
        </span>
      </div>

      {/* Interactive Appliance Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-sm">
        {KITCHEN_APPLIANCES.map((item) => {
          const isSelected = selected.includes(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleAppliance(item.id)}
              className={clsx(
                'flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer btn-tactile',
                isSelected
                  ? 'bg-primary/8 border-primary shadow-xs ring-1 ring-primary/30'
                  : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50'
              )}
            >
              <div className="w-full flex items-center justify-between">
                <span
                  className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant'
                  )}
                >
                  <Icon name={item.icon} className="text-[20px]" />
                </span>

                <span
                  className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant/60 bg-transparent'
                  )}
                >
                  {isSelected && <Icon name="check" className="text-[13px]" />}
                </span>
              </div>

              <div>
                <p className="font-title-sm text-xs font-bold text-on-surface leading-tight">
                  {item.name}
                </p>
                <p className="font-body-xs text-[10px] text-on-surface-variant leading-tight mt-0.5">
                  {item.hint}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
