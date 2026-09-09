'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { FoodImage } from '@/components/media/FoodImage';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { NutritionPill } from '@/components/recipes/NutritionPill';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import { addMealToPlan, type PlanActionState } from '@/app/plan/actions';
import type { MealType, Recipe, Weekday } from '@/lib/types';
import type { WeekChoice } from '@/lib/weeks';
import { MEAL_TYPES, MEAL_TYPE_ICONS, MEAL_TYPE_LABELS, WEEKDAYS, WEEKDAY_LABELS } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { formatRecipeTitle } from '@/lib/recipeFormatting';

/**
 * The house recipe book, and the way meals get planned.
 *
 * This owns a whole screen rather than a section of the Plan tab. It was inline
 * on Plan for exactly one iteration, which made Plan about 70% recipe browser
 * and left two differently-designed browsers over one dataset. A library and a
 * week are different things with different lifespans; they get different pages.
 *
 * Arriving from a day card (`/recipes?day=wed`) pre-selects that day and
 * returns you to the week once the meal lands, so planning is still two taps.
 * Arriving with no day is ordinary browsing and stays put.
 */

const INITIAL: PlanActionState = { status: 'idle', message: '' };

/** Under this, a recipe is quick enough to cook on a weeknight after lectures. */
const QUICK_MINUTES = 25;

/** Per portion. Above this it is not a student budget meal. */
const BUDGET_PENCE = 250;

/**
 * Meat and fish words, for the Veggie filter.
 *
 * A heuristic, and a deliberately cautious one: it only ever *excludes*, so the
 * failure mode is a vegetarian recipe missing from the filter rather than a
 * chicken curry appearing in it. Recipes tagged vegetarian or vegan are trusted
 * outright.
 */
const MEAT_WORDS = [
  'chicken', 'beef', 'pork', 'lamb', 'bacon', 'sausage', 'ham', 'turkey', 'duck',
  'mince', 'steak', 'salmon', 'tuna', 'prawn', 'fish', 'anchovy', 'chorizo',
  'pepperoni', 'gelatin', 'stock cube',
];

type VibeKey = 'quick' | 'budget' | 'comfort' | 'protein' | 'fakeaway' | 'low-washup' | 'pantry' | 'veggie';

interface VibeChip {
  key: VibeKey;
  label: string;
  icon: string;
  matches: (recipe: Recipe) => boolean;
}

const VIBE_CHIPS: VibeChip[] = [
  {
    key: 'quick',
    label: 'Quick',
    icon: 'bolt',
    matches: (recipe) => recipe.cookTimeMins <= QUICK_MINUTES,
  },
  {
    key: 'budget',
    label: 'Budget',
    icon: 'savings',
    matches: (recipe) =>
      (recipe.costPerPortion > 0 && recipe.costPerPortion <= BUDGET_PENCE) ||
      recipe.tags.some((t) => /budget|cheap|frugal/i.test(t)),
  },
  {
    key: 'comfort',
    label: 'Comfort',
    icon: 'soup_kitchen',
    matches: (recipe) =>
      recipe.tags.some((t) => /comfort|pasta|bake|curry|stew|bolognese|chilli|pie|lasagne|cheese/i.test(t)) ||
      /pasta|curry|stew|chilli|pie|bake|bolognese|lasagne|mac/i.test(recipe.title),
  },
  {
    key: 'protein',
    label: 'High Protein',
    icon: 'fitness_center',
    matches: (recipe) =>
      recipe.tags.some((t) => /protein|gym|beef|chicken|salmon|tuna|steak/i.test(t)) ||
      recipe.ingredients.some((i) => /chicken|beef|salmon|tuna|steak|mince|turkey|tofu|eggs?/i.test(i.name)),
  },
  {
    key: 'fakeaway',
    label: 'Fakeaway',
    icon: 'takeout_dining',
    matches: (recipe) =>
      recipe.tags.some((t) => /fakeaway|asian|curry|stir fry|noodles|burger|pizza|tacos?|burrito|mexican/i.test(t)) ||
      /stir fry|curry|noodle|burger|tikka|pizza|taco|burrito|katsu|ramen/i.test(recipe.title),
  },
  {
    key: 'low-washup',
    label: 'One-Pot',
    icon: 'cleaning_services',
    matches: (recipe) =>
      recipe.tags.some((t) => /one-pot|traybake|skillet|pan|sheet/i.test(t)) ||
      /stir fry|soup|stew|curry|pasta bake|ramen|frittata/i.test(recipe.title),
  },
  {
    key: 'pantry',
    label: 'Pantry match',
    icon: 'kitchen',
    matches: (recipe) => recipe.ingredients.some((ingredient) => ingredient.inPantry),
  },
  {
    key: 'veggie',
    label: 'Veggie',
    icon: 'eco',
    matches: (recipe) => {
      const tags = recipe.tags.map((tag) => tag.toLowerCase());
      if (tags.includes('vegetarian') || tags.includes('vegan') || tags.includes('veggie') || tags.includes('salad')) {
        return true;
      }
      return !recipe.ingredients.some((ingredient) => {
        const name = ingredient.name.toLowerCase();
        return MEAT_WORDS.some((word) => name.includes(word));
      });
    },
  },
];

