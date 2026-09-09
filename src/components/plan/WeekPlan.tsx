'use client';

import Link from 'next/link';
import { useState, useMemo, memo, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Avatar } from '@/components/avatars/Avatar';
import { MealOptionsSheet } from '@/components/plan/MealOptionsSheet';
import { DietaryWarning } from '@/components/plan/DietaryWarning';
import { FoodImage } from '@/components/media/FoodImage';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { clsx } from '@/lib/clsx';
import { canSetCapacity, mealOwnerId, mouthsAt } from '@/lib/meals';
import { joinMeal, leaveMeal, type PlanActionState } from '@/app/plan/actions';
import type { PlannedMeal, Recipe, User, Weekday, WeeklyPlan } from '@/lib/types';
import type { WeekChoice } from '@/lib/weeks';
import { isCutoffPassed } from '@/lib/weeks';
import { MEAL_TYPES, MEAL_TYPE_ICONS, MEAL_TYPE_LABELS, WEEKDAYS, WEEKDAY_LABELS } from '@/lib/types';

/**
 * The week as a list of days, two abreast on a wide screen.
 *
 * A meal is two lines: sitting and title on one, everything true about it on
 * the next. The controls that only matter to people eating it — cook, guests,
 * how many the pan holds — appear on a third line and only for them, so a meal
 * you are not in stays two lines high and the week stays scannable.
 *
 * A day holds as many meals as people want. Joining somebody else's is an
 * invitation, never an obligation, and adding your own for the same night is
 * equally normal — so meals stack, with no group numbering and no error colour.
 */

const INITIAL: PlanActionState = { status: 'idle', message: '' };

const WEEKEND: Weekday[] = ['sat', 'sun'];

