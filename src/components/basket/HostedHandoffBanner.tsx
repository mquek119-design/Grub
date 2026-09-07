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
    <Card className="flex flex-col gap-md border border-primary/20 bg-primary-container/20">
      <div className="flex items-start gap-md">
        <div className="p-sm rounded-xl bg-primary text-on-primary shrink-0">
          <Icon name="shopping_cart" className="text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-title-md text-title-md font-bold text-on-surface">
            Hosted Shopping & Checkout Handoff
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            {isCollector
              ? `You are down as the house shopper (${collectorName}). Open Tesco to place the order for these ${itemCount} items, then confirm below once paid.`
              : `Only ${collectorName} places the order on Tesco. Once confirmed, the week locks and bill splits activate.`}
          </p>
        </div>
      </div>

      {statusMsg && (
        <p className="font-body-sm text-body-sm font-semibold text-primary">{statusMsg}</p>
      )}

      <div className="flex flex-wrap items-center gap-sm pt-xs border-t border-surface-container-highest">
        <a
          href="https://www.tesco.com/groceries/en-GB/trolley"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-xs px-md py-sm rounded-xl bg-surface-container-high text-on-surface font-semibold text-xs hover:bg-surface-container-highest transition-colors"
        >
          <Icon name="open_in_new" className="text-sm" />
          Open Tesco Trolley
        </a>

        {isCollector && planId && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirmPlaced}
            className="inline-flex items-center gap-xs px-lg py-sm rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 ml-auto"
          >
            <Icon name="check_circle" className="text-sm" />
            {isPending ? 'Confirming...' : 'Confirm Order Placed & Paid'}
          </button>
        )}
      </div>
    </Card>
  );
}
