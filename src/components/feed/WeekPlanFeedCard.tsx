'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/media/Icon';
import { FoodImage } from '@/components/media/FoodImage';
import { Avatar, AvatarStack } from '@/components/avatars/Avatar';
import { clsx } from '@/lib/clsx';
import type { PlannedMeal, Recipe, User, Weekday, WeeklyPlan } from '@/lib/types';
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  MEAL_TYPE_ICONS,
  MEAL_TYPE_LABELS,
} from '@/lib/types';

const DAY_SHORT: Record<Weekday, string> = {
  mon: 'MON',
  tue: 'TUE',
  wed: 'WED',
  thu: 'THU',
  fri: 'FRI',
  sat: 'SAT',
  sun: 'SUN',
};

function dayNumber(weekStartDate: string, day: Weekday): number {
  const index = WEEKDAYS.indexOf(day);
  const date = new Date(`${weekStartDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + index);
  return date.getUTCDate();
}

function dayDate(weekStartDate: string, day: Weekday): string {
  const index = WEEKDAYS.indexOf(day);
  const date = new Date(`${weekStartDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + index);
  return `${date.getUTCDate()} ${date.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`;
}

interface WeekPlanFeedCardProps {
  plan: WeeklyPlan;
  recipes: Record<string, Recipe>;
  housemates: User[];
  currentUser: User;
  today: Weekday;
  visibleDays: Weekday[];
  sharedMealCount: number;
}

export function WeekPlanFeedCard({
  plan,
  recipes,
  housemates,
  currentUser,
  today,
  visibleDays,
  sharedMealCount,
}: WeekPlanFeedCardProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Memoize housemates lookup map
  const byId = useMemo(() => new Map(housemates.map((user) => [user.id, user])), [housemates]);

  // Group meals by day
  const mealsByDay = useMemo(() => {
    const map: Record<Weekday, PlannedMeal[]> = {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    };
    for (const meal of plan.meals) {
      if (map[meal.day]) {
        map[meal.day].push(meal);
      }
    }
    return map;
  }, [plan.meals]);

  // Default selected day: today if visible; otherwise first day with meals or first visible day
  const [selectedDay, setSelectedDay] = useState<Weekday>(() => {
    if (visibleDays.includes(today)) return today;
    const firstWithMeal = visibleDays.find((day) => (mealsByDay[day]?.length ?? 0) > 0);
    return firstWithMeal ?? visibleDays[0] ?? 'mon';
  });

  const selectedMeals = mealsByDay[selectedDay] || [];

  return (
    <Card padded={false} className="overflow-hidden interactive-card card-glow">
      {/* Header */}
      <div className="p-md flex items-center justify-between gap-sm border-b border-surface-container-highest">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-title-md text-title-md text-on-surface font-bold truncate">
            This Week&apos;s Plan
          </h2>
          <Badge tone="solid-primary" className="font-numeric-data text-xs shadow-xs shrink-0">
            {sharedMealCount} Shared
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View Toggle */}
          <div className="inline-flex p-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={clsx(
                'px-2.5 py-1 rounded-md transition-all text-xs',
                viewMode === 'day'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={clsx(
                'px-2.5 py-1 rounded-md transition-all text-xs',
                viewMode === 'week'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              All Week
            </button>
          </div>

          <Link
            href="/plan"
            className="hidden sm:inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Full Plan</span>
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>
      </div>

      {viewMode === 'day' ? (
        <>
          {/* Day Selector Rail */}
          <div className="p-3 bg-surface-container-low/50 border-b border-surface-container-highest/60">
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar snap-x">
              {visibleDays.map((day) => {
                const isSelected = selectedDay === day;
                const isToday = day === today;
                const meals = mealsByDay[day] || [];
                const hasSharedMeal = meals.some((m) => m.isShared);
                const hasMeal = meals.length > 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={clsx(
                      'flex-1 min-w-[56px] sm:min-w-[64px] flex flex-col items-center justify-between py-2 px-1.5 rounded-xl transition-all duration-150 text-center btn-tactile snap-start',
                      isSelected
                        ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/25'
                        : isToday
                        ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15'
                        : hasMeal
                        ? 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 hover:bg-surface-container'
                        : 'text-on-surface-variant/70 hover:bg-surface-container/60'
                    )}
                  >
                    <span
                      className={clsx(
                        'text-[10px] sm:text-[11px] font-bold uppercase tracking-wider',
                        isSelected ? 'text-on-primary/90' : isToday ? 'text-primary font-bold' : 'text-on-surface-variant'
                      )}
                    >
                      {DAY_SHORT[day]}
                    </span>

                    <span
                      className={clsx(
                        'font-numeric-data text-sm sm:text-base font-extrabold my-0.5',
                        isSelected ? 'text-on-primary' : isToday ? 'text-primary' : 'text-on-surface'
                      )}
                    >
                      {dayNumber(plan.weekStartDate, day)}
                    </span>

                    {/* Meal Indicator Badge / Dot */}
                    <div className="h-4 flex items-center justify-center">
                      {hasMeal ? (
                        <span
                          className={clsx(
                            'inline-flex items-center justify-center px-1.5 py-0 rounded-full text-[9.5px] font-bold leading-tight',
                            isSelected
                              ? 'bg-on-primary/25 text-on-primary'
                              : hasSharedMeal
                              ? 'bg-[#D8F3DC] text-[#1B4332]'
                              : 'bg-surface-container-high text-on-surface-variant'
                          )}
                        >
                          {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
                        </span>
                      ) : (
                        <span
                          className={clsx(
                            'w-1.5 h-1.5 rounded-full',
                            isSelected ? 'bg-on-primary/40' : 'bg-outline-variant/40'
                          )}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Day Detail Section */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-title-md text-[15px] sm:text-base font-bold text-on-surface">
                  {WEEKDAY_LABELS[selectedDay]}, {dayDate(plan.weekStartDate, selectedDay)}
                </h3>
                {selectedDay === today && (
                  <Badge tone="solid-primary" className="text-[10px] py-0.5 px-1.5">
                    Today
                  </Badge>
                )}
              </div>

              {selectedMeals.length > 0 && (
                <span className="text-xs text-on-surface-variant font-medium">
                  {selectedMeals.length} {selectedMeals.length === 1 ? 'meal planned' : 'meals planned'}
                </span>
              )}
            </div>

            {selectedMeals.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {selectedMeals.map((meal) => {
                  const recipe = recipes[meal.recipeId];
                  const cook = meal.cookedByUserId ? byId.get(meal.cookedByUserId) : undefined;
                  const isCook = meal.cookedByUserId === currentUser.id;
                  const diners = meal.participants
                    .map((p) => byId.get(p.userId))
                    .filter((u): u is User => Boolean(u));
                  const isJoined = meal.participants.some((p) => p.userId === currentUser.id);
                  const mouths = meal.participants.reduce(
                    (sum, p) => sum + 1 + (p.guests ?? 0),
                    0
                  );

                  return (
                    <div
                      key={meal.id}
                      className={clsx(
                        'flex items-start gap-3 p-3 rounded-xl border transition-all',
                        isJoined
                          ? 'bg-primary/5 border-primary/20 shadow-xs'
                          : 'bg-surface-container-low/50 border-outline-variant/30 hover:bg-surface-container-low'
                      )}
                    >
                      {/* Recipe Thumbnail */}
                      <Link
                        href={`/recipes/${meal.recipeId}`}
                        className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-surface-container-high border border-outline-variant/30 shadow-xs block group"
                      >
                        <FoodImage
                          src={recipe?.imageUrl ?? null}
                          seed={meal.recipeTitle}
                          alt={meal.recipeTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </Link>

                      {/* Meal Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-label-caps uppercase text-on-surface-variant font-bold leading-none mb-1">
                          <Icon name={MEAL_TYPE_ICONS[meal.mealType]} className="text-[13px] text-primary" />
                          <span>{MEAL_TYPE_LABELS[meal.mealType]}</span>
                          {meal.isShared ? (
                            <Badge tone="primary" className="text-[9px] py-0 px-1.5 ml-0.5">
                              Shared
                            </Badge>
                          ) : (
                            <Badge tone="neutral" className="text-[9px] py-0 px-1.5 ml-0.5">
                              Solo
                            </Badge>
                          )}
                          {isJoined && (
                            <span className="ml-auto text-primary font-bold text-[11px] flex items-center gap-0.5">
                              <Icon name="check_circle" filled className="text-[13px]" />
                              You&apos;re in
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/recipes/${meal.recipeId}`}
                          className="font-title-md text-[14px] sm:text-[15px] font-bold text-on-surface hover:text-primary hover:underline line-clamp-1 block"
                        >
                          {meal.recipeTitle}
                        </Link>

                        {/* Cook & Diners Row */}
                        <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-outline-variant/20 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            {cook ? (
                              <span className="flex items-center gap-1">
                                <Avatar user={cook} size="xs" />
                                <span>
                                  Cook: <strong>{isCook ? 'You' : cook.name}</strong>
                                </span>
                              </span>
                            ) : (
                              <span className="text-secondary font-medium flex items-center gap-1">
                                <Icon name="person" className="text-xs" />
                                No cook yet
                              </span>
                            )}
                            {recipe?.cookTimeMins ? (
                              <span className="text-on-surface-variant/70">· {recipe.cookTimeMins}m</span>
                            ) : null}
                          </div>

                          {diners.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              <AvatarStack users={diners.slice(0, 4)} size="xs" />
                              <span className="font-numeric-data text-[11px] text-on-surface-variant font-medium">
                                {mouths} {mouths === 1 ? 'diner' : 'diners'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-7 px-4 text-center rounded-xl bg-surface-container-low/40 border border-dashed border-outline-variant/40">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mb-2 text-on-surface-variant/70">
                  <Icon name="restaurant" className="text-xl" />
                </div>
                <p className="text-sm font-bold text-on-surface">
                  No meals planned for {WEEKDAY_LABELS[selectedDay]}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5 max-w-xs">
                  Give the house something to eat or plan ahead for the week.
                </p>
                <Link
                  href="/plan"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 transition-all btn-tactile"
                >
                  <Icon name="add" className="text-sm" />
                  <span>Add meal to {WEEKDAY_LABELS[selectedDay]}</span>
                </Link>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Full Week View */
        <div className="p-4 flex flex-col gap-3">
          {visibleDays.map((day) => {
            const meals = mealsByDay[day] || [];
            const isToday = day === today;

            return (
              <div
                key={day}
                className={clsx(
                  'p-3 rounded-xl border transition-all',
                  isToday
                    ? 'bg-primary/5 border-primary/25 shadow-xs'
                    : 'bg-surface-container-low/40 border-outline-variant/30'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-caps text-xs font-bold uppercase text-on-surface">
                      {WEEKDAY_LABELS[day]}
                    </span>
                    <span className="font-numeric-data text-xs text-on-surface-variant">
                      ({dayDate(plan.weekStartDate, day)})
                    </span>
                    {isToday && (
                      <Badge tone="solid-primary" className="text-[9px] py-0 px-1.5 ml-1">
                        Today
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {meals.length > 0 ? `${meals.length} ${meals.length === 1 ? 'meal' : 'meals'}` : 'No meals'}
                  </span>
                </div>

                {meals.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {meals.map((meal) => {
                      const recipe = recipes[meal.recipeId];
                      const cook = meal.cookedByUserId ? byId.get(meal.cookedByUserId) : undefined;
                      const diners = meal.participants
                        .map((p) => byId.get(p.userId))
                        .filter((u): u is User => Boolean(u));

                      return (
                        <div
                          key={meal.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-container border border-outline-variant/20">
                              <FoodImage
                                src={recipe?.imageUrl ?? null}
                                seed={meal.recipeTitle}
                                alt={meal.recipeTitle}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/recipes/${meal.recipeId}`}
                                className="text-xs sm:text-sm font-bold text-on-surface hover:text-primary hover:underline truncate block"
                              >
                                {meal.recipeTitle}
                              </Link>
                              <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                                {meal.isShared ? 'Shared' : 'Solo'} · {cook ? `Cook: ${cook.name}` : 'No cook'}
                              </span>
                            </div>
                          </div>

                          {diners.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <AvatarStack users={diners.slice(0, 3)} size="xs" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant/70 italic">Nothing planned</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Card Footer: Quick Action Link */}
      <div className="p-2.5 bg-surface-container-low/30 border-t border-surface-container-highest/60 flex items-center justify-center">
        <Link
          href="/plan"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline py-1 px-3 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <span>Open Full Weekly Plan</span>
          <Icon name="arrow_forward" className="text-sm" />
        </Link>
      </div>
    </Card>
  );
}
