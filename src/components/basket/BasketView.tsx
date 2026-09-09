'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { Avatar } from '@/components/avatars/Avatar';
import { FoodImage } from '@/components/media/FoodImage';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import { formatRecipeTitle } from '@/lib/recipeFormatting';
import { basketLineTotal, basketSavings, basketTotal } from '@/lib/calc';
import type { BasketItem, IngredientCategory, User } from '@/lib/types';
import { updateBasketItemQuantity } from '@/app/basket/actions';
import { checkTescoSession } from '@/app/basket/tescoActions';
import { BrandSwapModal } from '@/components/basket/BrandSwapModal';

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
  recipesByItem?: Record<string, string[]>;
}

export function BasketView({
  items,
  housemates,
  isCollector,
  collectorName,
  planId: _planId,
  orderingEnabled,
  hasCookies: initialHasCookies = false,
  recipesByItem,
}: BasketViewProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries(items.map((item) => [item.id, item.quantity]))
  );

  const [removed, setRemoved] = useState<Set<string>>(new Set());
  // Categories start open: a basket you have to unfold before you can check it
  // is a basket nobody checks. Collapsing is for after you have read a section.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedSwapItem, setSelectedSwapItem] = useState<{
    id: string;
    ingredientId: string | null;
    name: string;
  } | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const [, startTransition] = useTransition();
  const [sessionAuth, setSessionAuth] = useState(initialHasCookies);
  const [sessionExpiry, setSessionExpiry] = useState<string | undefined>();
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return liveItems;
    const q = searchQuery.toLowerCase().trim();
    return liveItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [liveItems, searchQuery]);

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
    items: filteredItems.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  /** Days until the Tesco session lapses, or null when unknown. */
  const sessionDaysLeft = (() => {
    if (!sessionExpiry) return null;
    const ms = new Date(sessionExpiry).getTime() - Date.now();
    return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : null;
  })();

  return (
    <div className="pb-[140px] flex flex-col gap-md">

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

      {/* Mobile-only basket total card — on desktop, the sticky summary panel on the right handles totals */}
      <Card className="flex flex-col gap-md lg:hidden">
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
          {savings > 0 && (
            <div className="bg-primary-container text-on-primary-container rounded-lg px-sm py-xs flex flex-col items-end shrink-0">
              <span className="font-label-caps text-label-caps opacity-80">Est. Savings</span>
              <span className="font-numeric-data text-numeric-data">{formatPence(savings)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Instant basket item search bar + inline savings badge */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm">
        <div className="relative flex-1 flex items-center">
          <Icon
            name="search"
            className="absolute left-3 text-on-surface-variant pointer-events-none text-[20px]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search basket items (e.g. eggs, chicken, pasta)..."
            aria-label="Filter basket items"
            className="w-full h-11 pl-10 pr-9 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/70 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 w-6 h-6 rounded-full bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
            >
              <Icon name="close" className="text-sm" />
            </button>
          )}
        </div>

        {availableSwapValue > 0 && (
          <div
            title="Own-brand picks have already taken this off your total. Tap 'Swap brand' on any item to switch."
            className="h-11 px-3.5 rounded-xl bg-primary/10 border border-primary/25 text-primary flex items-center gap-1.5 shrink-0 text-xs font-semibold"
          >
            <Icon name="savings" className="text-sm text-primary shrink-0" />
            <span>
              Saved <strong className="font-bold">{formatPence(availableSwapValue)}</strong> with own-brand
            </span>
          </div>
        )}
      </div>

        {searchQuery && (
          <div className="flex items-center justify-between px-xs text-xs text-on-surface-variant">
            <span>
              Found <strong>{filteredItems.length}</strong> item{filteredItems.length === 1 ? '' : 's'} matching &ldquo;{searchQuery}&rdquo;
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-primary font-semibold hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}

      {grouped.map(({ category, items: categoryItems }) => {
        const meta = CATEGORY_META[category];
        const isCollapsed = !searchQuery && collapsed.has(category);
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
              className={clsx(
                'w-full min-h-12 flex items-center gap-md px-md py-2.5 rounded-xl border transition-all text-left shadow-xs',
                'bg-surface-container-low hover:bg-surface-container border-outline-variant/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                !isCollapsed && 'mb-sm'
              )}
            >
              <span className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                <Icon name={meta.icon} className={clsx('text-base', meta.tone)} />
              </span>

              <div className="flex items-center gap-xs min-w-0">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">{meta.label}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-highest text-on-surface-variant">
                  {categoryItems.length}
                </span>
              </div>

              <span className="flex-1" />

              <div className="flex items-center gap-sm shrink-0">
                <span className="font-numeric-data text-body-md font-bold text-on-surface">
                  {formatPence(sectionTotal)}
                </span>
                <span className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-transform">
                  <Icon
                    name="expand_more"
                    className={clsx(
                      'text-lg transition-transform duration-200',
                      !isCollapsed && 'rotate-180'
                    )}
                  />
                </span>
              </div>
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
                          {item.quantityAssumed && (() => {
                            const linked = recipesByItem?.[item.id] ?? [];
                            const recipeLabel =
                              linked.length === 1
                                ? formatRecipeTitle(linked[0])
                                : linked.length === 2
                                ? `${formatRecipeTitle(linked[0])} & ${formatRecipeTitle(linked[1])}`
                                : linked.length > 2
                                ? `${formatRecipeTitle(linked[0])} +${linked.length - 1} more`
                                : null;

                            return (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[10px] font-bold max-w-full"
                                title={
                                  linked.length > 0
                                    ? `Needed for: ${linked.map(formatRecipeTitle).join(', ')}`
                                    : 'Quantity assumed as 1 pack — check amount needed'
                                }
                              >
                                <Icon name="help" className="text-amber-600 text-[12px] shrink-0" />
                                <span className="uppercase tracking-wider shrink-0">1 pack assumed</span>
                                {recipeLabel && (
                                  <span className="normal-case font-medium text-amber-900/80 truncate max-w-[160px] sm:max-w-[280px]">
                                    (for {recipeLabel})
                                  </span>
                                )}
                                <span className="uppercase tracking-wider shrink-0">— check</span>
                              </span>
                            );
                          })()}
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

      {orderingEnabled && sessionAuth && sessionDaysLeft !== null && sessionDaysLeft <= 2 && (
        <div
          role="status"
          className="hidden lg:flex items-start gap-sm p-md rounded-lg bg-secondary-fixed/40 border border-secondary-container/40"
        >
          <Icon name="schedule" filled className="text-secondary mt-0.5 text-[18px]" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {sessionDaysLeft <= 0
              ? 'Your Tesco session expires today — re-import cookies before checking out.'
              : `Your Tesco session expires in ${sessionDaysLeft} day${sessionDaysLeft === 1 ? '' : 's'}.`}
          </p>
        </div>
      )}

      {/* Floating Total Bar for Mobile & Tablet Devices (< lg). Floats above BottomNav and is hidden on Desktop */}
      <div className="lg:hidden fixed bottom-[calc(56px+env(safe-area-inset-bottom,16px))] md:bottom-0 left-0 w-full glass-panel p-md shadow-ambient-modal z-40 transition-all border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-md px-margin-mobile">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
              Estimated Total
            </span>
            <span className="font-numeric-data text-headline-lg-mobile text-primary font-bold">
              {formatPence(total)}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {liveItems.length} item{liveItems.length === 1 ? '' : 's'}{savings > 0 ? ` · Saved ${formatPence(savings)}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high text-on-surface-variant text-xs font-medium border border-outline-variant/30 text-right shrink-0">
            <Icon name="desktop_windows" className="text-base text-primary shrink-0" />
            <span>
              {isCollector ? (
                <>Ordered on desktop</>
              ) : (
                <><strong className="font-semibold text-on-surface">{collectorName}</strong> orders on desktop</>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

