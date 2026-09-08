'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface RealtimeListenerProps {
  houseId: string | null;
}

export function RealtimeListener({ houseId }: RealtimeListenerProps) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (!houseId) return;

    const supabase = createClient();

    function triggerRefresh(minIntervalMs = 300) {
      const now = Date.now();
      if (timerRef.current) clearTimeout(timerRef.current);

      // Avoid spamming if invoked repeatedly within minIntervalMs
      if (now - lastRefreshRef.current < minIntervalMs) {
        timerRef.current = setTimeout(() => {
          lastRefreshRef.current = Date.now();
          router.refresh();
        }, minIntervalMs);
        return;
      }

      timerRef.current = setTimeout(() => {
        lastRefreshRef.current = Date.now();
        router.refresh();
      }, 300);
    }

    // Auto-refresh when user switches back to the tab or mobile app
    function onVisibilityOrFocus() {
      if (document.visibilityState === 'visible') {
        // Debounce returning to app so it refreshes once per 5 seconds minimum
        triggerRefresh(5000);
      }
    }

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    const channel = supabase
      .channel(`house-realtime-${houseId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'basket_items' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'splits' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weekly_plans' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'planned_meals' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pantry_items' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_participants' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_shares' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leftovers' },
        () => triggerRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'houses', filter: `id=eq.${houseId}` },
        () => triggerRefresh()
      )
      .subscribe();

    return () => {
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [houseId, router]);

  return null;
}
