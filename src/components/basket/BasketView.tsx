'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { Avatar } from '@/components/avatars/Avatar';
import { FoodImage } from '@/components/media/FoodImage';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Notice';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import { basketLineTotal, basketSavings, basketTotal } from '@/lib/calc';
import type { BasketItem, IngredientCategory, User } from '@/lib/types';
import { updateBasketItemQuantity } from '@/app/basket/actions';
import { checkTescoSession, syncBasketToTesco, startTescoCheckout } from '@/app/basket/tescoActions';
import { HostedHandoffBanner } from '@/components/basket/HostedHandoffBanner';
import { BrandSwapModal } from '@/components/basket/BrandSwapModal';

// Inside BasketView:
import { TESCO_ORDERING_UNAVAILABLE_MESSAGE } from '@/lib/tescoOrdering';

/**
 * Basket review — the collector's screen before the order goes to Tesco.
 *
 * The own-brand toggle is presentational here: it reveals the swap prices the
 * optimiser already found (`originalUnitPrice`). Committing a swap will call
 * the Tesco provider through a server action, never from this component.
 */

const CATEGORY_META: Record<IngredientCategory, { label: string; icon: string; tone: string }> = {
  fresh: { label: 'Fresh', icon: 'eco', tone: 'text-primary' },
  cupboard: { label: 'Cupboard', icon: 'inventory_2', tone: 'text-secondary' },
  frozen: { label: 'Frozen', icon: 'ac_unit', tone: 'text-[#0061a4]' },
  household: { label: 'Household', icon: 'cleaning_services', tone: 'text-tertiary' },
};

const CATEGORY_ORDER: IngredientCategory[] = ['fresh', 'cupboard', 'frozen', 'household'];

interface BasketViewProps {
  items: BasketItem[];
  housemates: User[];
  /** Only the collector can place the order. */
  isCollector: boolean;
  collectorName: string;
  planId?: string;
  orderingEnabled: boolean;
  hasCookies?: boolean;
}