/**
 * At-a-glance facts for the card photo, Mob-style corner badges rather than
 * text you have to read the whole card to find.
 */
function cardBadges(recipe: Recipe): { label: string; icon: string }[] {
  const badges: { label: string; icon: string }[] = [];

  if (VIBE_CHIPS.find((chip) => chip.key === 'quick')?.matches(recipe)) {
    badges.push({ label: 'Quick', icon: 'bolt' });
  }
  if (VIBE_CHIPS.find((chip) => chip.key === 'comfort')?.matches(recipe)) {
    badges.push({ label: 'Comfort', icon: 'soup_kitchen' });
  } else if (VIBE_CHIPS.find((chip) => chip.key === 'protein')?.matches(recipe)) {
    badges.push({ label: 'Protein', icon: 'fitness_center' });
  } else if (VIBE_CHIPS.find((chip) => chip.key === 'veggie')?.matches(recipe)) {
    badges.push({ label: 'Veggie', icon: 'eco' });
  }

  return badges.slice(0, 2);
}

function AddButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" fullWidth icon="check" pending={pending} pendingLabel="Adding…">
      {label}
    </Button>
  );
}

/** Day + sitting, as tap targets. No dropdown, no free text, two taps to plan. */
function QuickAddSheet({
  recipe,
  onClose,
  onPlanned,
  locked,
  initialDay,
  week,
}: {
  recipe: Recipe;
  onClose: () => void;
  onPlanned: () => void;
  locked: boolean;
  initialDay: Weekday;
  week: WeekChoice;
}) {
  const [state, action] = useActionState(addMealToPlan, INITIAL);
  const [day, setDay] = useState<Weekday>(initialDay);
  const [mealType, setMealType] = useState<MealType>('dinner');
  const { toast } = useToast();

  // Close on success only. Staying open after an error is the point — the
  // message is inside the sheet.
  useEffect(() => {
    if (state.status !== 'success') return;
    toast(`Added ${recipe.title} to ${WEEKDAY_LABELS[day]}.`);
    onPlanned();
  }, [day, onPlanned, recipe.title, state.status, toast]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-xl sm:rounded-xl border border-surface-container-highest shadow-ambient-card p-lg flex flex-col gap-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-start gap-sm">
          <FoodImage
            seed={recipe.id}
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-14 h-14 rounded-lg text-[24px] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-title-md text-title-md leading-tight">
              {formatRecipeTitle(recipe.title)}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {recipe.cookTimeMins} min · serves {recipe.servings}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
          >
            <Icon name="close" />
          </button>
        </div>

        <form action={action} className="flex flex-col gap-md">
          <input type="hidden" name="recipeId" value={recipe.id} />
          <input type="hidden" name="day" value={day} />
          <input type="hidden" name="mealType" value={mealType} />
          {/* Which plan the meal lands on. Without it every add would go to the
              week being eaten, which is the one you cannot change. */}
          <input type="hidden" name="week" value={week} />

          <fieldset className="flex flex-col gap-xs">
            <legend className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-xs">
              Which day
            </legend>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-xs">
              {WEEKDAYS.map((option) => (
                <Chip
                  key={option}
                  active={day === option}
                  tickWhenActive={false}
                  onClick={() => setDay(option)}
                  className="h-11 w-full justify-center px-0"
                >
                  {WEEKDAY_LABELS[option].slice(0, 3)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-xs">
            <legend className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-xs">
              Which sitting
            </legend>
            <div className="grid grid-cols-3 gap-xs">
              {MEAL_TYPES.map((option) => (
                <Chip
                  key={option}
                  active={mealType === option}
                  tickWhenActive={false}
                  icon={MEAL_TYPE_ICONS[option]}
                  onClick={() => setMealType(option)}
                  className="h-11 w-full justify-center px-0"
                >
                  {MEAL_TYPE_LABELS[option]}
                </Chip>
              ))}
            </div>
          </fieldset>

          {locked ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Planning is closed for this week.
            </p>
          ) : (
            <AddButton label={`Add to ${WEEKDAY_LABELS[day]}${week === 'next' ? ' next week' : ''}`} />
          )}

          {state.status === 'error' ? (
            <p role="alert" className="font-body-sm text-body-sm text-error">
              {state.message}
            </p>
          ) : (
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              If a housemate already picked this for the same sitting you&apos;ll join them —
              that overlap is where the savings come from.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export function RecipeBrowser({
  recipes,
  locked,
  planningForDay,
  week = 'this',
  houseDiets = [],
}: {
  recipes: Recipe[];
  locked: boolean;
  /** Set when you arrived from a day card. Pre-selects it and returns you there. */
  planningForDay?: Weekday;
  /** Which week a pick lands on. */
  week?: WeekChoice;
  /** Optional legacy initial filters. */
  initialDietaryFilters?: string[];
  /** Aggregated house dietary restrictions to reassure users */
  houseDiets?: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeVibes, setActiveVibes] = useState<VibeKey[]>([]);
  const [chosen, setChosen] = useState<Recipe | null>(null);

  const today = WEEKDAYS[(new Date().getDay() + 6) % 7];

  // A vibe chip that can only ever return nothing is disabled
  const usable = useMemo(
    () => new Set(VIBE_CHIPS.filter((chip) => recipes.some(chip.matches)).map((chip) => chip.key)),
    [recipes]
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (needle) {
        const haystack = `${recipe.title} ${recipe.tags.join(' ')} ${recipe.ingredients
          .map((ingredient) => ingredient.name)
          .join(' ')}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      // Check active meal vibe filters
      if (!activeVibes.every((key) => VIBE_CHIPS.find((chip) => chip.key === key)?.matches(recipe))) {
        return false;
      }
      return true;
    });
  }, [recipes, query, activeVibes]);

  function toggleVibe(key: VibeKey) {
    setActiveVibes((current) =>
      current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col gap-sm">
        <div className="relative block">
          <span className="sr-only">Search recipes</span>
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a recipe, or something in the fridge…"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all shadow-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          )}
        </div>

        {/* Dietary Reassurance Banner: lets students know their flat's diets are noted down */}
        {houseDiets && houseDiets.length > 0 ? (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-primary/8 border border-primary/20 text-xs text-on-surface animate-fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon name="verified_user" className="text-primary text-[15px] shrink-0" />
              <span className="truncate">
                House diets noted: <strong className="font-semibold text-primary">{houseDiets.join(', ')}</strong>
              </span>
            </div>
            <Link
              href="/account"
              className="shrink-0 text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
              title="Manage dietary preferences in My Account"
            >
              <span>Profile</span>
              <Icon name="arrow_forward" className="text-[12px]" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon name="shield" className="text-on-surface-variant text-[15px] shrink-0" />
              <span className="truncate">No dietary restrictions recorded for flat</span>
            </div>
            <Link
              href="/account"
              className="shrink-0 text-[11px] font-bold text-primary hover:underline"
            >
              Add in profile &rarr;
            </Link>
          </div>
        )}

        {/* Meal Vibes Bar */}
        <div className="flex items-center gap-xs overflow-x-auto hide-scrollbar pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 shrink-0 mr-1 hidden sm:inline-block">
            Vibe:
          </span>
          {VIBE_CHIPS.map((chip) => {
            const on = activeVibes.includes(chip.key);
            const available = usable.has(chip.key);
            return (
              <Chip
                key={chip.key}
                active={on}
                icon={chip.icon}
                disabled={!available}
                onClick={() => toggleVibe(chip.key)}
                className="shrink-0 text-xs font-semibold py-1.5"
                title={available ? undefined : 'No recipes match this vibe yet.'}
              >
                {chip.label}
              </Chip>
            );
          })}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-sm py-lg text-center">
          <Icon name="search_off" className="text-on-surface-variant text-[32px]" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Nothing matches. Drop a filter, or{' '}
            <Link href="/recipes/new" className="text-primary font-semibold underline">
              add the recipe
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {results.map((recipe) => {
            const inPantry = recipe.ingredients.filter((ingredient) => ingredient.inPantry).length;
            const badges = cardBadges(recipe);
            return (
              <li key={recipe.id}>
                <button
                  type="button"
                  onClick={() => setChosen(recipe)}
                  className={clsx(
                    'group w-full h-full text-left bg-surface-container-lowest rounded-2xl border border-surface-container-highest',
                    'shadow-ambient-card overflow-hidden flex flex-col transition-all duration-300',
                    'hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0'
                  )}
                >
                  <span className="relative block overflow-hidden">
                    <FoodImage
                      seed={recipe.id}
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full h-28 sm:h-32 text-[32px] transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent" />
                    {badges.length > 0 && (
                      <span className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                        {badges.map((badge) => (
                          <Badge key={badge.label} tone="photo" icon={badge.icon}>
                            {badge.label}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="p-sm flex flex-col gap-xs flex-1">
                    <span className="font-body-lg text-body-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {formatRecipeTitle(recipe.title)}
                    </span>
                    <span className="font-body-sm text-[12px] text-on-surface-variant flex items-center gap-xs flex-wrap mt-auto">
                      <span className="flex items-center gap-0.5">
                        <Icon name="schedule" className="text-[14px]" />
                        {recipe.cookTimeMins} min
                      </span>
                      {/* Never "£0.00/portion": zero means unpriced, and this
                          screen is where people judge what a meal costs. */}
                      {recipe.costPerPortion > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-numeric-data">
                            {formatPence(recipe.costPerPortion)}/portion
                          </span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                      {(recipe.caloriesPerPortion || recipe.proteinGrams) && (
                        <NutritionPill
                          calories={recipe.caloriesPerPortion}
                          proteinGrams={recipe.proteinGrams}
                          variant="compact"
                        />
                      )}
                      {inPantry > 0 && (
                        <span className="font-label-caps text-[10px] uppercase tracking-wider text-primary font-bold bg-primary/10 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                          <Icon name="kitchen" className="text-[11px]" />
                          {inPantry} pantry
                        </span>
                      )}
                    </div>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ButtonLink href="/recipes/new" variant="ghost" size="sm" icon="add" className="self-start">
        Add one the house hasn&apos;t got
      </ButtonLink>

      {chosen && (
        <QuickAddSheet
          recipe={chosen}
          locked={locked}
          initialDay={planningForDay ?? today}
          week={week}
          onClose={() => setChosen(null)}
          onPlanned={() => {
            setChosen(null);
            // Came from the week, so go back to it — landing on a recipe list
            // after planning leaves you wondering whether it worked.
            if (planningForDay) router.push(week === 'next' ? '/plan?week=next' : '/plan');
            else router.refresh();
          }}
        />
      )}
    </div>
  );
}
