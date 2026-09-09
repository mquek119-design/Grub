'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { AvatarStack } from '@/components/avatars/Avatar';
import { FoodImage } from '@/components/media/FoodImage';
import { CookModeModal } from '@/components/recipes/CookModeModal';
import { NutritionPill } from '@/components/recipes/NutritionPill';
import { clsx } from '@/lib/clsx';
import type { PlannedMeal, Recipe, User } from '@/lib/types';
import { MEAL_TYPE_ICONS, MEAL_TYPE_LABELS } from '@/lib/types';

interface TonightDinnerCardProps {
  meal: PlannedMeal;
  recipe?: Recipe;
  cook?: User;
  currentUser: User;
  housemates: User[];
}

export function TonightDinnerCard({
  meal,
  recipe,
  cook,
  currentUser,
  housemates,
}: TonightDinnerCardProps) {
  const [cookModeOpen, setCookModeOpen] = useState(false);
  const byId = new Map(housemates.map((u) => [u.id, u]));
  const diners = meal.participants
    .map((p) => byId.get(p.userId))
    .filter((u): u is User => Boolean(u));

  const joined = meal.participants.some((p) => p.userId === currentUser.id);
  const isCook = meal.cookedByUserId === currentUser.id;
  const mouths = meal.participants.reduce(
    (sum, p) => sum + 1 + (p.guests ?? 0),
    0
  );

  const coCook = meal.coCookUserId ? byId.get(meal.coCookUserId) : undefined;
  const cleaner = meal.cleanerUserId ? byId.get(meal.cleanerUserId) : undefined;

  const content = (
    <div className="flex items-start gap-md mt-0.5 group">
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-surface-container-high border border-outline-variant/40 shadow-xs">
        <FoodImage
          src={recipe?.imageUrl ?? null}
          seed={meal.recipeTitle}
          alt={meal.recipeTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-title-md text-title-md font-bold text-on-surface truncate group-hover:text-primary transition-colors">
          {meal.recipeTitle}
        </h3>
        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
          {cook ? (
            <span>
              Cooked by <strong>{isCook ? 'you' : cook.name}</strong>
              {coCook && (
                <> & <strong>{coCook.id === currentUser.id ? 'you' : coCook.name}</strong></>
              )}
              {cleaner && (
                <> · <strong>{cleaner.id === currentUser.id ? 'you' : cleaner.name}</strong> on wash-up</>
              )}
            </span>
          ) : (
            <span className="text-secondary font-medium">No cook assigned yet</span>
          )}
          {recipe?.cookTimeMins ? ` · ${recipe.cookTimeMins}m` : ''}
        </p>

        <div className="flex items-center gap-sm mt-2 flex-wrap">
          <AvatarStack users={diners.slice(0, 4)} size="sm" />
          <span className="font-numeric-data text-xs text-on-surface-variant font-medium">
            {mouths} {mouths === 1 ? 'diner' : 'diners'}
          </span>
          {(recipe?.caloriesPerPortion || recipe?.proteinGrams) && (
            <NutritionPill
              calories={recipe.caloriesPerPortion}
              proteinGrams={recipe.proteinGrams}
              variant="compact"
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {cookModeOpen && recipe && (
        <CookModeModal
          recipe={recipe}
          servings={mouths > 0 ? mouths : (recipe.servings || 2)}
          onClose={() => setCookModeOpen(false)}
        />
      )}

      <Card className="flex flex-col gap-sm border-l-4 border-l-primary bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary-fixed/25 interactive-card card-glow">
        <div className="flex items-center justify-between gap-sm">
          <span className="flex items-center gap-1.5 font-label-caps text-label-caps uppercase font-bold text-primary tracking-wider">
            <Icon name={MEAL_TYPE_ICONS[meal.mealType]} className="text-sm" />
            <span>Tonight&apos;s {MEAL_TYPE_LABELS[meal.mealType]}</span>
          </span>
          {joined ? (
            <Badge tone="solid-primary" className="text-[11px] shadow-xs">
              YOU&apos;RE IN
            </Badge>
          ) : (
            <Badge tone="neutral" className="text-[11px]">
              NOT JOINED
            </Badge>
          )}
        </div>

        {recipe ? (
          <button
            type="button"
            onClick={() => setCookModeOpen(true)}
            className="text-left w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            aria-label={`Open Cook Mode for ${meal.recipeTitle}`}
          >
            {content}
          </button>
        ) : (
          <Link
            href={`/recipes/${meal.recipeId}`}
            className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            {content}
          </Link>
        )}

        <div className="flex items-center justify-between pt-xs mt-xs border-t border-outline-variant/30 flex-wrap gap-2">
          <span className="font-body-sm text-[11px] text-on-surface-variant">
            {isCook
              ? 'You are down to cook tonight'
              : joined
              ? 'Table is set for you'
              : 'Want in? Open the plan to join'}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {recipe && (
              <button
                type="button"
                onClick={() => setCookModeOpen(true)}
                className={clsx(
                  'text-xs font-bold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 btn-tactile shadow-xs',
                  isCook
                    ? 'bg-secondary text-on-secondary-container hover:bg-secondary-container'
                    : 'bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25'
                )}
                aria-label={`Open Cook Mode for ${meal.recipeTitle}`}
              >
                <Icon name="skillet" className="text-sm" />
                <span>Cook Mode</span>
              </button>
            )}

            {!isCook && (
              <Link
                href={`/plan#day-${meal.day}`}
                className="text-xs font-bold text-primary hover:text-primary-container px-3 py-1.5 rounded-full bg-primary/8 hover:bg-primary/15 transition-all flex items-center gap-1 btn-tactile"
              >
                <span>{joined ? 'Sitting' : 'Join'}</span>
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