export function BasketView({
  items,
  housemates,
  isCollector,
  collectorName,
  planId,
  orderingEnabled,
  hasCookies: initialHasCookies = false,
}: BasketViewProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries(items.map((item) => [item.id, item.quantity]))
  );

  const [removed, setRemoved] = useState<Set<string>>(new Set());
  // Categories start open: a basket you have to unfold before you can check it
  // is a basket nobody checks. Collapsing is for after you have read a section.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [actualTotalCost, setActualTotalCost] = useState<number | null>(null);
  const [selectedSwapItem, setSelectedSwapItem] = useState<{
    id: string;
    ingredientId: string | null;
    name: string;
  } | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  // isSyncing drives the disabled states, so the transition's own pending
  // flag is not needed.
  const [, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [sessionAuth, setSessionAuth] = useState(initialHasCookies);
  const [sessionExpiry, setSessionExpiry] = useState<string | undefined>();
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    checkTescoSession()
      .then((res) => {
        setSessionAuth(Boolean(res.authenticated));
        setSessionExpiry(res.expiresAt);
      })
      .catch((err) => console.error('Tesco session check failed:', err));
  }, []);

  // Memoize housemates lookup Map to avoid recreation on every render
  const byId = useMemo(() => new Map(housemates.map((user) => [user.id, user])), [housemates]);

  const liveItems = useMemo(
    () =>
      items
        .filter((item) => !removed.has(item.id))
        .map((item) => ({
          ...item,
          quantity: quantities[item.id] ?? item.quantity,
        })),
    [items, quantities, removed]
  );

  // Unpriced lines contribute nothing to the total; the count is surfaced
  // separately so the figure is never mistaken for the finished bill.
  const total = basketTotal(liveItems.filter((item) => !item.needsPackData));
  const savings = basketSavings(liveItems);
  const unpricedCount = liveItems.filter((item) => item.needsPackData).length;
  const availableSwapValue = items
    .filter((item) => item.originalUnitPrice !== null)
    .reduce(
      (sum, item) =>
        sum + (item.originalUnitPrice! - item.unitPrice) * (quantities[item.id] ?? item.quantity),
      0
    );

  function setQuantity(id: string, next: number) {
    if (next <= 0) {
      setRemoved((prev) => new Set(prev).add(id));
    } else {
      setQuantities((prev) => ({ ...prev, [id]: next }));
    }
    startTransition(async () => {
      await updateBasketItemQuantity(id, next);
    });
  }

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: liveItems.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  /** Days until the Tesco session lapses, or null when unknown. */
  const sessionDaysLeft = (() => {
    if (!sessionExpiry) return null;
    const ms = new Date(sessionExpiry).getTime() - Date.now();
    return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : null;
  })();

  async function handleCheckoutClick() {
    if (!orderingEnabled) {
      setSyncStatusMsg(TESCO_ORDERING_UNAVAILABLE_MESSAGE);
      return;
    }

    if (!sessionAuth) {
      setSyncStatusMsg('Tesco session required. Please set up your Tesco session cookies in House Settings.');
      return;
    }
    if (!planId) {
      setSyncStatusMsg('No active weekly plan ID.');
      return;
    }

    // Open a blank tab synchronously during user click gesture to bypass popup blockers
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(
        '<p style="font-family:sans-serif;text-align:center;margin-top:20%;color:#006b3f;font-weight:bold;">Syncing your HouseGrocer basket to Tesco... Please wait.</p>'
      );
    }

    setIsSyncing(true);
    setSyncStatusMsg('Pushing items to Tesco online basket...');
    const res = await syncBasketToTesco(planId);
    setIsSyncing(false);

    if (res.status === 'error') {
      setSyncStatusMsg(`Sync error: ${res.message}`);
      if (newTab) newTab.close();
    } else {
      if (newTab) {
        newTab.location.href = 'https://www.tesco.com/groceries/en-GB/trolley';
      } else {
        window.open('https://www.tesco.com/groceries/en-GB/trolley', '_blank');
      }

      // Fetch actual checkout cost dynamically
      setSyncStatusMsg('Fetching actual Tesco checkout cost...');
      const checkoutRes = await startTescoCheckout();
      if (checkoutRes.status === 'success' && checkoutRes.totalCost !== undefined) {
        setActualTotalCost(checkoutRes.totalCost);
        setSyncStatusMsg(null); // Clear success message - keep it silent as requested
      } else {
        setSyncStatusMsg(`Synced successfully, but could not fetch checkout total: ${checkoutRes.message}`);
      }
    }
  }

  return (
    <div className="pb-[140px] flex flex-col gap-md">
      <HostedHandoffBanner
        planId={planId}
        isCollector={isCollector}
        collectorName={collectorName}
        itemCount={liveItems.length}
        hasCookies={sessionAuth}
        sessionDaysLeft={sessionDaysLeft}
      />

    {selectedSwapItem && (
      <BrandSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => {
          setIsSwapModalOpen(false);
          setSelectedSwapItem(null);
        }}
        basketItemId={selectedSwapItem.id}
        ingredientId={selectedSwapItem.ingredientId}
        itemName={selectedSwapItem.name}
      />
    )}

    {syncStatusMsg && (
      <Card
        accent={
          syncStatusMsg.toLowerCase().includes('error') || syncStatusMsg.toLowerCase().includes('required')
            ? 'error'
            : 'primary'
        }
        className="flex flex-col gap-sm"
      >
        <div className="flex items-center justify-between gap-sm">
          <p className="font-body-sm text-body-sm font-semibold">{syncStatusMsg}</p>
          <button
            type="button"
            onClick={() => setSyncStatusMsg(null)}
            className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface text-xs font-bold shrink-0 rounded focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Dismiss
          </button>
        </div>
        {syncStatusMsg.toLowerCase().includes('session') && (
          <a
            href="/settings"
            className="mt-xs inline-flex items-center justify-center gap-xs px-sm h-11 bg-primary text-on-primary rounded-lg font-semibold text-xs self-start hover:opacity-90 transition-opacity"
          >
            <Icon name="settings" className="text-sm" />
            Go to House Settings
          </a>
        )}
      </Card>
    )}

      <Card className="flex flex-col gap-md">
        <div className="flex justify-between items-start gap-md">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface">Basket Total</h2>
            <p className="font-numeric-data text-headline-lg-mobile text-primary mt-base">
              {formatPence(total)}
            </p>
            {unpricedCount > 0 && (
              <p className="font-body-sm text-body-sm text-secondary">
                Excludes {unpricedCount} unpriced item{unpricedCount === 1 ? '' : 's'}
              </p>
            )}
          </div>
          <div className="bg-primary-container text-on-primary-container rounded-lg px-sm py-xs flex flex-col items-end shrink-0">
            <span className="font-label-caps text-label-caps opacity-80">Est. Savings</span>
            <span className="font-numeric-data text-numeric-data">{formatPence(savings)}</span>
          </div>
        </div>

        {/* This used to be a "Swap to Own-Brand" switch. It was a lie: it
            flipped displayed prices in React state and wrote nothing, so the
            total moved while the basket, the split and what would actually be
            sent to Tesco all stayed exactly the same. The cheapest matching
            product is already chosen when the basket is built, so there was
            never a choice here to offer — only a fact to state. Per-item "Swap
            brand" is the real control and it does write. */}
        {availableSwapValue > 0 && (
          <>
            <div className="h-px bg-surface-container-highest w-full" />
            <p className="flex items-start gap-sm font-body-sm text-body-sm text-on-surface-variant">
              <Icon name="savings" className="text-primary mt-0.5 shrink-0 text-[18px]" />
              <span>
                Own-brand picks have already taken{' '}
                <strong className="font-numeric-data text-on-surface">
                  {formatPence(availableSwapValue)}
                </strong>{' '}
                off this shop. Swap any line back yourself if the house wants the brand.
              </span>
            </p>
          </>
        )}
      </Card>



      {grouped.map(({ category, items: categoryItems }) => {
        const meta = CATEGORY_META[category];
        const isCollapsed = collapsed.has(category);
        const sectionTotal = categoryItems
          .filter((item) => !item.needsPackData)
          .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        return (
          <section key={category} className="flex flex-col">
            <button
              type="button"
              aria-expanded={!isCollapsed}
              onClick={() =>
                setCollapsed((current) => {
                  const next = new Set(current);
                  if (next.has(category)) next.delete(category);
                  else next.add(category);
                  return next;
                })
              }
              className="w-full min-h-11 flex items-center gap-sm py-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <Icon name={meta.icon} className={meta.tone} />
              <h3 className="font-title-md text-title-md text-on-surface">{meta.label}</h3>
              <span className="font-numeric-data text-[12px] text-on-surface-variant">
                {categoryItems.length}
              </span>
              <span className="flex-1" />
              {/* The section total is why collapsing is worth having: folded up,
                  a category still tells you what it costs. */}
              <span className="font-numeric-data text-body-lg text-on-surface-variant">
                {formatPence(sectionTotal)}
              </span>
              <Icon
                name="expand_more"
                className={clsx(
                  'text-on-surface-variant transition-transform',
                  isCollapsed && '-rotate-90'
                )}
              />
            </button>

            <ul className={clsx('flex flex-col gap-sm', isCollapsed && 'hidden')}>
              {categoryItems.map((item) => {
                const original = item.originalUnitPrice;
                const swapped = original !== null && original > item.unitPrice;
                const allocatedUsers = item.allocatedTo
                  .map((allocation) => byId.get(allocation.userId))
                  .filter((user): user is User => Boolean(user));

                return (
                  <li
                    key={item.id}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md shadow-xs hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-md min-w-0 flex-1">
                      <FoodImage
                        src={item.imageUrl}
                        seed={item.tescoProductId}
                        alt={item.name}
                        icon="grocery"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl p-1.5 bg-surface-container-low border border-outline-variant/30 shrink-0 object-contain shadow-2xs"
                      />

                      <div className="flex-1 flex flex-col min-w-0 justify-center">
                        <span className="font-title-md text-title-md font-bold text-on-surface leading-tight truncate">
                          {item.name}
                        </span>

                        <div className="flex items-center gap-xs flex-wrap mt-1.5">
                          {item.quantityAssumed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                              <Icon name="help" className="text-amber-600 text-[12px]" />
                              1 pack assumed — check
                            </span>
                          )}
                          <span className="font-body-sm text-xs text-on-surface-variant font-medium">
                            {item.subtitle}
                          </span>
                          <span aria-hidden="true" className="text-on-surface-variant/40">
                            ·
                          </span>
                          {allocatedUsers.length === 0 ? (
                            <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Shared
                            </span>
                          ) : (
                            <span
                              className="flex items-center -space-x-1.5"
                              title={allocatedUsers.map((user) => user.name).join(', ')}
                            >
                              {allocatedUsers.map((user) => (
                                <Avatar
                                  key={user.id}
                                  user={user}
                                  size="xs"
                                  className="ring-2 ring-surface-container-lowest"
                                />
                              ))}
                            </span>
                          )}
                        </div>

                        {isCollector && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSwapItem({
                                id: item.id,
                                ingredientId: item.ingredientId,
                                name: item.name,
                              });
                              setIsSwapModalOpen(true);
                            }}
                            className="mt-2 text-primary hover:text-primary-container text-[11px] font-bold uppercase tracking-wider flex items-center gap-xs btn-tactile self-start"
                          >
                            <Icon name="swap_horiz" className="text-sm" />
                            Swap Brand
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-sm shrink-0 pt-sm sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
                      <div className="flex flex-col items-start sm:items-end">
                        {swapped && (
                          <span className="font-numeric-data text-xs line-through text-on-surface-variant">
                            {formatPence(original! * item.quantity)}
                          </span>
                        )}
                        {item.needsPackData ? (
                          <span className="font-label-caps text-label-caps text-secondary font-bold">
                            No price
                          </span>
                        ) : (
                          <span
                            className={clsx(
                              'font-numeric-data text-title-md font-bold',
                              swapped ? 'text-primary' : 'text-on-surface'
                            )}
                          >
                            {formatPence(basketLineTotal(item))}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center border border-outline-variant/60 rounded-full bg-surface-container-low p-1 shadow-xs">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Icon name={item.quantity === 1 ? 'delete' : 'remove'} className="text-[16px]" />
                        </button>
                        <span className="font-numeric-data text-sm font-bold w-7 text-center tabular-nums text-on-surface">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name}`}
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Icon name="add" className="text-[16px]" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* Persistent action bar — sits above the bottom nav on mobile only (lg:hidden). */}
      {!orderingEnabled && (
        <Notice tone="info" icon="computer" title="Checkout runs on the collector's desktop">
          {TESCO_ORDERING_UNAVAILABLE_MESSAGE}
        </Notice>
      )}

      {orderingEnabled && sessionAuth && sessionDaysLeft !== null && sessionDaysLeft <= 2 && (
        <div
          role="status"
          className="flex items-start gap-sm p-md rounded-lg bg-secondary-fixed/40 border border-secondary-container/40"
        >
          <Icon name="schedule" filled className="text-secondary mt-0.5 text-[18px]" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {sessionDaysLeft <= 0
              ? 'Your Tesco session expires today — re-import cookies before checking out.'
              : `Your Tesco session expires in ${sessionDaysLeft} day${sessionDaysLeft === 1 ? '' : 's'}.`}
          </p>
        </div>
      )}

      {/* Floating Checkout Bar for Mobile & Tablet Devices (< lg). Hidden on Desktop to avoid obscuring Delivery Slot picker */}
      <div className="lg:hidden fixed bottom-[76px] md:bottom-0 left-0 w-full glass-panel p-md shadow-ambient-modal z-40 transition-all border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-md px-margin-mobile">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
              {actualTotalCost !== null ? 'Tesco Actual Total' : 'Estimated Total'}
            </span>
            <span className="font-numeric-data text-headline-lg-mobile text-primary font-bold">
              {actualTotalCost !== null ? formatPence(actualTotalCost) : formatPence(total)}
            </span>
          </div>
          <button
            type="button"
            disabled={!orderingEnabled || !isCollector || liveItems.length === 0 || isSyncing}
            onClick={handleCheckoutClick}
            title={
              !orderingEnabled
                ? TESCO_ORDERING_UNAVAILABLE_MESSAGE
                : isCollector
                ? undefined
                : `Only ${collectorName} can place this week's order from their Tesco account.`
            }
            className="bg-secondary text-on-secondary-container font-title-md text-title-md px-lg py-md rounded-2xl btn-tactile shadow-md hover:shadow-lg transition-all flex-1 text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!orderingEnabled
              ? 'Open locally to checkout'
              : isSyncing
              ? 'Syncing...'
              : isCollector
                ? 'Proceed to Checkout'
                : `${collectorName} checks out`}
          </button>
        </div>
      </div>
    </div>
  );
}

