import { redirect } from 'next/navigation';
import { KitchenPanel } from '@/components/plan/KitchenPanel';
import { OverlapHints } from '@/components/plan/OverlapHints';
import { WeekPlan } from '@/components/plan/WeekPlan';
import { WeekSwitcher } from '@/components/plan/WeekSwitcher';
import { ReopenPlanningBanner } from '@/components/plan/ReopenPlanningBanner';
import { FirstMealModal } from '@/components/plan/FirstMealModal';
import { Icon } from '@/components/media/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageShell } from '@/components/ui/PageShell';
import { FirstRunTip } from '@/components/ui/FirstRunTip';
import { formatPence } from '@/lib/money';
import {
  getCurrentUser,
  getHousemates,
  getRecipes,
  getWeeklyPlan,
  getWeeklyPlanFor,
} from '@/lib/queries';
import { nextWeekStart, parseWeekChoice } from '@/lib/weeks';

import { PlanActionsMenu } from '@/components/plan/PlanActionsMenu';

export const metadata = { title: 'Plan · Grub', description: 'Plan this week\'s meals and choose what to cook together.' };

export const dynamic = 'force-dynamic';

export default async function PlanPage({
  searchParams,
}: {
  searchParams?: Promise<{ week?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const resolvedParams = searchParams ? await searchParams : {};
  const week = parseWeekChoice(resolvedParams.week);

  const [thisWeek, nextWeek, recipes, housemates] = await Promise.all([
    getWeeklyPlan(),
    getWeeklyPlanFor(nextWeekStart()),
    getRecipes(),
    getHousemates(),
  ]);
  if (!thisWeek) redirect('/onboarding');

  const plan = week === 'next' ? (nextWeek ?? thisWeek) : thisWeek;

  const cutoff = new Date(thisWeek.cutoffAt).toLocaleString('en-GB', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });

  const thisWeekLocked = thisWeek.status === 'ordered' || thisWeek.status === 'delivered';
  const showKitchen = week === 'this' && thisWeekLocked;

  const switcher = (
    <WeekSwitcher
      week={week}
      thisWeekLocked={thisWeekLocked}
      nextWeekMealCount={nextWeek?.meals.length ?? 0}
    />
  );

  if (showKitchen) {
    return (
      <PageShell wide>
        <PageHeader
          title="Your Week"
          subtitle="Shop's in. This is what you're working with."
          action={<PlanActionsMenu plan={thisWeek} />}
        />
        <FirstRunTip tab="plan" />
        {switcher}
        <ReopenPlanningBanner status={thisWeek.status} />
        <KitchenPanel plan={thisWeek} recipes={recipes} currentUser={currentUser} housemates={housemates} />
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <PageHeader
        title="Your Week"
        subtitle={
          week === 'next'
            ? "Nothing here is bought yet. Get ahead while this week cooks itself."
            : `Say what you fancy before ${cutoff}. After that it's whatever everyone else wanted.`
        }
        action={<PlanActionsMenu plan={plan} />}
      />

      <FirstRunTip tab="plan" />

      {switcher}

      {week === 'this' && <ReopenPlanningBanner status={thisWeek.status} />}

      {week === 'this' && plan.sharedSavings > 0 && (
        <div className="flex items-center justify-between gap-md px-lg py-md rounded-2xl bg-gradient-to-r from-primary via-primary-container to-primary text-on-primary shadow-md border border-primary-fixed/30 interactive-card">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-xl bg-on-primary/10 flex items-center justify-center shrink-0">
              <Icon name="savings" filled className="text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-[11px] uppercase tracking-widest opacity-90 font-semibold">
                Overlap Optimiser Active
              </span>
              <span className="font-title-md text-body-lg font-bold">
                House Shared Savings
              </span>
            </div>
          </div>
          <span className="font-numeric-data text-headline-lg-mobile font-bold text-secondary">
            {formatPence(plan.sharedSavings)}
          </span>
        </div>
      )}

      {week === 'next' && (
        <Notice tone="info" icon="event_upcoming">
          The basket is only ever built from the week the house is actually eating, so nothing here
          is costed or ordered yet. This becomes the current week on Monday and the shop follows
          from it.
        </Notice>
      )}

      {recipes.length === 0 ? (
        <>
          <EmptyState
            icon="ti-soup"
            title="No recipes, no plan"
            body="The week is built out of the recipe book, and the book is empty. Write one out or paste a link — it takes a minute and then it's there forever."
            action={{ href: '/recipes/new', label: 'Add a recipe' }}
          />
        </>
      ) : (
        <>
          {week === 'this' && plan.meals.length === 0 && (
            <FirstMealModal recipes={recipes} weekStartDate={plan.weekStartDate} />
          )}
          <WeekPlan plan={plan} housemates={housemates} currentUser={currentUser} week={week} />
          <OverlapHints
            overlaps={plan.overlaps}
            currentUserId={currentUser.id}
            planMeals={plan.meals}
            week={week}
          />
        </>
      )}
    </PageShell>
  );
}
