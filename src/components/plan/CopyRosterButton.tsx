'use client';

import { useState } from 'react';
import { Icon } from '@/components/media/Icon';
import type { WeeklyPlan } from '@/lib/types';
import { WEEKDAY_LABELS } from '@/lib/types';

export function CopyRosterButton({ plan }: { plan: WeeklyPlan }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const lines: string[] = [`🥘 Grub House Roster (Week of ${plan.weekStartDate}):`];
    plan.meals.forEach((meal) => {
      const dayLabel = WEEKDAY_LABELS[meal.day];
      const dinersCount = meal.participants.length;
      lines.push(`• ${dayLabel}: ${meal.recipeTitle} (${dinersCount} eating)`);
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex items-center gap-xs print:hidden">
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-xs px-md py-xs rounded-xl border text-xs font-semibold btn-tactile shadow-sm transition-all ${
          copied
            ? 'bg-primary text-on-primary border-primary shadow-md'
            : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/40 hover:bg-surface-container-low'
        }`}
      >
        <Icon name={copied ? 'check' : 'content_copy'} className={`text-xs ${copied ? 'text-on-primary' : 'text-primary'}`} />
        {copied ? 'Copied to Clipboard!' : 'Copy Roster Text'}
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-xs px-md py-xs rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant font-semibold text-xs btn-tactile shadow-sm hover:border-primary/40 hover:bg-surface-container-low transition-all"
      >
        <Icon name="print" className="text-xs text-primary" />
        Print Roster
      </button>
    </div>
  );
}
