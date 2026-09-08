'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { confirmOrderPlaced } from '@/app/basket/tescoActions';
import { clsx } from '@/lib/clsx';

interface HostedHandoffBannerProps {
  planId?: string;
  isCollector: boolean;
  collectorName: string;
  itemCount: number;
  hasCookies?: boolean;
  sessionDaysLeft?: number | null;
}

export function HostedHandoffBanner({
  planId,
  isCollector,
  collectorName,
  itemCount,
  hasCookies = false,
  sessionDaysLeft,
}: HostedHandoffBannerProps) {
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function handleConfirmPlaced() {
    if (!planId || !hasCookies) return;
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
        <div
          className={clsx(
            'relative p-sm rounded-xl shrink-0 shadow-sm transition-colors',
            hasCookies ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
          )}
        >
          <Icon name="shopping_cart" className="text-xl" />
          {hasCookies && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-title-md text-title-md font-bold text-on-surface">
              Hosted Shopping & Checkout Handoff
            </h3>
            {hasCookies ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider bg-primary/10 text-primary uppercase">
                Tesco Sync Ready
                {sessionDaysLeft !== null && sessionDaysLeft !== undefined && sessionDaysLeft <= 3 && (
                  <span className="ml-1 text-secondary">({sessionDaysLeft}d left)</span>
                )}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/30 uppercase">
                Cookies Needed
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
            {isCollector
              ? `You are down as the house shopper (${collectorName}). Open Tesco to place the order for these ${itemCount} items, then confirm below once paid.`
              : `Only ${collectorName} places the order on Tesco. Once confirmed, the week locks and bill splits activate.`}
          </p>
        </div>
      </div>

      {/* Reminder when cookies are not imported */}
      {!hasCookies && (
        <div className="p-sm rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-sm animate-fade-in">
          <Icon name="cookie" className="text-amber-700 text-lg mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-on-surface">Tesco session cookies required</p>
            <p className="text-on-surface-variant mt-0.5 leading-relaxed">
              Grub needs your Tesco session cookies to sync items to the trolley and complete checkout handoff.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 font-bold text-primary hover:underline mt-1.5"
            >
              Import Tesco cookies in House Settings &rarr;
            </Link>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="p-xs px-sm rounded-lg bg-primary/10 text-primary font-body-sm text-body-sm font-semibold flex items-center gap-xs">
          <Icon name="info" className="text-sm" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-sm pt-xs border-t border-outline/30">
        {hasCookies ? (
          <a
            href="https://www.tesco.com/groceries/en-GB/trolley"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-xs px-md py-sm rounded-xl bg-surface-container text-on-surface font-semibold text-xs btn-tactile hover:bg-surface-container-high border border-outline-variant/60 shadow-xs"
          >
            <Icon name="open_in_new" className="text-sm text-primary" />
            Open Tesco Trolley
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Import Tesco cookies in Settings to open trolley"
            className="inline-flex items-center gap-xs px-md py-sm rounded-xl bg-surface-container/60 text-on-surface-variant/40 font-semibold text-xs border border-outline-variant/30 cursor-not-allowed opacity-50"
          >
            <Icon name="open_in_new" className="text-sm text-on-surface-variant/30" />
            Open Tesco Trolley
          </button>
        )}

        {isCollector && planId && (
          <button
            type="button"
            disabled={!hasCookies || isPending}
            onClick={handleConfirmPlaced}
            title={!hasCookies ? 'Import Tesco cookies in Settings to confirm order' : undefined}
            className={clsx(
              'inline-flex items-center gap-xs px-lg py-sm rounded-xl font-bold text-xs btn-tactile shadow-sm ml-auto transition-all',
              hasCookies
                ? 'bg-secondary text-on-secondary-container hover:shadow-md'
                : 'bg-surface-container-highest text-on-surface-variant/40 cursor-not-allowed opacity-50 shadow-none'
            )}
          >
            <Icon name="check_circle" className="text-sm" />
            {isPending ? 'Confirming...' : 'Confirm Order Placed & Paid'}
          </button>
        )}
      </div>
    </Card>
  );
}

