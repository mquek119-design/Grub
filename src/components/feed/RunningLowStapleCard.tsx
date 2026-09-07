'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';

const DEFAULT_STAPLES = ['Milk', 'Olive Oil', 'Eggs', 'Butter', 'Bread', 'Salt & Pepper'];

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
          <Icon name="report_problem" className="text-secondary text-lg" />
          <h3 className="font-title-md text-title-md font-bold text-on-surface">
            Quick Flag: Running Low in Kitchen?
          </h3>
        </div>
        <span className="font-label-caps text-[10px] uppercase text-secondary font-bold tracking-wider">
          Staple Alert
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Tap common house staples below to flag them as running low so they get added to the next shop.
      </p>

      <div className="flex flex-wrap gap-xs mt-xs">
        {DEFAULT_STAPLES.map((item) => {
          const isLow = flagged.has(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggleStaple(item)}
              className={`inline-flex items-center gap-xs px-md py-xs rounded-full border text-xs font-semibold transition-all ${
                isLow
                  ? 'border-secondary bg-secondary text-on-secondary shadow-sm'
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
