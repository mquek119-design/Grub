'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import type { WeeklyPlan } from '@/lib/types';
import { WEEKDAY_LABELS } from '@/lib/types';

export function PlanActionsMenu({ plan }: { plan: WeeklyPlan }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  function handleCopyRoster() {
    const lines: string[] = [`🥘 Grub House Roster (Week of ${plan.weekStartDate}):`];
    if (plan.meals.length === 0) {
      lines.push('No meals planned yet.');
    } else {
      plan.meals.forEach((meal) => {
        const dayLabel = WEEKDAY_LABELS[meal.day];
        const dinersCount = meal.participants.length;
        lines.push(`• ${dayLabel}: ${meal.recipeTitle} (${dinersCount} eating)`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    });
  }

  return (
    <div className="relative print:hidden shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Plan actions"
        aria-expanded={open}
        className="w-10 h-10 rounded-full border border-primary/20 bg-surface-container-lowest text-primary hover:bg-primary/5 flex items-center justify-center transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Icon name="more_vert" className="text-xl" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl bg-surface-container-lowest border border-surface-container-highest shadow-elevated-card py-1.5 animate-scale-in">
          <button
            type="button"
            onClick={handleCopyRoster}
            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2.5 transition-colors"
          >
            <Icon name={copied ? 'check' : 'content_copy'} className={`text-lg ${copied ? 'text-secondary' : 'text-primary'}`} />
            <span>{copied ? 'Copied to Clipboard!' : 'Copy roster for chat'}</span>
          </button>

          <div className="h-px bg-surface-container-highest my-1" />

          <Link
            href="/recipes"
            onClick={() => setOpen(false)}
            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2.5 transition-colors"
          >
            <Icon name="menu_book" className="text-lg text-primary" />
            <span>Browse Recipe Book</span>
          </Link>
        </div>
      )}
    </div>
  );
}
