'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';

const HOUSEHOLD_STAPLES = [
  'Toilet Paper',
  'Kitchen Towels',
  'Aluminium Foil',
  'Bin Bags',
  'Washing Up Liquid',
  'Sponges',
  'Dishwasher Tablets',
  'Hand Soap',
];

export function RunningLowStapleCard() {
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  function toggleStaple(item: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  return (
    <Card className="flex flex-col gap-sm border border-secondary/30 bg-secondary-container/10">
      <div className="flex items-center justify-between gap-sm">
        <div className="flex items-center gap-xs">
          <Icon name="inventory_2" className="text-secondary text-lg" />
          <h3 className="font-title-md text-title-md font-bold text-on-surface">
            Running low in the house?
          </h3>
        </div>
        <span className="font-label-caps text-[10px] uppercase text-secondary font-bold tracking-wider">
          {flagged.size > 0 ? `${flagged.size} Flagged` : 'House Essentials'}
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Tap shared items running low so they get added to the next shop.
      </p>

      <div className="flex flex-wrap gap-xs mt-xs">
        {HOUSEHOLD_STAPLES.map((item) => {
          const isLow = flagged.has(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggleStaple(item)}
              className={`inline-flex items-center gap-xs px-md py-xs rounded-full border text-xs font-semibold transition-all ${
                isLow
                  ? 'border-secondary bg-secondary text-on-secondary shadow-sm font-bold'
                  : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <Icon name={isLow ? 'check_circle' : 'add'} className="text-xs" />
              <span>{item}</span>
              {isLow && <span className="ml-xs text-[10px] opacity-90">(Flagged)</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
