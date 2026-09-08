'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { confirmOrderPlaced } from '@/app/basket/tescoActions';

interface HostedHandoffBannerProps {
  planId?: string;
  isCollector: boolean;
  collectorName: string;
  itemCount: number;
}

export function HostedHandoffBanner({
  planId,
  isCollector,
  collectorName,
  itemCount,
}: HostedHandoffBannerProps) {
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function handleConfirmPlaced() {
    if (!planId) return;
    startTransition(async () => {
      const res = await confirmOrderPlaced(planId);
      if (res.status === 'error') {
        setStatusMsg(`Error: ${res.message}`);
      } else {
        setStatusMsg(res.message);
      }
    });
  }

  return (
    <Card className="flex flex-col gap-md border border-primary/30 bg-gradient-to-br from-surface-container-lowest to-surface-container-low shadow-sm relative overflow-hidden">
      <div className="flex items-start gap-md">
        <div className="relative p-sm rounded-xl bg-primary text-on-primary shrink-0 shadow-sm">
          <Icon name="shopping_cart" className="text-xl" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-title-md text-title-md font-bold text-on-surface">
              Hosted Shopping & Checkout Handoff
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider bg-primary/10 text-primary uppercase">
              Tesco Sync Ready
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
            {isCollector
              ? `You are down as the house shopper (${collectorName}). Open Tesco to place the order for these ${itemCount} items, then confirm below once paid.`
              : `Only ${collectorName} places the order on Tesco. Once confirmed, the week locks and bill splits activate.`}
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-xs px-sm rounded-lg bg-primary/10 text-primary font-body-sm text-body-sm font-semibold flex items-center gap-xs">
          <Icon name="info" className="text-sm" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-sm pt-xs border-t border-outline/30">
        <a
          href="https://www.tesco.com/groceries/en-GB/trolley"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-xs px-md py-sm rounded-xl bg-surface-container text-on-surface font-semibold text-xs btn-tactile hover:bg-surface-container-high border border-outline-variant/60 shadow-xs"
        >
          <Icon name="open_in_new" className="text-sm text-primary" />
          Open Tesco Trolley
        </a>

        {isCollector && planId && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirmPlaced}
            className="inline-flex items-center gap-xs px-lg py-sm rounded-xl bg-secondary text-on-secondary-container font-bold text-xs btn-tactile shadow-sm hover:shadow-md disabled:opacity-50 ml-auto"
          >
            <Icon name="check_circle" className="text-sm" />
            {isPending ? 'Confirming...' : 'Confirm Order Placed & Paid'}
          </button>
        )}
      </div>
    </Card>
  );
}
