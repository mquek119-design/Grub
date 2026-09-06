'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/media/Icon';
import { FoodImage } from '@/components/media/FoodImage';
import { addMealToPlan, type PlanActionState } from '@/app/plan/actions';
import { useModalA11y } from '@/components/ui/useModalA11y';
import type { Recipe } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

const INITIAL: PlanActionState = { status: 'idle', message: '' };

interface FirstMealModalProps {
  recipes: Recipe[];
  weekStartDate: string;
}

/**
 * First-meal nudge shown on empty plan. Guides new houses to add their first meal
 * with popular starter recipes, one-tap to Monday dinner.
 *
 * Dismissible but not closeable by clicking outside — modal backdrop catches that.
 */
export function FirstMealModal({ recipes, weekStartDate }: FirstMealModalProps) {
  const [dismissed, setDismissed] = useState(false);
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const storageKey = `grub:first-meal-prompt:${weekStartDate}`;
  const isVisible = preferenceLoaded && !dismissed && recipes.length > 0;

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(storageKey) === 'dismissed');
    } catch {
      setDismissed(false);
    } finally {
      setPreferenceLoaded(true);
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, 'dismissed');
    } catch {
      // The prompt can still be dismissed for this visit when storage is unavailable.
    } finally {
      setDismissed(true);
    }
  }, [storageKey]);

  useModalA11y(dialogRef, isVisible, dismiss);

  if (!isVisible) return null;

  // Show only the first 5 recipes
  const shown = recipes.slice(0, 5);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-meal-title"
        tabIndex={-1}
        className="fixed inset-0 z-50 flex items-center justify-center p-sm md:p-lg"
      >
        <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-xl bg-surface-0 p-md shadow-lg animate-fade-in-up md:max-h-[calc(100dvh-3rem)]">
            <div className="flex min-h-0 flex-col gap-md">
              {/* Header */}
              <div className="flex shrink-0 items-start justify-between gap-sm">
                <div className="flex flex-col gap-xs">
                  <h2 id="first-meal-title" className="font-title-lg text-title-lg text-on-surface">
                    Add your first meal
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Start with one of these. You can add more later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Close first meal suggestions"
                  className="grid size-10 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
                >
                  <Icon name="close" />
                </button>
              </div>

              {/* Recipe cards */}
              <div className="flex min-h-0 flex-1 flex-col gap-sm overflow-y-auto overscroll-contain pr-xs">
                {shown.map((recipe, i) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isSelected={selectedId === recipe.id}
                    onSelect={() => setSelectedId(recipe.id)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-sm border-t border-surface-container-highest pt-md">
                {selectedId && (
                  <AddMealButton
                    recipeId={selectedId}
                  />
                )}
                <button
                  onClick={dismiss}
                  className="flex-1 h-12 px-lg rounded-full border border-outline text-on-surface-variant font-semibold hover:bg-surface-container-lowest transition-colors"
                >
                  {selectedId ? 'Skip for now' : 'Skip'}
                </button>
              </div>
            </div>
        </div>
      </div>
    </>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  onSelect: () => void;
  style?: React.CSSProperties;
}

function RecipeCard({ recipe, isSelected, onSelect, style }: RecipeCardProps) {
  return (
    <button
      onClick={onSelect}
      style={style}
      className="animate-fade-in-up"
    >
      <div
        className={`flex items-center gap-md p-sm rounded-lg border-2 transition-all ${
          isSelected
            ? 'border-primary bg-primary-container'
            : 'border-surface-container-highest bg-surface-container-lowest hover:border-primary/50'
        }`}
      >
        {/* Image */}
        <FoodImage
          alt={recipe.title}
          seed={recipe.id}
          className="w-16 h-16 shrink-0 rounded-md"
        />

        {/* Content */}
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-semibold text-on-surface text-sm truncate">{recipe.title}</h3>
          <div className="flex items-center gap-xs text-on-surface-variant text-xs mt-xs">
            <Icon name="schedule" className="text-sm" />
            <span>{recipe.cookTimeMins} mins</span>
          </div>
        </div>

        {/* Checkmark */}
        {isSelected && (
          <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center">
            <Icon name="check" className="text-base" />
          </div>
        )}
      </div>
    </button>
  );
}

interface AddMealButtonProps {
  recipeId: string;
}

function AddMealButton({ recipeId }: AddMealButtonProps) {
  const [state, formAction] = useActionState(addMealToPlan, INITIAL);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === 'success') toast('First meal added to Monday.');
  }, [state.status, toast]);

  return (
    <form
      action={formAction}
      className="flex-1"
    >
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="day" value="mon" />
      <input type="hidden" name="mealType" value="dinner" />
      <input type="hidden" name="week" value="this" />
      <AddButton />
    </form>
  );
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 h-12 px-lg rounded-full bg-secondary text-on-secondary font-semibold hover:opacity-95 disabled:opacity-60 transition-opacity flex items-center justify-center gap-sm"
    >
      {pending && <Icon name="progress_activity" className="animate-spin text-lg" />}
      <span>{pending ? 'Adding...' : 'Add to Monday'}</span>
    </button>
  );
}
