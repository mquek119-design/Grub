import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FoodImage } from '@/components/media/FoodImage';
import { Icon } from '@/components/media/Icon';
import { RecipeDetail } from '@/components/recipes/RecipeDetail';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/ui/PageShell';
import { getRecipe, getWeeklyPlan } from '@/lib/queries';
import { formatRecipeTitle } from '@/lib/recipeFormatting';
import { WEEKDAY_LABELS, MEAL_TYPE_LABELS } from '@/lib/types';

// Recipes are per-house and behind auth, so there is nothing to prerender —
// generateStaticParams would run without a session at build time.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  const formattedTitle = recipe ? formatRecipeTitle(recipe.title) : null;
  return {
    title: formattedTitle ? `${formattedTitle} · Grub` : 'Recipe · Grub',
    description: formattedTitle
      ? `View ${formattedTitle}, its ingredients, and cooking instructions.`
      : 'View recipe ingredients and cooking instructions.',
  };
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, plan] = await Promise.all([
    getRecipe(id),
    getWeeklyPlan(),
  ]);

  if (!recipe) notFound();

  // Check if this recipe is already planned for this week
  const plannedMeal = plan?.meals.find((m) => m.recipeId === recipe.id);
  const isPlannedThisWeek = Boolean(plannedMeal);
  const weekIsLocked = plan?.status === 'ordered' || plan?.status === 'delivered';
  // In cook mode context: recipe is planned AND the week is locked (ingredients are bought)
  const isCookContext = isPlannedThisWeek && weekIsLocked;

  // For cook context, use the actual number of participants as the fixed serving count
  const cookServings = plannedMeal ? plannedMeal.participants.length : recipe.servings;

  return (
    <PageShell>
      <Link
        href="/recipes"
        className="flex items-center gap-xs text-primary font-semibold text-[14px] hover:opacity-80 w-fit"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        All recipes
      </Link>

      <FoodImage
        seed={recipe.id}
        alt={recipe.title}
        src={recipe.imageUrl}
        className="w-full h-48 md:h-64 rounded-xl text-[64px]"
      />

      <div className="flex items-start justify-between gap-sm flex-wrap">
        <div className="flex flex-col gap-xs min-w-0">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg font-bold">
            {formatRecipeTitle(recipe.title)}
          </h1>
          <div className="flex flex-wrap gap-xs">
            {recipe.tags.map((tag) => (
              <Badge key={tag} tone="primary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {isCookContext ? (
          /* Cooking context: the meal is planned & bought — show "Cooking tonight" badge instead of Edit/Plan */
          <div className="flex items-center gap-xs px-md py-sm rounded-full bg-primary text-on-primary font-semibold text-sm">
            <Icon name="skillet" className="text-lg" />
            {plannedMeal
              ? `${WEEKDAY_LABELS[plannedMeal.day]} ${MEAL_TYPE_LABELS[plannedMeal.mealType]} · ${plannedMeal.participants.length} eating`
              : 'Planned meal'}
          </div>
        ) : (
          /* Normal browse context: show Edit and Plan buttons */
          <>
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="shrink-0 px-md py-3 rounded-full border border-outline-variant text-on-surface-variant font-semibold hover:border-primary hover:text-primary transition-colors"
            >
              Edit
            </Link>
            <Link
              href="/plan#roster"
              className="shrink-0 px-lg py-3 rounded-full bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity"
            >
              Plan
            </Link>
          </>
        )}
      </div>

      <RecipeDetail recipe={recipe} cookContext={isCookContext} fixedServings={cookServings} />
    </PageShell>
  );
}
