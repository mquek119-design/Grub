import { redirect } from 'next/navigation';
import { BasketView } from '@/components/basket/BasketView';
import { BuildBasketPanel } from '@/components/basket/BuildBasketPanel';
import { SlotPicker } from '@/components/basket/SlotPicker';
import { PackDataForm } from '@/components/basket/PackDataForm';
import { Notice } from '@/components/ui/Notice';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageShell } from '@/components/ui/PageShell';
import { FirstRunTip } from '@/components/ui/FirstRunTip';
import { MinimumOrderBar } from '@/components/basket/MinimumOrderBar';
import { AddItemPanel } from '@/components/basket/AddItemPanel';
import { ORDER_MINIMUMS } from '@/lib/orderMinimums';
import { basketTotal } from '@/lib/calc';
import { isTescoOrderingEnabled } from '@/lib/tescoOrdering';
import {
  getBasketItems,
  getHouse,
  getCollector,
  getCurrentUser,
  getHousemates,
  getWeeklyPlan,
} from '@/lib/queries';

import { DesktopCheckoutCard } from '@/components/basket/DesktopCheckoutCard';
import { checkTescoSession } from './tescoActions';

export const metadata = { title: 'Basket · Grub', description: 'Review the combined house basket before ordering.' };
export const dynamic = 'force-dynamic';

export default async function BasketPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const [items, housemates, collector, plan, house, tescoSession] = await Promise.all([
    getBasketItems(),
    getHousemates(),
    getCollector(),
    getWeeklyPlan(),
    getHouse(),
    checkTescoSession(),
  ]);

  const hasCookies = Boolean(tescoSession?.authenticated);
  const mealCount = plan?.meals.length ?? 0;
  const unpriced = items.filter((item) => item.needsPackData);

  // Unpriced lines cannot count toward a spend threshold — including them would
  // claim the minimum was met on the strength of items worth an unknown amount.
  const pricedTotal = basketTotal(items.filter((item) => !item.needsPackData));
  const method = plan?.slot?.method ?? house.fulfillmentMethod;
  const tescoOrderingEnabled = isTescoOrderingEnabled();

  return (
    // Extra bottom padding clears the fixed total/checkout bar on mobile.
    <PageShell wide className="pb-[200px] lg:pb-xl">
      <PageHeader
        title="The Basket"
        subtitle={
          collector
            ? `Built from this week's plan. ${collector.name} places the order.`
            : "Built from this week's plan."
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Plan Sync Banner, Items, Add Item Panel, Pack Data Forms */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-md min-w-0">
          <FirstRunTip tab="basket" />

          {/* Plan Sync & Pooling Banner right above the grocery items */}
          <BuildBasketPanel
            hasBasket={items.length > 0}
            mealCount={mealCount}
            overlapSavings={plan?.sharedSavings ?? 0}
            variant="banner"
          />

          {/* Pack size and price normally come from Tesco search. This only appears
              for the leftovers — an ingredient with no sensible product match. */}
          {unpriced.length > 0 && (
            <section className="flex flex-col gap-sm">
              <h2 className="sr-only">Items needing pack data</h2>
              <Notice
                tone="info"
                icon="search_off"
                title={`Tesco drew a blank on ${unpriced.length} thing${unpriced.length === 1 ? '' : 's'}`}
              >
                Everything else was priced automatically. These had no clear product match, so they
                need filling in once — or rename the ingredient to something closer to a product name
                and rebuild.
              </Notice>
              {unpriced.map((item) =>
                item.ingredientId ? (
                  <PackDataForm
                    key={item.id}
                    ingredientId={item.ingredientId}
                    name={item.name}
                    suggestedUnit={item.subtitle.replace(/[\d.\s]|needed|pack/gi, '') || 'g'}
                  />
                ) : null
              )}
            </section>
          )}

          {items.length === 0 ? (
            <EmptyState
              icon="ti-shopping-cart"
              title="No basket yet"
              body={
                mealCount > 0
                  ? "Your meals are planned but the basket hasn't been built yet. Let the optimiser do its thing."
                  : 'Plan some meals first. The basket is derived from what the house is cooking.'
              }
              action={mealCount === 0 ? { href: '/plan', label: 'Plan meals' } : undefined}
            />
          ) : (
            <div className="flex flex-col gap-lg">
              <AddItemPanel />
              <BasketView
                items={items}
                housemates={housemates}
                isCollector={collector?.id === currentUser.id}
                collectorName={collector?.name ?? 'The collector'}
                planId={plan?.id}
                orderingEnabled={tescoOrderingEnabled}
                hasCookies={hasCookies}
              />
            </div>
          )}
        </div>

        {/* Right Column: Sticky Integrated Order Hub */}
        <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-[84px] flex flex-col gap-md min-w-0">
          <DesktopCheckoutCard
            items={items}
            isCollector={collector?.id === currentUser.id}
            collectorName={collector?.name ?? 'The collector'}
            planId={plan?.id}
            orderingEnabled={tescoOrderingEnabled}
            hasCookies={hasCookies}
            minimumOrderBar={
              items.length > 0 ? (
                <MinimumOrderBar
                  total={pricedTotal}
                  minimum={ORDER_MINIMUMS[method]}
                  method={method}
                />
              ) : undefined
            }
            slotPicker={
              plan?.id ? (
                <SlotPicker
                  preference={house.slotPreference}
                  bookedSlot={
                    plan.slot
                      ? { startsAt: plan.slot.startsAt, charge: plan.slot.charge, method: plan.slot.method }
                      : null
                  }
                  isCollector={collector?.id === currentUser.id}
                  orderingEnabled={tescoOrderingEnabled}
                  compact
                />
              ) : undefined
            }
          />
        </aside>
      </div>
    </PageShell>
  );
}
