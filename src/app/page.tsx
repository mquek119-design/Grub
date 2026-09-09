import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PaymentStatusList } from '@/components/feed/PaymentStatusList';
import { Icon } from '@/components/media/Icon';
import { CountdownCard } from '@/components/timers/CountdownCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageShell } from '@/components/ui/PageShell';
import { FirstRunTip } from '@/components/ui/FirstRunTip';
import { NextActionCard } from '@/components/feed/NextActionCard';
import { RunningLowStapleCard } from '@/components/feed/RunningLowStapleCard';
import { TonightDinnerCard } from '@/components/feed/TonightDinnerCard';
import { WeekPlanFeedCard } from '@/components/feed/WeekPlanFeedCard';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { nextAction } from '@/lib/nextAction';
import { isCutoffPassed } from '@/lib/weeks';
import {
  getCurrentUser,
  getHousemates,
  getLeftovers,
  getPantryItems,
  getPaymentStatus,
  getWeeklyPlan,
  getBasketItems,
  getCollector,
  getPostedSplits,
} from '@/lib/queries';
import { WEEKDAYS } from '@/lib/types';

export const dynamic = 'force-dynamic';



export default async function FeedPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const [plan, housemates, payments, pantry, leftovers, basket, collector, splits] = await Promise.all([
    getWeeklyPlan(),
    getHousemates(),
    getPaymentStatus(),
    getPantryItems(),
    getLeftovers(),
    getBasketItems(),
    getCollector(),
    getPostedSplits(),
  ]);

  if (!plan) redirect('/onboarding');

  const byId = new Map(housemates.map((user) => [user.id, user]));

  const visibleDays = WEEKDAYS.filter(
    (day) => !['sat', 'sun'].includes(day) || plan.meals.some((meal) => meal.day === day)
  );

  const today = WEEKDAYS[(new Date().getDay() + 6) % 7];
  const cookingTonight = plan.meals.filter(
    (meal) => meal.day === today && meal.cookedByUserId === currentUser.id
  );
  const mouths = (cookingTonight[0]?.participants ?? []).reduce(
    (sum, participant) => sum + 1 + (participant.guests ?? 0),
    0
  );
  const sharedMealCount = plan.meals.filter((meal) => meal.isShared).length;
  const currentUserHasInput = plan.meals.some((meal) =>
    meal.participants.some((p) => p.userId === currentUser.id)
  );
  const lowStock = pantry.filter((item) => item.isShared && item.lowStock);

  const goingOff = leftovers.filter((item) => item.daysLeft <= 1);
  const action = nextAction({
    status: plan.status,
    cutoffPassed: isCutoffPassed(plan.cutoffAt),
    mealCount: plan.meals.length,
    hasInput: currentUserHasInput,
    hasBasket: basket.length > 0,
    needsPackData: basket.some((item) => item.needsPackData),
    userId: currentUser.id,
    collector,
    splits,
  });

  const tonightMeal = plan.meals.find(
    (meal) => meal.day === today && (meal.mealType === 'dinner' || meal.isShared)
  ) ?? plan.meals.find((meal) => meal.day === today);

  return (
    <PageShell wide className="md:grid md:grid-cols-12 md:gap-lg md:items-start">
      <FirstRunTip tab="feed" />
      <div className="md:col-span-8 flex flex-col gap-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <NextActionCard action={action} />
          {plan.status === 'planning' || plan.status === 'locked' ? (
            <CountdownCard cutoffAt={plan.cutoffAt} />
          ) : (
            <Card className="flex flex-col justify-center gap-sm">
              <h2 className="font-title-md text-title-md">{plan.status === 'delivered' ? 'Delivery checked' : 'Delivery check pending'}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Keep this week’s meals handy, or start choosing next week’s.</p>
              <Link href="/plan?week=next" className="text-primary font-semibold underline">Plan next week</Link>
            </Card>
          )}
        </div>

        {tonightMeal && (
          <TonightDinnerCard
            meal={tonightMeal}
            recipe={plan.recipes.get(tonightMeal.recipeId)}
            cook={tonightMeal.cookedByUserId ? byId.get(tonightMeal.cookedByUserId) : undefined}
            currentUser={currentUser}
            housemates={housemates}
          />
        )}

        <RunningLowStapleCard />
        <InstallPrompt />

        {plan.meals.length === 0 ? (
          <EmptyState
            icon="ti-calendar"
            title="Nobody's picked anything"
            body={plan.status === 'planning' && !isCutoffPassed(plan.cutoffAt)
              ? "You're all just going to wing it again aren't you. Pick a meal and give the house something to join before everyone defaults to cereal."
              : 'Nothing was planned for this shop. Get a start on next week.'}
            action={plan.status === 'planning' && !isCutoffPassed(plan.cutoffAt)
              ? { href: '/plan', label: 'Start planning' }
              : { href: '/plan?week=next', label: 'Plan next week' }}
          />
        ) : (
          <WeekPlanFeedCard
            plan={plan}
            recipes={Object.fromEntries(plan.recipes)}
            housemates={housemates}
            currentUser={currentUser}
            today={today}
            visibleDays={visibleDays}
            sharedMealCount={sharedMealCount}
          />
        )}
      </div>

      <div className="md:col-span-4 flex flex-col gap-md mt-md md:mt-0">
        {cookingTonight.length > 0 && (
          <Card accent="secondary" className="flex items-start gap-sm interactive-card card-glow">
            <Icon name="skillet" filled className="text-secondary mt-1" />
            <div className="min-w-0">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">
                You&apos;re cooking tonight
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {cookingTonight.map((meal) => meal.recipeTitle).join(' and ')} for {mouths}
                {mouths === 1 ? ' person' : ' people'}.
              </p>
              <Link
                href={`/recipes/${cookingTonight[0].recipeId}?cook=true`}
                className="inline-flex items-center gap-xs mt-xs text-secondary font-bold text-[14px] hover:underline btn-tactile"
              >
                <Icon name="smartphone" className="text-[18px]" />
                <span>Start Cook Mode</span>
                <span className="hidden md:inline text-[11px] font-semibold bg-secondary-fixed/50 text-on-secondary-fixed px-1.5 py-0.5 rounded-full">
                  Phone
                </span>
              </Link>
            </div>
          </Card>
        )}

        {goingOff.length > 0 && (
          <Card accent="secondary" className="flex items-start gap-sm interactive-card card-glow">
            <Icon name="schedule" filled className="text-secondary mt-1" />
            <div className="min-w-0">
              <h3 className="font-numeric-data text-numeric-data text-on-surface mb-1 font-bold">
                Eat this or bin it
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {goingOff.map((item) => item.description).join(', ')}{' '}
                {goingOff.length === 1 ? 'is' : 'are'} on the board and{' '}
                {goingOff.some((item) => item.daysLeft < 0) ? 'past it' : 'about to go'}.{' '}
                <Link href="/leftovers" className="text-secondary font-semibold underline">
                  Claim it
                </Link>
                .
              </p>
            </div>
          </Card>
        )}

        {lowStock.length > 0 && (
          <Card accent="primary" className="flex items-start gap-sm interactive-card card-glow">
            <Icon name="info" filled className="text-primary mt-1" />
            <div>
              <h3 className="font-numeric-data text-numeric-data text-on-surface mb-1 font-bold">
                House Staples
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Running low on{' '}
                {lowStock.map((item, index) => (
                  <span key={item.id}>
                    <strong>{item.name}</strong>
                    {index < lowStock.length - 2 ? ', ' : index === lowStock.length - 2 ? ' and ' : ''}
                  </span>
                ))}
                .
              </p>
            </div>
          </Card>
        )}

        {payments.length === 0 ? (
          <EmptyState
            icon="ti-receipt"
            title="Clean slate"
            body="No one owes anyone anything. Enjoy it while it lasts."
          />
        ) : (
          <Card padded={false} className="overflow-hidden interactive-card card-glow">
            <PaymentStatusList entries={payments} currentUserId={currentUser.id} />
          </Card>
        )}
      </div>
    </PageShell>
  );
}