function dayDate(weekStartDate: string, day: Weekday): string {
  const index = WEEKDAYS.indexOf(day);
  const date = new Date(`${weekStartDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + index);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function JoinToggle({
  joined,
  full,
  cutoffPassed,
}: {
  joined: boolean;
  full: boolean;
  cutoffPassed: boolean;
}) {
  const { pending } = useFormStatus();

  if (cutoffPassed && !joined) {
    return (
      <span
        title="Planning is closed for this week"
        className="shrink-0 inline-flex items-center gap-xs px-2.5 h-8 rounded-full border border-outline-variant text-on-surface-variant/70 text-[12px] font-semibold"
      >
        <Icon name="lock" className="text-[14px]" />
        Closed
      </span>
    );
  }

  if (full && !joined) {
    return (
      <span
        title="Cooked for a set number. Put your own meal on for the same night instead."
        className="shrink-0 inline-flex items-center gap-xs px-2.5 h-8 rounded-full border border-outline-variant text-on-surface-variant/70 text-[12px] font-semibold"
      >
        <Icon name="lock" className="text-[14px]" />
        Full
      </span>
    );
  }

  return (
    <Button
      type="submit"
      size="sm"
      pending={pending}
      pendingLabel="…"
      variant={joined ? 'outline' : 'primary'}
      icon={joined ? 'logout' : 'add'}
      className="shrink-0"
      disabled={cutoffPassed}
    >
      {joined ? 'Leave' : 'Join'}
    </Button>
  );
}

const MealRow = memo(function MealRow({
  meal,
  housemates,
  currentUser,
  locked,
  past,
  recipe,
  cutoffPassed,
}: {
  meal: PlannedMeal;
  housemates: User[];
  currentUser: User;
  locked: boolean;
  /**
   * The day has been and gone. Closes planning — you cannot join Monday's
   * dinner on Thursday — but deliberately leaves the options sheet open,
   * because whether it got cooked is recorded after the night, usually the
   * next morning.
   */
  past: boolean;
  recipe?: Recipe;
  /**
   * Cutoff time has passed. Closes planning — you cannot join or leave meals
   * after the order cutoff, even if the day is still in the future.
   */
  cutoffPassed: boolean;
}) {
  const [, joinAction] = useActionState(joinMeal, INITIAL);
  const [, leaveAction] = useActionState(leaveMeal, INITIAL);
  const [optionsOpen, setOptionsOpen] = useState(false);

  // Memoize housemates lookup Map to avoid recreation on every render
  const byId = useMemo(() => new Map(housemates.map((user) => [user.id, user])), [housemates]);
  const diners = useMemo(
    () =>
      meal.participants
        .map((participant) => ({ user: byId.get(participant.userId), guests: participant.guests ?? 0 }))
        .filter((entry): entry is { user: User; guests: number } => Boolean(entry.user)),
    [meal.participants, byId]
  );

  const mine = meal.participants.find((participant) => participant.userId === currentUser.id);
  const joined = Boolean(mine);
  const cook = meal.cookedByUserId ? byId.get(meal.cookedByUserId) : undefined;
  const coCook = meal.coCookUserId ? byId.get(meal.coCookUserId) : undefined;
  const cleaner = meal.cleanerUserId ? byId.get(meal.cleanerUserId) : undefined;
  const offeredTo = meal.cookOfferTo ? byId.get(meal.cookOfferTo) : undefined;
  const askedMe = meal.cookOfferTo === currentUser.id;
  const mouths = mouthsAt(meal);
  const full = meal.maxDiners !== null && mouths >= meal.maxDiners;

  // Capping a meal belongs to whoever put it on, not to the table. Everyone
  // else sees the number as a fact about the night, which is all it is to them.
  const isOwner = canSetCapacity(meal, currentUser.id);
  const owner = mealOwnerId(meal);
  const ownerName = owner ? byId.get(owner)?.name : undefined;

  return (
    <article
      className={clsx(
        'flex flex-col gap-1.5 px-3 md:px-4 py-2.5 md:py-3 transition-all duration-200',
        joined ? 'bg-primary-fixed/25 border-l-4 border-l-primary' : 'hover:bg-surface-container-low/60'
      )}
    >
      {/* Top section: Dish thumbnail, Eyebrow & Full-Width Recipe Title */}
      <div className="flex items-start gap-2.5 md:gap-3 min-w-0">
        <Link
          href={`/recipes/${meal.recipeId}`}
          className="shrink-0 rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs group mt-0.5"
        >
          <FoodImage
            seed={meal.recipeId}
            src={recipe?.imageUrl}
            alt={meal.recipeTitle}
            className="w-11 h-11 md:w-12 md:h-12 rounded-xl text-[18px] object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          {/* Sitting eyebrow placed cleanly on its own line above the dish name */}
          <div className="flex items-center gap-1 font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant font-bold leading-none mb-1">
            <Icon name={MEAL_TYPE_ICONS[meal.mealType]} className="text-[12px] text-primary" />
            <span>{MEAL_TYPE_LABELS[meal.mealType]}</span>
            {full && (
              <Badge tone="error" className="text-[8px] py-0 px-1 ml-1">
                FULL
              </Badge>
            )}
          </div>

          <Link href={`/recipes/${meal.recipeId}`} className="min-w-0 hover:underline block group">
            <h4 className="font-title-md text-[14px] md:text-[15px] font-bold text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {meal.recipeTitle}
            </h4>
          </Link>
        </div>
      </div>

      {/* Dietary warning if applicable */}
      {recipe && (
        <DietaryWarning
          recipe={recipe}
          currentUser={currentUser}
        />
      )}

      {/* Bottom section: Metadata (who's in, cook, cleaner) + Action buttons */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-container-highest/40">
        <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap font-body-sm text-[11.5px] text-on-surface-variant leading-tight min-w-0">
          {diners.length > 0 ? (
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="flex items-center -space-x-1.5">
                {diners.slice(0, 5).map(({ user }) => (
                  <Avatar
                    key={user.id}
                    user={user}
                    size="xs"
                    className="ring-2 ring-surface-container-lowest"
                  />
                ))}
              </span>
              <span className="font-numeric-data font-medium">
                {mouths}
                {meal.maxDiners !== null && ` of ${meal.maxDiners}`} in
              </span>
            </span>
          ) : (
            // "0 in" reads like a bug. This is a meal waiting for someone.
            <span className="italic shrink-0">Nobody&apos;s in yet</span>
          )}

          <span className={clsx('flex items-center gap-1 shrink-0', !cook && 'italic opacity-70')}>
            <Icon name="skillet" className="text-[13px]" />
            {cook ? (
              <>
                {cook.name}
                {coCook && ` & ${coCook.name}`}
                {coCook ? ' cook' : ' cooks'}
              </>
            ) : (
              'No cook yet'
            )}
          </span>

          {cleaner && (
            <span
              className="flex items-center gap-1 text-primary font-medium shrink-0"
              title={`${cleaner.name} is on wash-up duty`}
            >
              <Icon name="cleaning_services" className="text-[13px]" />
              {cleaner.id === currentUser.id ? 'you clean' : `${cleaner.name} cleans`}
            </span>
          )}

          {/* A pending hand-over is worth seeing from the week: it is the one
              state where the person on the meal is not the person who will
              end up cooking it. */}
          {offeredTo && (
            <span
              className="flex items-center gap-1 text-on-secondary-fixed shrink-0"
              title={`${cook?.name ?? 'They'} asked ${offeredTo.name} to take it`}
            >
              <Icon name="pending" className="text-[13px]" />
              {askedMe ? 'they asked you' : `asked ${offeredTo.name}`}
            </span>
          )}

          {(mine?.guests ?? 0) > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <Icon name="person_add" className="text-[13px]" />
              you +{mine?.guests}
            </span>
          )}

          {/* Read-only for everybody but the owner, so a cap is never a
              mystery — you can see the number and whose call it was. */}
          {meal.maxDiners !== null && !isOwner && (
            <span
              className="flex items-center gap-1 text-on-secondary-fixed shrink-0"
              title={
                ownerName
                  ? `${ownerName} is cooking for ${meal.maxDiners}`
                  : `Cooked for ${meal.maxDiners}`
              }
            >
              <Icon name="lock" className="text-[13px]" />
              Cooking for {meal.maxDiners}
            </span>
          )}
        </div>

        {!locked && (
          <div className="flex items-center gap-xs shrink-0 ml-auto">
            {/* Cook, guests, capacity and who's in all live behind this. They
                are settings you change once, not information you read every
                time, and three permanent controls per meal buried the week. */}
            {joined && (
              <button
                type="button"
                onClick={() => setOptionsOpen(true)}
                aria-label={`Options for ${meal.recipeTitle}`}
                className={clsx(
                  'w-8 h-8 rounded-full transition-all flex items-center justify-center btn-tactile active:scale-90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  askedMe
                    ? 'bg-secondary-fixed text-on-secondary-fixed'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                )}
              >
                <Icon name={askedMe ? 'notifications' : 'tune'} className="text-[16px]" />
              </button>
            )}
            {/* Gone days and post-cutoff periods keep the sheet and lose the toggle. */}
            {!past && !cutoffPassed && (
              <form action={joined ? leaveAction : joinAction}>
                <input type="hidden" name="mealId" value={meal.id} />
                <JoinToggle joined={joined} full={full} cutoffPassed={false} />
              </form>
            )}
            {!past && cutoffPassed && (
              <JoinToggle joined={joined} full={full} cutoffPassed={true} />
            )}
          </div>
        )}
      </div>

      {optionsOpen && (
        <MealOptionsSheet
          meal={meal}
          diners={diners}
          currentUser={currentUser}
          onClose={() => setOptionsOpen(false)}
        />
      )}

      {full && !joined && (
        <p className="font-body-sm text-body-sm text-on-surface-variant px-md pb-sm italic">
          This meal is full. Add your own meal for {WEEKDAY_LABELS[meal.day].toLowerCase()} if you want to eat.
        </p>
      )}
    </article>
  );
});

export function WeekPlan({
  plan,
  housemates,
  currentUser,
  week,
}: {
  plan: WeeklyPlan;
  housemates: User[];
  currentUser: User;
  /** Carried into the recipe book so a meal lands on the week you were looking at. */
  week: WeekChoice;
}) {
  const locked = plan.status !== 'planning';
  const cutoffPassed = isCutoffPassed(plan.cutoffAt);
  // Only this week has a today, and only this week has a past. Next week is all
  // still ahead of you, so greying Monday there would be pointing at a day that
  // has not happened.
  const todayIndex = week === 'this' ? (new Date().getDay() + 6) % 7 : -1;
  const today = todayIndex >= 0 ? WEEKDAYS[todayIndex] : null;

  const days = WEEKDAYS.filter(
    (day) => !WEEKEND.includes(day) || plan.meals.some((meal) => meal.day === day)
  );

  return (
    <div className="flex flex-col">
      {/* Mobile Sticky Weekday Jump Rail (< lg) */}
      <div className="lg:hidden sticky top-[72px] z-20 -mx-margin-mobile px-margin-mobile py-xs bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 flex items-center gap-xs overflow-x-auto hide-scrollbar mb-sm">
        {today && (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById(`day-${today}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="shrink-0 px-sm py-1 rounded-full text-xs font-bold bg-primary text-on-primary shadow-xs btn-tactile flex items-center gap-1"
          >
            <Icon name="today" className="text-sm" />
            <span>Today</span>
          </button>
        )}
        {days.map((d) => {
          const isCurrent = d === today;
          return (
            <button
              key={`nav-${d}`}
              type="button"
              onClick={() => {
                const el = document.getElementById(`day-${d}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={clsx(
                'shrink-0 px-sm py-1 rounded-full text-xs font-semibold border transition-all btn-tactile',
                isCurrent
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container'
              )}
            >
              {WEEKDAY_LABELS[d].slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Two abreast once there is room. A single column on a 1400px screen left
          two thirds of the page empty and pushed Friday below the fold. */}
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-md items-start">
        {days.map((day, dayIndex) => {
          const dayMeals = plan.meals
            .filter((meal) => meal.day === day)
            .sort((a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType));

          const isToday = day === today;
          const isPast = todayIndex >= 0 && WEEKDAYS.indexOf(day) < todayIndex;
          const shared = dayMeals.length === 1 && dayMeals[0].isShared ? dayMeals[0] : null;

          return (
            <li
              key={day}
              id={`day-${day}`}
              // A gentle staggered load-in. Skipped on past days — their whole
              // point is to recede, so they keep the flat opacity-70 rather than
              // animating up to full and then dimming, which would fight itself.
              // No meal figure lives on this card, so this breaks no money rule.
              className={clsx(
                'scroll-mt-[124px] rounded-xl border bg-surface-container-lowest shadow-ambient-card',
                isToday ? 'border-primary/40' : 'border-surface-container-highest',
                isPast ? 'opacity-70' : 'animate-fade-in-up'
              )}
              style={isPast ? undefined : { animationDelay: `${dayIndex * 60}ms` }}
            >
            <header
              className={clsx(
                'flex items-center justify-between gap-sm px-3 md:px-md py-2 md:py-sm border-b rounded-t-xl',
                isToday
                  ? 'bg-primary-fixed border-primary/20'
                  : cutoffPassed && !locked
                    ? 'bg-surface-container-low/40 border-surface-container-highest opacity-70'
                    : 'bg-surface-container-low/60 border-surface-container-highest'
              )}
            >
              <div className="flex items-baseline gap-1.5 sm:gap-sm min-w-0 flex-wrap">
                <h3
                  className={clsx(
                    'font-title-md text-[15px] sm:text-title-md',
                    isToday
                      ? 'text-on-primary-fixed'
                      : isPast || (cutoffPassed && !locked)
                        ? 'text-on-surface-variant'
                        : 'text-on-surface'
                  )}
                >
                  {WEEKDAY_LABELS[day]}
                </h3>
                <span
                  className={clsx(
                    'font-numeric-data text-[12px]',
                    isToday ? 'text-on-primary-fixed/70' : 'text-on-surface-variant'
                  )}
                >
                  {dayDate(plan.weekStartDate, day)}
                </span>
                {isToday && <Badge tone="solid-primary">TODAY</Badge>}
                {isPast && <Badge>GONE</Badge>}
              </div>

              {/* One meal the whole table is on is the outcome the app exists
                  to produce, so it gets said out loud. */}
              {shared && (
                <Badge tone="primary" className="shrink-0">
                  ALL IN
                </Badge>
              )}
            </header>

            <div className="divide-y divide-surface-container-highest">
              {dayMeals.map((meal) => (
                <MealRow
                  key={meal.id}
                  meal={meal}
                  housemates={housemates}
                  currentUser={currentUser}
                  locked={locked}
                  past={isPast}
                  recipe={plan.recipes.get(meal.recipeId)}
                  cutoffPassed={cutoffPassed}
                />
              ))}

              {!locked && !isPast && !cutoffPassed && (
                <Link
                  href={`/recipes?day=${day}${week === 'next' ? '&week=next' : ''}`}
                  className={clsx(
                    'flex items-center justify-center gap-xs py-3 text-on-surface-variant',
                    'hover:text-primary hover:bg-primary/5 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
                  )}
                >
                  <Icon name="add" className="text-[18px]" />
                  <span className="font-body-sm text-body-sm font-semibold">
                    {dayMeals.length === 0 ? 'Put something on' : 'Add another'}
                  </span>
                </Link>
              )}

              {!locked && !isPast && cutoffPassed && dayMeals.length === 0 && (
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-md italic opacity-70">
                  Planning closed for this week.
                </p>
              )}

              {(locked || isPast) && dayMeals.length === 0 && (
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-md">
                  {isPast && !locked ? 'Nobody planned anything.' : 'Nothing planned.'}
                </p>
              )}
            </div>
          </li>
        );
      })}
      </ul>
    </div>
  );
}
