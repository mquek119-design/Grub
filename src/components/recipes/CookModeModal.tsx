'use client';

import { useEffect, useState, useActionState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';
import type { Recipe } from '@/lib/types';
import { addLeftover, type LeftoverActionState } from '@/app/leftovers/actions';
import { useSubmitState } from '@/components/ui/SubmitButton';

interface CookModeModalProps {
  recipe: Recipe;
  servings: number;
  onClose: () => void;
}

const LEFTOVER_INITIAL: LeftoverActionState = { status: 'idle', message: '' };

export function CookModeModal({ recipe, servings, onClose }: CookModeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([0]));
  const [finished, setFinished] = useState(false);
  const [showLeftoverForm, setShowLeftoverForm] = useState(false);
  const [leftoverState, leftoverAction] = useActionState(addLeftover, LEFTOVER_INITIAL);
  const { pending } = useSubmitState();

  useEffect(() => {
    setMounted(true);
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock
        .request('screen')
        .then((lock: any) => {
          wakeLock = lock;
        })
        .catch((err: any) => console.log('Wake Lock error:', err));
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

  function handleSelectStep(idx: number) {
    setCurrentStep(idx);
    setCompletedSteps((prev) => new Set(prev).add(idx));
  }

  function handleNextStep() {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    if (currentStep < totalSteps - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      setCompletedSteps((prev) => new Set(prev).add(nextIdx));
    } else {
      // All steps completed!
      setCompletedSteps(new Set(Array.from({ length: totalSteps }, (_, i) => i)));
      setFinished(true);
    }
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
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-numeric-data">
            {completedSteps.size} / {totalSteps} Steps Done
          </span>
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
                  <span className="text-on-surface-variant font-numeric-data">
                    {display} {ing.unit}
                  </span>
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
                onClick={() => handleSelectStep(idx)}
                className={`p-lg rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-primary bg-primary-container/10 shadow-ambient-card ring-2 ring-primary/30'
                    : isDone
                    ? 'border-surface-container-highest bg-surface-container-lowest opacity-75'
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
                    <p
                      className={`font-body-lg text-[20px] leading-relaxed text-on-surface ${
                        isDone ? 'line-through opacity-70' : ''
                      }`}
                    >
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
          onClick={handleNextStep}
          className={clsx(
            'px-lg py-sm rounded-xl font-bold transition-all flex items-center gap-xs',
            currentStep === totalSteps - 1 || completedSteps.size === totalSteps
              ? 'bg-secondary text-on-secondary-container shadow-md hover:shadow-lg text-title-md'
              : 'bg-primary text-on-primary hover:opacity-90'
          )}
        >
          {currentStep === totalSteps - 1 || completedSteps.size === totalSteps ? (
            <>
              <Icon name="verified" className="text-xl" />
              Finish Cooking 🎉
            </>
          ) : (
            'Next Step'
          )}
        </button>
      </footer>

      {/* Completion Modal */}
      {finished && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-md animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-lg max-w-md w-full shadow-ambient-modal flex flex-col items-center text-center gap-md">
            <div className="w-16 h-16 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary">
              <Icon name="verified" filled className="text-[36px]" />
            </div>

            <h3 className="font-title-md text-headline-sm font-bold text-on-surface">
              Bon Appétit! 🎉
            </h3>
            <p className="font-body-sm text-body-md text-on-surface-variant">
              You finished cooking <strong className="text-on-surface">{recipe.title}</strong>.
            </p>

            {showLeftoverForm ? (
              <form action={leftoverAction} className="w-full flex flex-col gap-sm p-md rounded-xl bg-surface-container-low border border-primary/20 text-left">
                <span className="font-title-md text-sm font-bold text-on-surface">
                  Put Spare Portions on Leftovers Board
                </span>
                <input
                  type="text"
                  name="description"
                  defaultValue={recipe.title}
                  required
                  maxLength={80}
                  className="px-sm py-1.5 rounded-lg border border-outline-variant text-sm bg-surface-container-lowest"
                />
                <div className="flex items-center justify-between gap-sm">
                  <label className="text-xs font-semibold text-on-surface-variant">Portions</label>
                  <input
                    type="number"
                    name="portions"
                    defaultValue={2}
                    min={1}
                    max={10}
                    className="w-16 px-sm py-1 rounded border text-center font-bold text-sm"
                  />
                </div>
                {leftoverState.message && (
                  <p className="text-xs font-bold text-primary">{leftoverState.message}</p>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-2 bg-primary text-on-primary rounded-lg font-bold text-xs"
                >
                  {pending ? 'Saving...' : 'Post to Leftovers Board'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-sm w-full">
                <button
                  type="button"
                  onClick={() => setShowLeftoverForm(true)}
                  className="w-full py-md rounded-2xl bg-secondary text-on-secondary-container font-title-md text-title-md font-bold btn-tactile flex items-center justify-center gap-xs shadow-md"
                >
                  <Icon name="soup_kitchen" className="text-xl" />
                  + Put Extra Portions in Leftovers
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-md rounded-2xl bg-surface-container-high text-on-surface font-title-md text-title-md font-semibold hover:bg-surface-container-highest transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
