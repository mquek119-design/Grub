'use client';

import { useState } from 'react';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import type { Recipe } from '@/lib/types';
import { CookModeModal } from '@/components/recipes/CookModeModal';
import { NutritionPill } from '@/components/recipes/NutritionPill';
import { formatInstruction, formatIngredientName } from '@/lib/recipeFormatting';

export function RecipeDetail({
  recipe,
  cookContext = false,
  fixedServings,
  initialCookMode = false,
}: {
  recipe: Recipe;
  /** True when the recipe is part of a locked/ordered week — hides editing controls. */
  cookContext?: boolean;
  /** When in cook context, the portion count from the plan (number of participants). */
  fixedServings?: number;
  initialCookMode?: boolean;
}) {
  const [servings, setServings] = useState(fixedServings ?? recipe.servings);
  const [cookModeModalOpen, setCookModeModalOpen] = useState(initialCookMode);
  const [done, setDone] = useState<Set<number>>(new Set());

  const scale = servings / recipe.servings;
  const missing = recipe.ingredients.filter((ingredient) => !ingredient.inPantry);

  function toggleStep(index: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-lg">
      {cookModeModalOpen && (
        <CookModeModal
          recipe={recipe}
          servings={servings}
          onClose={() => setCookModeModalOpen(false)}
        />
      )}

      <div className="flex items-center justify-between gap-md flex-wrap">
        <div className="flex items-center gap-sm md:gap-md flex-wrap">
          <span className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant bg-surface-container px-sm py-xs rounded-full">
            <Icon name="schedule" className="text-[18px] text-primary" />
            {recipe.cookTimeMins} mins cook
          </span>
          <span className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant capitalize bg-surface-container px-sm py-xs rounded-full">
            <Icon name="signal_cellular_alt" className="text-[18px] text-primary" />
            {recipe.difficulty}
          </span>
          <span className="flex items-center gap-xs font-numeric-data text-numeric-data text-primary bg-primary-container/20 px-sm py-xs rounded-full font-bold">
            <Icon name="payments" className="text-[18px]" />
            {formatPence(recipe.costPerPortion)}/portion
          </span>
          {(recipe.caloriesPerPortion || recipe.proteinGrams) && (
            <NutritionPill
              calories={recipe.caloriesPerPortion}
              proteinGrams={recipe.proteinGrams}
              carbsGrams={recipe.carbsGrams}
              fatGrams={recipe.fatGrams}
              variant="bar"
            />
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setCookModeModalOpen(true)}
            className="inline-flex items-center gap-xs px-xl py-sm rounded-2xl bg-secondary text-on-secondary-container font-bold text-sm btn-tactile shadow-md hover:shadow-lg transition-all"
          >
            <Icon name="smartphone" className="text-lg" />
            <span>Start Cook Mode</span>
            <span className="hidden md:inline-flex text-[11px] font-semibold bg-black/10 px-2 py-0.5 rounded-full ml-1">
              Phone
            </span>
          </button>
          <span className="hidden md:inline-block text-[11px] text-on-surface-variant font-medium">
            Designed for your phone in the kitchen · Click for QR code
          </span>
        </div>
      </div>

      <div className="grid gap-lg lg:grid-cols-12">
        <div className="flex flex-col gap-md lg:col-span-5 lg:order-2">
          <Card className="flex flex-col gap-md">
            <div className="flex items-center justify-between gap-sm">
              <h2 className="font-title-md text-title-md font-bold">Ingredients</h2>
              {cookContext ? (
                /* In cook context, servings are locked to the plan's participant count */
                <span className="flex items-center gap-xs font-numeric-data text-numeric-data bg-primary-container/20 px-sm py-xs rounded-full font-bold text-primary">
                  <Icon name="groups" className="text-[16px]" />
                  {servings} portions
                </span>
              ) : (
                <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1">
                  <button
                    type="button"
                    aria-label="Fewer servings"
                    onClick={() => setServings((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest rounded font-bold"
                  >
                    <Icon name="remove" className="text-[16px]" />
                  </button>
                  <span className="font-numeric-data text-numeric-data w-12 text-center tabular-nums font-bold">
                    {servings} ptn
                  </span>
                  <button
                    type="button"
                    aria-label="More servings"
                    onClick={() => setServings((prev) => prev + 1)}
                    className="w-7 h-7 flex items-center justify-center text-primary hover:bg-primary-container hover:text-on-primary-container rounded font-bold"
                  >
                    <Icon name="add" className="text-[16px]" />
                  </button>
                </div>
              )}
            </div>

            <ul className="flex flex-col divide-y divide-surface-container-highest">
              {recipe.ingredients.map((ingredient) => {
                const scaled = ingredient.quantity * scale;
                const display = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
                return (
                  <li
                    key={ingredient.ingredientId}
                    className="py-sm flex items-center justify-between gap-md"
                  >
                    <span className="flex items-center gap-sm min-w-0">
                      <Icon
                        name={ingredient.inPantry ? 'check_circle' : 'radio_button_unchecked'}
                        filled={ingredient.inPantry}
                        className={clsx(
                          'text-[18px] shrink-0',
                          ingredient.inPantry ? 'text-primary' : 'text-outline-variant'
                        )}
                      />
                      <span className="font-body-lg text-body-lg truncate">
                        {formatIngredientName(ingredient.name)}
                      </span>
                    </span>
                    <span className="font-numeric-data text-numeric-data text-on-surface-variant shrink-0 font-semibold">
                      {display} {ingredient.unit}
                    </span>
                  </li>
                );
              })}
            </ul>

            {cookContext ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                <Icon name="check_circle" filled className="text-primary text-[16px]" />
                Ingredients already in this week&apos;s basket.
              </p>
            ) : (
              <button
                type="button"
                disabled={missing.length === 0}
                className="w-full h-12 rounded-lg bg-secondary-container text-on-secondary font-title-md text-title-md flex items-center justify-center gap-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="add_shopping_cart" />
                {missing.length === 0
                  ? 'Everything in the pantry'
                  : `Add ${missing.length} Missing to Basket`}
              </button>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-md lg:col-span-7 lg:order-1">
          <h2 className="font-title-md text-title-md font-bold">Method</h2>
          <ol className="flex flex-col gap-sm">
            {recipe.instructions.map((step, index) => {
              const isDone = done.has(index);
              const formattedStep = formatInstruction(step);
              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => toggleStep(index)}
                    className={clsx(
                      'w-full text-left flex items-start gap-md p-md rounded-xl border transition-colors',
                      isDone
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-surface-container-lowest border-surface-container-highest hover:border-outline-variant'
                    )}
                  >
                    <span
                      className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-numeric-data font-bold',
                        isDone
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      )}
                    >
                      {isDone ? <Icon name="check" className="text-[18px]" /> : index + 1}
                    </span>
                    <span
                      className={clsx(
                        'text-body-lg leading-relaxed',
                        isDone && 'line-through text-on-surface-variant'
                      )}
                    >
                      {formattedStep}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {recipe.proTip && (
            <Card accent="secondary" className="flex items-start gap-sm">
              <Icon name="lightbulb" filled className="text-secondary mt-0.5" />
              <div>
                <h3 className="font-numeric-data text-numeric-data mb-1 font-bold">Mob Pro Tip</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {formatInstruction(recipe.proTip)}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
