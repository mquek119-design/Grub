'use client';

import Link from 'next/link';
import { useState, useTransition, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { formatPence } from '@/lib/money';
import { basketTotal } from '@/lib/calc';
import type { BasketItem } from '@/lib/types';
import { checkTescoSession, syncBasketToTesco, startTescoCheckout } from '@/app/basket/tescoActions';
import { TESCO_ORDERING_UNAVAILABLE_MESSAGE } from '@/lib/tescoOrdering';

interface DesktopCheckoutCardProps {
  items: BasketItem[];
  isCollector: boolean;
  collectorName: string;
  planId?: string;
  orderingEnabled: boolean;
  hasCookies?: boolean;
}

export function DesktopCheckoutCard({
  items,
  isCollector,
  collectorName,
  planId,
  orderingEnabled,
  hasCookies: initialHasCookies = false,
}: DesktopCheckoutCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [sessionAuth, setSessionAuth] = useState(initialHasCookies);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [actualTotalCost, setActualTotalCost] = useState<number | null>(null);

  useEffect(() => {
    checkTescoSession()
      .then((res) => setSessionAuth(Boolean(res.authenticated)))
      .catch((err) => console.error('Tesco session check failed:', err));
  }, []);

  const total = basketTotal(items.filter((item) => !item.needsPackData));

  async function handleCheckoutClick() {
    if (!sessionAuth) {
      setSyncStatusMsg('Tesco session cookies required. Please import them in House Settings.');
      return;
    }
    if (!orderingEnabled) {
      setSyncStatusMsg(TESCO_ORDERING_UNAVAILABLE_MESSAGE);
      return;
    }
    if (!planId) {
      setSyncStatusMsg('No active weekly plan ID.');
      return;
    }

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

      setSyncStatusMsg('Fetching actual Tesco checkout cost...');
      const checkoutRes = await startTescoCheckout();
      if (checkoutRes.status === 'success' && checkoutRes.totalCost !== undefined) {
        setActualTotalCost(checkoutRes.totalCost);
        setSyncStatusMsg(null);
      } else {
        setSyncStatusMsg(`Synced successfully, but could not fetch checkout total: ${checkoutRes.message}`);
      }
    }
  }

  return (
    <Card className="hidden lg:flex flex-col gap-md border border-primary/30 bg-gradient-to-br from-surface-container-lowest to-surface-container-low shadow-sm">
      <div className="flex flex-col gap-xs">
        <span className="font-label-caps text-label-caps text-on-surface-variant font-semibold uppercase tracking-wider">
          {actualTotalCost !== null ? 'Tesco Actual Total' : 'Estimated Total'}
        </span>
        <span className="font-numeric-data text-headline-lg font-bold text-primary">
          {actualTotalCost !== null ? formatPence(actualTotalCost) : formatPence(total)}
        </span>
      </div>

      {/* Reminder when Tesco session cookies are not in */}
      {!sessionAuth && (
        <div className="p-sm rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-1 text-xs animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold text-on-surface">
            <Icon name="cookie" className="text-sm text-amber-700" />
            <span>Tesco cookies needed</span>
          </div>
          <p className="text-on-surface-variant text-[11px] leading-relaxed">
            Import your Tesco session cookies to enable automatic trolley syncing and checkout handoff.
          </p>
          <Link href="/settings" className="font-bold text-primary hover:underline text-[11px] mt-0.5">
            Import cookies in Settings &rarr;
          </Link>
        </div>
      )}

      {syncStatusMsg && (
        <p className="font-body-sm text-xs font-semibold text-primary flex items-center gap-xs">
          <Icon name="info" className="text-sm" />
          {syncStatusMsg}
        </p>
      )}

      <button
        type="button"
        disabled={!sessionAuth || !orderingEnabled || !isCollector || items.length === 0 || isSyncing}
        onClick={handleCheckoutClick}
        title={
          !sessionAuth
            ? 'Import Tesco session cookies in House Settings to enable checkout.'
            : !orderingEnabled
            ? TESCO_ORDERING_UNAVAILABLE_MESSAGE
            : isCollector
            ? undefined
            : `Only ${collectorName} can place this week's order from their Tesco account.`
        }
        className="w-full bg-secondary text-on-secondary-container font-title-md text-title-md py-md rounded-2xl btn-tactile shadow-md hover:shadow-lg transition-all text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!sessionAuth
          ? 'Cookies required to checkout'
          : !orderingEnabled
          ? 'Open locally to checkout'
          : isSyncing
          ? 'Syncing to Tesco...'
          : isCollector
            ? 'Proceed to Checkout'
            : `${collectorName} checks out`}
      </button>
    </Card>
  );
}
