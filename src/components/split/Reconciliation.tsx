'use client';

import { useMemo, useState, useTransition } from 'react';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import type {
  Pence,
  ReconciliationItem,
  Substitution,
  SubstitutionDecision,
} from '@/lib/types';
import {
  addSubstitution,
  finaliseReconciliation,
  updateItemPrice,
  updateItemReceived,
  updateSubstitutionDecision,
} from '@/app/split/actions';

interface ReconciliationProps {
  items: ReconciliationItem[];
  substitutions: Substitution[];
  plannedTotal: Pence;
  isCollector: boolean;
  planId?: string;
  deliveryChecked: boolean;
}

export function Reconciliation({
  items,
  substitutions,
  plannedTotal,
  isCollector,
  planId,
  deliveryChecked,
}: ReconciliationProps) {
  const [received, setReceived] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.basketItemId, item.received]))
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((item) => [item.basketItemId, item.receivedQuantity]))
  );
  const [decisions, setDecisions] = useState<Record<string, SubstitutionDecision>>(() =>
    Object.fromEntries(substitutions.map((sub) => [sub.id, sub.decision]))
  );
  const [finalised, setFinalised] = useState(deliveryChecked);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Price & Weight adjustment modal state
  const [editingItem, setEditingItem] = useState<ReconciliationItem | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');

  // Add substitution modal state
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [subTargetItemId, setSubTargetItemId] = useState<string>('');
  const [subReceivedName, setSubReceivedName] = useState<string>('');
  const [subReceivedPriceInput, setSubReceivedPriceInput] = useState<string>('');

  function toggleItemReceived(basketItemId: string) {
    setFinalised(false);
    const nextState = !received[basketItemId];
    const qty = quantities[basketItemId] ?? 0;
    setReceived((prev) => ({ ...prev, [basketItemId]: nextState }));
    startTransition(async () => {
      const result = await updateItemReceived(basketItemId, nextState, qty);
      setError(result.status === 'error' ? result.message : null);
      if (result.status === 'error') setReceived((prev) => ({ ...prev, [basketItemId]: !nextState }));
    });
  }

  function setItemQuantity(basketItemId: string, nextQty: number) {
    setFinalised(false);
    const isRec = received[basketItemId];
    const previousQty = quantities[basketItemId];
    setQuantities((prev) => ({ ...prev, [basketItemId]: nextQty }));
    startTransition(async () => {
      const result = await updateItemReceived(basketItemId, isRec, nextQty);
      setError(result.status === 'error' ? result.message : null);
      if (result.status === 'error') setQuantities((prev) => ({ ...prev, [basketItemId]: previousQty }));
    });
  }

  function handleDecision(subId: string, decision: SubstitutionDecision) {
    setFinalised(false);
    const previousDecision = decisions[subId];
    setDecisions((prev) => ({ ...prev, [subId]: decision }));
    startTransition(async () => {
      const result = await updateSubstitutionDecision(subId, decision);
      setError(result.status === 'error' ? result.message : null);
      if (result.status === 'error') setDecisions((prev) => ({ ...prev, [subId]: previousDecision }));
    });
  }

  function handleSavePriceEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    const pounds = parseFloat(editPriceInput);
    if (isNaN(pounds) || pounds < 0) {
      setError('Please enter a valid price in pounds (e.g. 0.35)');
      return;
    }
    const newPricePence = Math.round(pounds * 100);
    setFinalised(false);
    startTransition(async () => {
      const result = await updateItemPrice(editingItem.basketItemId, newPricePence);
      if (result.status === 'error') setError(result.message);
      else {
        setEditingItem(null);
        setError(null);
      }
    });
  }

  function handleSaveNewSubstitution(e: React.FormEvent) {
    e.preventDefault();
    const targetItem = items.find((i) => i.basketItemId === subTargetItemId);
    if (!targetItem) {
      setError('Please select an ordered item to substitute.');
      return;
    }
    if (!subReceivedName.trim()) {
      setError('Please enter the replacement item name.');
      return;
    }
    const pounds = parseFloat(subReceivedPriceInput);
    if (isNaN(pounds) || pounds < 0) {
      setError('Please enter a valid replacement price in pounds.');
      return;
    }
    const replacementPricePence = Math.round(pounds * 100);

    setFinalised(false);
    startTransition(async () => {
      const result = await addSubstitution(
        targetItem.basketItemId,
        targetItem.name,
        targetItem.price,
        subReceivedName.trim(),
        replacementPricePence
      );
      if (result.status === 'error') setError(result.message);
      else {
        setIsAddSubOpen(false);
        setSubReceivedName('');
        setSubReceivedPriceInput('');
        setError(null);
      }
    });
  }

  function handleFinalise() {
    if (planId) {
      startTransition(async () => {
        setError(null);
        const result = await finaliseReconciliation(planId);
        if (result.status === 'error') setError(result.message);
        else setFinalised(true);
      });
    }
  }

  const { actualTotal, refunded, substitutionDelta, pending } = useMemo(() => {
    let actual = 0;
    let refund = 0;

    let delta = 0;
    for (const item of items) {
      const isReceived = received[item.basketItemId];
      const sub = substitutions.find((entry) => entry.basketItemId === item.basketItemId);
      const decision = sub ? decisions[sub.id] : undefined;
      const quantity = isReceived && decision !== 'rejected' ? (quantities[item.basketItemId] ?? 0) : 0;
      const price = sub && decision === 'accepted' ? sub.receivedPrice : item.price;
      actual += price * quantity;
      refund += item.price * (item.expectedQuantity - quantity);
      delta += (price - item.price) * quantity;
    }

    return {
      actualTotal: actual,
      refunded: refund,
      substitutionDelta: delta,
      pending: substitutions.filter((sub) => decisions[sub.id] === 'pending').length,
    };
  }, [items, substitutions, received, quantities, decisions]);

  const difference = actualTotal - plannedTotal;

  return (
    <fieldset disabled={!isCollector || isPending} className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start min-w-0">
      {/* Left Column: Received Items & Substitutions */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-lg min-w-0">
        <section className="flex flex-col gap-sm">
          <div className="flex items-center justify-between gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs">
              <Icon name="check_circle" className="text-primary text-lg" />
              Received Items ({items.length})
            </h2>
            <span className="text-xs text-on-surface-variant font-medium">
              Click &apos;Edit Price/Weight&apos; for weighted loose produce
            </span>
          </div>

          <Card padded={false} className="overflow-hidden border border-surface-container-highest">
            <ul className="divide-y divide-surface-container-highest">
              {items.map((item) => {
                const isReceived = received[item.basketItemId];
                const quantity = quantities[item.basketItemId] ?? 0;
                const isShort = isReceived && quantity < item.expectedQuantity;

                return (
                  <li key={item.basketItemId} className="px-md py-sm flex items-center gap-sm hover:bg-surface-container-low/30 transition-colors">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isReceived}
                      aria-label={`${item.name} received`}
                      onClick={() => toggleItemReceived(item.basketItemId)}
                      className={clsx(
                        'w-8 h-8 border-2 rounded flex items-center justify-center shrink-0 transition-colors',
                        isReceived ? 'bg-primary border-primary' : 'border-outline'
                      )}
                    >
                      <Icon
                        name="check"
                        className={clsx('text-white text-[14px]', !isReceived && 'opacity-0')}
                      />
                    </button>

                    <div className="flex-grow min-w-0 flex flex-col">
                      <p
                        className={clsx(
                          'font-body-md text-body-md truncate text-on-surface font-semibold leading-snug',
                          !isReceived && 'line-through text-on-surface-variant'
                        )}
                      >
                        {item.name}
                      </p>
                      <div className="flex items-center gap-xs text-[12px] text-on-surface-variant flex-wrap">
                        <span>Ordered {item.expectedQuantity} @ {formatPence(item.price)}</span>
                        {isShort && (
                          <span className="text-secondary font-bold"> · short delivered</span>
                        )}
                        {isCollector && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setEditPriceInput((item.price / 100).toFixed(2));
                            }}
                            className="text-primary hover:underline font-bold text-[11px] ml-xs flex items-center gap-0.5"
                          >
                            <Icon name="edit" className="text-xs" />
                            Edit Price/Weight
                          </button>
                        )}
                      </div>
                    </div>

                    {isReceived ? (
                      <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5 shrink-0">
                        <button
                          type="button"
                          aria-label={`Decrease received ${item.name}`}
                          onClick={() =>
                            setItemQuantity(
                              item.basketItemId,
                              Math.max(0, (quantities[item.basketItemId] ?? 0) - 1)
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest rounded focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Icon name="remove" className="text-[14px]" />
                        </button>
                        <span className="font-numeric-data text-numeric-data w-4 text-center tabular-nums text-sm font-bold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase received ${item.name}`}
                          onClick={() =>
                            setItemQuantity(
                              item.basketItemId,
                              (quantities[item.basketItemId] ?? 0) + 1
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary-container hover:text-on-primary-container rounded focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Icon name="add" className="text-[14px]" />
                        </button>
                      </div>
                    ) : (
                      <Badge tone="error" className="shrink-0">
                        Refunded
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>

        <section className="flex flex-col gap-sm">
          <div className="flex items-center justify-between gap-sm flex-wrap">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs">
              <Icon name="swap_horiz" className="text-secondary text-lg" />
              Substitutions
            </h2>
            <div className="flex items-center gap-xs">
              {pending > 0 && <Badge tone="secondary">{pending} to review</Badge>}
              {isCollector && (
                <Button
                  size="sm"
                  variant="outline"
                  icon="add"
                  onClick={() => {
                    if (items.length > 0) setSubTargetItemId(items[0].basketItemId);
                    setIsAddSubOpen(true);
                  }}
                >
                  Log Tesco Substitution
                </Button>
              )}
            </div>
          </div>

          {substitutions.length === 0 ? (
            <Card className="flex flex-col gap-xs bg-surface-container-low/40">
              <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                No substitutions recorded for this order yet.
              </p>
              <p className="text-xs text-on-surface-variant">
                If Tesco swapped an item or added a replacement before delivery, click <strong>&quot;Log Tesco Substitution&quot;</strong> to update who pays what.
              </p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-sm">
              {substitutions.map((sub) => {
                const decision = decisions[sub.id];
                const delta = sub.receivedPrice - sub.orderedPrice;

                return (
                  <li key={sub.id}>
                    <Card
                      accent={
                        decision === 'accepted'
                          ? 'primary'
                          : decision === 'rejected'
                            ? 'error'
                            : 'secondary'
                      }
                      className="flex flex-col gap-sm p-sm"
                    >
                      <div className="flex flex-col gap-xs">
                        <p className="font-body-sm text-xs text-on-surface-variant line-through">
                          Ordered: {sub.orderedName} · {formatPence(sub.orderedPrice)}
                        </p>
                        <div className="flex items-center gap-xs flex-wrap">
                          <span className="font-body-md text-body-md font-bold flex items-center gap-xs text-on-surface">
                            <Icon name="swap_horiz" className="text-secondary" />
                            Delivered: {sub.receivedName} · {formatPence(sub.receivedPrice)}
                          </span>
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-full text-[11px] font-bold font-numeric-data tracking-wider uppercase',
                              delta > 0 ? 'bg-error-container/60 text-error' : 'bg-primary-container/60 text-primary'
                            )}
                          >
                            {delta > 0 ? `+${formatPence(delta)} higher` : `${formatPence(delta)} saved`}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-sm mt-xs">
                        <button
                          type="button"
                          onClick={() => handleDecision(sub.id, 'accepted')}
                          className={clsx(
                            'flex-1 h-9 rounded-lg font-semibold text-xs flex items-center justify-center gap-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary',
                            decision === 'accepted'
                              ? 'bg-primary text-on-primary'
                              : 'border border-primary text-primary hover:bg-primary/10'
                          )}
                        >
                          <Icon name="check" className="text-[16px]" />
                          Accept Replacement
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(sub.id, 'rejected')}
                          className={clsx(
                            'flex-1 h-9 rounded-lg font-semibold text-xs flex items-center justify-center gap-xs transition-colors focus-visible:ring-2 focus-visible:ring-error',
                            decision === 'rejected'
                              ? 'bg-error text-on-error'
                              : 'border border-error text-error hover:bg-error-container'
                          )}
                        >
                          <Icon name="close" className="text-[16px]" />
                          Reject & Refund
                        </button>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Right Column: Corrected Total & Finalise Action */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-lg lg:sticky lg:top-[90px]">
        <Card accent="primary" className="flex flex-col gap-sm">
          <div className="flex items-start justify-between gap-md border-b border-surface-container-highest pb-md">
            <div>
              <h2 className="font-title-md text-title-md text-on-surface">Corrected Total</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Planned {formatPence(plannedTotal)} · Refunded {formatPence(refunded)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-numeric-data text-headline-lg-mobile text-primary font-bold">
                {formatPence(actualTotal)}
              </p>
              <p
                className={clsx(
                  'font-numeric-data text-[12px] font-semibold',
                  difference > 0 ? 'text-error' : difference < 0 ? 'text-primary' : 'text-on-surface-variant'
                )}
              >
                {difference === 0
                  ? 'matches plan'
                  : `${difference > 0 ? '+' : ''}${formatPence(difference)} vs plan`}
              </p>
            </div>
          </div>

          {substitutionDelta !== 0 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Substitutions account for{' '}
              <strong className="font-numeric-data text-on-surface">{formatPence(substitutionDelta)}</strong> of the
              difference.
            </p>
          )}

          <p className="font-body-sm text-[12px] text-on-surface-variant/80">
            Delivery charge is calculated separately in the split summary.
          </p>

          {error && <p role="alert" className="text-body-sm text-error bg-error-container/30 p-xs rounded-lg">{error}</p>}

          <button
            type="button"
            disabled={!isCollector || !planId || pending > 0 || finalised || isPending}
            onClick={handleFinalise}
            className="w-full h-12 bg-primary text-on-primary font-title-md text-title-md rounded-xl flex items-center justify-center gap-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-xs"
          >
            <Icon name={finalised ? 'check_circle' : 'gavel'} filled={finalised} />
            {finalised
              ? 'Split Finalised'
              : pending > 0
                ? `Review ${pending} substitution${pending === 1 ? '' : 's'} first`
                : isCollector
                  ? 'Finalise Corrected Split'
                  : 'Collector finalises the split'}
          </button>
        </Card>
      </div>

      {/* Edit Price / Weight Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-md">
          <div className="bg-surface-0 border border-surface-container-highest rounded-2xl p-md max-w-md w-full shadow-xl flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Adjust Price / Weight
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <Icon name="close" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Adjust the actual delivered unit price for <strong>{editingItem.name}</strong> (e.g. for loose onions or weighted produce).
            </p>

            <form onSubmit={handleSavePriceEdit} className="flex flex-col gap-md">
              <label className="flex flex-col gap-xs text-xs font-semibold text-on-surface">
                Actual Unit Price (£)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="px-md h-11 border border-outline rounded-lg text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                  placeholder="0.35"
                  required
                />
              </label>

              <div className="flex justify-end gap-sm">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Price</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Substitution Modal */}
      {isAddSubOpen && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-md">
          <div className="bg-surface-0 border border-surface-container-highest rounded-2xl p-md max-w-md w-full shadow-xl flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-xs">
                <Icon name="swap_horiz" className="text-secondary" />
                Log Tesco Substitution
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSubOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <Icon name="close" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Record a replacement item Tesco sent for an ordered line item.
            </p>

            <form onSubmit={handleSaveNewSubstitution} className="flex flex-col gap-md">
              <label className="flex flex-col gap-xs text-xs font-semibold text-on-surface">
                Ordered Item
                <select
                  value={subTargetItemId}
                  onChange={(e) => setSubTargetItemId(e.target.value)}
                  className="px-md h-11 border border-outline rounded-lg text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                  required
                >
                  {items.map((item) => (
                    <option key={item.basketItemId} value={item.basketItemId}>
                      {item.name} ({formatPence(item.price)})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-xs text-xs font-semibold text-on-surface">
                Tesco Delivered Replacement Name
                <input
                  type="text"
                  value={subReceivedName}
                  onChange={(e) => setSubReceivedName(e.target.value)}
                  className="px-md h-11 border border-outline rounded-lg text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Tesco Shallots 300g"
                  required
                />
              </label>

              <label className="flex flex-col gap-xs text-xs font-semibold text-on-surface">
                Replacement Price (£)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={subReceivedPriceInput}
                  onChange={(e) => setSubReceivedPriceInput(e.target.value)}
                  className="px-md h-11 border border-outline rounded-lg text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 1.20"
                  required
                />
              </label>

              <div className="flex justify-end gap-sm">
                <Button type="button" variant="outline" onClick={() => setIsAddSubOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Log Substitution</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </fieldset>
  );
}
