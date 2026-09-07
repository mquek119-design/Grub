'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/media/Icon';
import type { Recipe } from '@/lib/types';

interface CookModeModalProps {
  recipe: Recipe;
  servings: number;
  onClose: () => void;
}

export function CookModeModal({ recipe, servings, onClose }: CookModeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
    // Request Wake Lock if available
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLock = lock;
      }).catch((err: any) => console.log('Wake Lock error:', err));
    }
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  if (!mounted) return null;

  const totalSteps = recipe.instructions.length;
  const scale = servings / recipe.servings;

  function toggleStep(idx: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-surface-container-lowest flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-lg py-md border-b border-surface-container-highest flex items-center justify-between gap-md bg-surface-container-low shrink-0">
        <div className="flex items-center gap-md min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-sm rounded-full text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
          >
            <Icon name="arrow_back" className="text-xl" />
          </button>
          <div className="min-w-0">
            <span className="font-label-caps text-label-caps uppercase text-primary font-bold">
              Mob Cook Mode · {servings} Servings
            </span>
            <h2 className="font-title-md text-title-md truncate font-bold text-on-surface">
              {recipe.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-xs text-xs font-bold text-on-surface-variant shrink-0">
          <span>{completedSteps.size} / {totalSteps} Steps Done</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto p-lg max-w-4xl mx-auto w-full flex flex-col gap-lg">
        {/* Ingredients Quick Check */}
        <details className="bg-surface-container-low border border-surface-container-highest rounded-xl p-md">
          <summary className="font-title-md text-title-md font-bold cursor-pointer text-on-surface flex items-center gap-xs">
            <Icon name="kitchen" className="text-primary text-lg" />
            <span>Ingredients Checklist ({servings} portions)</span>
          </summary>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-md pt-md border-t border-surface-container-highest">
            {recipe.ingredients.map((ing) => {
              const qty = ing.quantity * scale;
              const display = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
              return (
                <li key={ing.ingredientId} className="flex items-center gap-xs text-body-lg text-on-surface">
                  <Icon name="check_circle" className="text-primary text-base" />
                  <span className="font-semibold">{ing.name}:</span>
                  <span className="text-on-surface-variant font-numeric-data">{display} {ing.unit}</span>
                </li>
              );
            })}
          </ul>
        </details>

        {/* Step-by-Step Focus View */}
        <div className="flex flex-col gap-md">
          {recipe.instructions.map((stepText, idx) => {
            const isDone = completedSteps.has(idx);
            const isCurrent = currentStep === idx;

            return (
              <div
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`p-lg rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-primary bg-primary-container/10 shadow-ambient-card'
                    : isDone
                    ? 'border-surface-container-highest bg-surface-container-lowest opacity-60'
                    : 'border-surface-container-highest bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-start justify-between gap-md">
                  <div className="flex items-start gap-md min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStep(idx);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${
                        isDone ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {isDone ? <Icon name="check" className="text-xl" /> : idx + 1}
                    </button>
                    <p className={`font-body-lg text-[20px] leading-relaxed text-on-surface ${isDone ? 'line-through opacity-70' : ''}`}>
                      {stepText}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="p-md border-t border-surface-container-highest bg-surface-container-low shrink-0 flex items-center justify-between gap-md max-w-4xl mx-auto w-full">
        <button
          type="button"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          className="px-lg py-sm rounded-xl border border-outline-variant text-on-surface font-semibold disabled:opacity-40"
        >
          Previous Step
        </button>
        <span className="font-numeric-data text-body-lg font-bold text-primary">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <button
          type="button"
          disabled={currentStep === totalSteps - 1}
          onClick={() => setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1))}
          className="px-lg py-sm rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 disabled:opacity-40"
        >
          Next Step
        </button>
      </footer>
    </div>,
    document.body
  );
}
