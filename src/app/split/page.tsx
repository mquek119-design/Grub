import { redirect } from 'next/navigation';
import { Icon } from '@/components/media/Icon';
import { PayPanel } from '@/components/split/PayPanel';
import { ExpensePanel } from '@/components/split/ExpensePanel';
import { CollectorPanel } from '@/components/split/CollectorPanel';
import { Notice } from '@/components/ui/Notice';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPence } from '@/lib/money';
import { Stocky } from '@/components/mascot/Stocky';
import {
  getBasketItems,
  getCollector,
  getCurrentSplit,
  getCurrentUser,
  getExpenses,
  getHousemates,
  getPostedSplits,
  getWeeklyPlan,
} from '@/lib/queries';

interface ParsedWorking {
  itemName: string;
  brandTag: string | null;
  calculation: string | null;
}

function parseWorkingLabel(raw: string): ParsedWorking {
  // Extract calculation suffix e.g. " (1/2 of £3.20)" or " (all of £4.50)"
  const calcMatch = raw.match(/\s*\(([^)]+(?:of\s+[£\d.]+|\d+\/\d+)[^)]*)\)\s*$/i);
  const calculation = calcMatch ? calcMatch[1] : null;
  const withoutCalc = calcMatch ? raw.slice(0, calcMatch.index).trim() : raw.trim();

  // Tier / brand prefixes to separate into discrete tags
  const brandPatterns: [RegExp, string][] = [
    [/^tesco\s+finest\s+/i, 'Finest'],
    [/^finest\s+/i, 'Finest'],
    [/^tesco\s+everyday\s+value\s+/i, 'Value'],
    [/^tesco\s+value\s+/i, 'Value'],
    [/^hearty\s+food\s+co\.?\s+/i, 'Hearty Food Co'],
    [/^eastman'?s\s+/i, "Eastman's"],
    [/^stockwell\s*(&\s*co)?\.?\s+/i, 'Stockwell'],
    [/^ms\s+molly'?s\s+/i, "Ms Molly's"],
    [/^grower'?s\s+harvest\s+/i, "Grower's Harvest"],
    [/^tesco\s+/i, 'Tesco'],
  ];

  let brandTag: string | null = null;
  let itemName = withoutCalc;

  for (const [pattern, tag] of brandPatterns) {
    if (pattern.test(itemName)) {
      brandTag = tag;
      itemName = itemName.replace(pattern, '').trim();
      break;
    }
  }

  if (itemName.length > 0) {
    itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
  }

  return { itemName, brandTag, calculation };
}

export default async function SplitPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const [split, collector, plan, basket, expenses, housemates] = await Promise.all([
    getCurrentSplit(),
    getCollector(),
    getWeeklyPlan(),
    getBasketItems(),
    getExpenses(),
    getHousemates(),
  ]);

  const postedSplits = await getPostedSplits();

  // Rendered whether or not there is a weekly split: a house with no basket can
  // still have bought a kettle, and that debt is just as real.
  const purchases = (
    <ExpensePanel expenses={expenses} housemates={housemates} currentUserId={currentUser.id} />
  );

  const unpriced = basket.filter((item) => item.needsPackData).length;

  if (!split || !collector) {
    const isCollector = collector?.id === currentUser.id;

    // The collector is not a spectator here — posting the week is their job,
    // and chasing it is the rest of it.
    if (isCollector) {
      return (
        <div className="flex flex-col gap-lg">
          <CollectorPanel splits={postedSplits} basketIsEmpty={basket.length === 0} planStatus={plan?.status ?? 'planning'} />
          {purchases}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-lg">
        <EmptyState
          icon="receipt_long"
          title={isCollector ? "You're the collector this week" : 'Nothing to settle yet'}
          body={
            isCollector
              ? 'You place the order, so you have nothing to pay. Housemates see what they owe you here once the basket exists.'
              : 'Once a basket is built for this week, your share of it is worked out here — with the arithmetic shown.'
          }
          action={
            (plan?.meals.length ?? 0) === 0 ? { href: '/plan', label: 'Plan meals' } : undefined
          }
        />
        {purchases}
      </div>
    );
  }

  // What the breakdown actually adds up to. Equal to `split.amount` in the
  // ordinary case; they part company when the basket moves after posting.
  const breakdownTotal = split.lines.reduce((sum, line) => sum + line.amount, 0);
  const isCollector = collector?.id === currentUser.id;

  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-gradient-to-b from-surface-container-low via-surface-container-lowest to-surface-container-low border border-primary/25 rounded-3xl p-lg md:p-xl shadow-ambient-card flex flex-col items-center justify-center text-center relative overflow-hidden my-sm interactive-card card-glow">
        <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
          <Stocky mood="split" size="sm" caption="Itemised" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-[11px] uppercase tracking-wider font-bold mb-xs border border-primary/20 shadow-xs">
          <Icon name={!split.isPosted ? 'schedule' : plan?.status === 'delivered' ? 'verified' : 'local_shipping'} className="text-sm" />
          <span>{!split.isPosted ? 'Live Basket Estimate' : plan?.status === 'delivered' ? 'Delivery Verified' : 'Order Placed'}</span>
        </div>
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-xs font-semibold">
          Week {plan?.weekNumber ?? ''} Settlement
        </p>
        <h1 className="font-title-md md:font-headline-md text-title-md text-on-surface font-bold mb-xs">
          {!split.isPosted || plan?.status !== 'delivered' ? 'Your Estimated Share' : isCollector ? 'Total Owed to You' : 'Total You Owe'}
        </h1>
        <div className="font-numeric-data text-[56px] sm:text-[68px] leading-none font-bold text-primary mb-sm tabular-nums tracking-tight">
          {formatPence(split.amount)}
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto flex items-center justify-center gap-xs">
          <span>Collector:</span>
          <span className="font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant/40">{collector.name}</span>
        </p>
      </div>

      {!split.isPosted && (
        <Notice tone="info" icon="pending">
          This estimate updates automatically as basket items change. Payments unlock once delivery is checked.
        </Notice>
      )}

      {unpriced > 0 && (
        <Notice tone="check" icon="warning" role="alert">
          This total leaves out <strong>{unpriced}</strong> unpriced basket item{unpriced === 1 ? '' : 's'}. Add pack details on the Basket tab for accurate calculations.
        </Notice>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
        <div className="lg:col-span-7 flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h2 className="font-title-md text-title-md text-on-background">Cost Breakdown</h2>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-mono">
              <Stocky mood="split" size="sm" />
              <span>Zero guesswork</span>
            </div>
          </div>

          {split.lines.map((line) => (
            <div
              key={line.label}
              className="bg-surface-container-lowest rounded-lg border border-surface-container-highest shadow-ambient-card overflow-hidden"
            >
              <div className="flex items-center gap-md p-md border-b border-surface-container-highest">
                <span className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                  <Icon name={line.icon} />
                </span>
                <div className="flex-grow min-w-0">
                  <h3 className="font-title-md text-title-md text-on-background truncate">
                    {line.label}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {line.detail}
                  </p>
                </div>
                <span className="font-numeric-data text-numeric-data text-on-background font-bold shrink-0">
                  {formatPence(line.amount)}
                </span>
              </div>

              {/* Every row here traces to a real basket line. An opaque split is
                  the fastest way to lose trust in a shared house. */}
              <dl className="p-md flex flex-col gap-2">
                {line.workings.map((working) => {
                  const { itemName, brandTag, calculation } = parseWorkingLabel(working.label);
                  return (
                    <div
                      key={working.label}
                      className="flex items-start justify-between gap-3 text-body-sm py-1 border-b border-surface-container-highest/40 last:border-b-0"
                    >
                      <dt className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-on-surface leading-snug">
                            {itemName}
                          </span>
                          {brandTag && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold tracking-wider uppercase bg-surface-container-high text-on-surface-variant border border-outline-variant/30 shrink-0">
                              {brandTag}
                            </span>
                          )}
                        </div>
                        {calculation && (
                          <span className="text-[11.5px] text-on-surface-variant block mt-0.5">
                            {calculation}
                          </span>
                        )}
                      </dt>
                      <dd className="font-numeric-data font-semibold text-right text-on-surface shrink-0 pt-0.5">
                        {working.value}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}

          {/* The sum of the lines above, not `split.amount`. Those two are the
              same number right up until the basket moves after the split was
              posted — and then this row was quietly printing a total the
              breakdown above it did not add up to. The agreed figure keeps the
              headline; the disagreement gets said out loud below. */}
          <div className="flex items-center justify-between gap-md px-md py-sm rounded-lg bg-surface-container">
            <span className="font-title-md text-title-md">Total</span>
            <span className="font-numeric-data text-title-md font-bold">
              {formatPence(breakdownTotal)}
            </span>
          </div>

          {breakdownTotal !== split.amount && (
            <Notice tone="check" icon="difference" role="alert">
              The item breakdown has changed since this split was posted. The posted share is{' '}
              <strong>{formatPence(split.amount)}</strong>; the current breakdown comes to{' '}
              <strong>{formatPence(breakdownTotal)}</strong>. The collector can re-post the split to
              bring the two together.
            </Notice>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-md lg:sticky lg:top-[90px]">
          {isCollector ? (
            <>
              <CollectorPanel splits={postedSplits} basketIsEmpty={basket.length === 0} planStatus={plan?.status ?? 'planning'} />
              {purchases}
            </>
          ) : (
            <>
              {/* splitId is the posted row. Without one, "I've Paid" is a button
                  that updates nothing — so it is only offered once posted. */}
              <PayPanel
                deliveryChecked={plan?.status === 'delivered'}
                collectorName={collector.name}
                payment={collector.payment}
                splitId={split.isPosted ? split.id : undefined}
                isNotified={split.status === 'notified' || split.status === 'confirmed'}
                isPosted={split.isPosted}
              />
              {purchases}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
