import Link from 'next/link';
import { FoodImage } from '@/components/media/FoodImage';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Notice';
import { MealStatusControls } from '@/components/plan/MealStatusControls';
import { perishablesAmong, suggestFromIngredients } from '@/lib/suggestions';
import type { PlannedMeal, Recipe, User, WeeklyPlan, Weekday } from '@/lib/types';
import { MEAL_TYPES, MEAL_TYPE_ICONS, MEAL_TYPE_LABELS, WEEKDAYS, WEEKDAY_LABELS } from '@/lib/types';

/**
 * The week after the shop arrives.
 *
 * Replaces "What do you fancy?" once the order is placed, because the question
 * has changed: the food is bought, so nothing here asks what you want. It shows
 * what you have and when it goes off.
 *
 * The one rule worth stating out loud, because it is the whole reason this
 * screen can be relaxed about everything else: **nothing on it moves money.**
 * Skipping, bailing and cooking something else are all free. The split was
 * settled when the order went in.
 */

function dayDate(weekStartDate: string, day: Weekday): string {
  const index = WEEKDAYS.indexOf(day);
  const date = new Date(`${weekStartDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + index);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function suggestionsFor(meal: PlannedMeal, recipes: Recipe[]) {
  const recipe = recipes.find((entry) => entry.id === meal.recipeId);
  if (!recipe) return { recipe: null, suggestions: [], perishables: [] };

  return {
    recipe,
    suggestions: suggestFromIngredients(
      recipe.ingredients.map((ingredient) => ingredient.ingredientId),
      recipes,
      { excludeRecipeIds: [recipe.id] }
    ),
    perishables: perishablesAmong(recipe.ingredients),
  };
}

export function KitchenPanel({
  plan,
  recipes,
  currentUser,
  housemates = [],
}: {
  plan: WeeklyPlan;
  recipes: Recipe[];
  currentUser: User;
  housemates?: User[];
}) {
  const housemateMap = new Map(housemates.map((h) => [h.id, h.name]));

  const myMeals = plan.meals
    .filter((meal) => meal.participants.some((p) => p.userId === currentUser.id))
    .sort((a, b) => {
      const byDay = WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day);
      return byDay !== 0 ? byDay : MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType);
    });

  if (myMeals.length === 0) {
    return (
      <Card className="flex items-start gap-sm">
        <Icon name="shopping_basket" className="text-on-surface-variant mt-0.5" />
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Shop’s in, but you weren’t down for anything this week — so none of it is yours to
          sort out.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <Notice tone="good" title="The shop's been placed" id="kitchen-panel-shop-placed">
        Everything below is bought and paid for, so change your mind as much as you like — none of
        it moves anyone&apos;s money.
      </Notice>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {myMeals.map((meal) => {
          const mine = meal.participants.find((p) => p.userId === currentUser.id);
          const { recipe, suggestions, perishables } = suggestionsFor(meal, recipes);
          const skipped = meal.status === 'skipped';

          const otherDinersBailed = meal.participants
            .filter((p) => p.userId !== currentUser.id && p.bailed)
            .map((p) => ({ userId: p.userId, name: housemateMap.get(p.userId) ?? 'A housemate' }));

          const cookParticipant = meal.participants.find((p) => p.userId === meal.cookedByUserId);
          const cookBailed = Boolean(cookParticipant?.bailed);
          const isCook = meal.cookedByUserId === currentUser.id;

          return (
            <Card key={meal.id} className="flex flex-col gap-md border border-surface-container-highest shadow-sm">
              <div className="flex items-start gap-md min-w-0">
                <Link
                  href={`/recipes/${meal.recipeId}`}
                  className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <FoodImage
                    seed={meal.recipeId}
                    src={recipe?.imageUrl}
                    alt={meal.recipeTitle}
                    className="w-16 h-16 rounded-xl object-cover text-[24px] shadow-sm"
                  />
                </Link>

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-xs flex-wrap">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant flex items-center gap-xs">
                      <Icon name={MEAL_TYPE_ICONS[meal.mealType]} className="text-xs" />
                      {WEEKDAY_LABELS[meal.day]} {dayDate(plan.weekStartDate, meal.day)} · {MEAL_TYPE_LABELS[meal.mealType]}
                    </span>
                    {meal.status === 'cooked' ? (
                      <Badge tone="solid-primary">COOKED</Badge>
                    ) : meal.status === 'swapped' ? (
                      <Badge tone="primary">SWAPPED</Badge>
                    ) : skipped ? (
                      <Badge tone="neutral">SKIPPED</Badge>
                    ) : null}
                  </div>

                  <h3 className="font-title-md text-title-md truncate mt-0.5 font-bold text-on-surface">
                    <Link href={`/recipes/${meal.recipeId}`} className="hover:underline">
                      {meal.recipeTitle}
                    </Link>
                  </h3>

                  <p className="font-body-sm text-[12px] text-on-surface-variant flex items-center gap-xs mt-1">
                    <Icon name="groups" className="text-sm" />
                    <span>{meal.participants.length} in for this meal</span>
                  </p>
                </div>
              </div>

              <MealStatusControls
                mealId={meal.id}
                recipeTitle={recipe?.title ?? meal.recipeTitle}
                status={meal.status}
                bailed={Boolean(mine?.bailed)}
                day={meal.day}
                weekStartDate={plan.weekStartDate}
                isCook={isCook}
                otherDinersBailed={otherDinersBailed}
                cookBailed={cookBailed}
              />

              {skipped && recipe && (
                <div className="flex flex-col gap-sm pt-sm border-t border-surface-container-highest">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    You&apos;ve got{' '}
                    <strong className="text-on-surface font-semibold">
                      {recipe.ingredients.map((ingredient) => ingredient.name).join(', ')}
                    </strong>
                    .
                  </p>

                  {perishables.length > 0 && (
                    <p className="flex items-start gap-xs font-body-sm text-body-sm text-secondary">
                      <Icon name="schedule" className="text-[18px] mt-0.5" />
                      <span>
                        {perishables.map((ingredient) => ingredient.name).join(', ')}{' '}
                        {perishables.length === 1 ? 'is' : 'are'} fresh — use{' '}
                        {perishables.length === 1 ? 'it' : 'them'} before{' '}
                        {perishables.length === 1 ? 'it goes' : 'they go'} off.
                      </span>
                    </p>
                  )}

                  {suggestions.length > 0 ? (
                    <>
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                        What else you could make
                      </span>
                      <ul className="flex flex-col gap-xs">
                        {suggestions.map((suggestion) => (
                          <li key={suggestion.recipe.id}>
                            <Link
                              href={`/recipes/${suggestion.recipe.id}`}
                              className="flex items-center justify-between gap-sm px-md py-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                            >
                              <span className="min-w-0">
                                <span className="font-body-lg text-body-lg font-semibold block truncate">
                                  {suggestion.recipe.title}
                                </span>
                                <span className="font-body-sm text-[12px] text-on-surface-variant">
                                  Uses {suggestion.have.length} of what you have
                                  {suggestion.missing.length > 0
                                    ? ` · still need ${suggestion.missing
                                        .map((ingredient) => ingredient.name)
                                        .join(', ')}`
                                    : ' · nothing else needed'}
                                </span>
                              </span>
                              <Icon name="chevron_right" className="text-on-surface-variant shrink-0" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Nothing in the book uses enough of this. Add a recipe and it’ll turn up here next
                      time this happens.
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
