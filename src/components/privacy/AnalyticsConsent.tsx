'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { Button } from '@/components/ui/Button';

const KEY = 'grub:analytics-consent:v1';
const PUBLIC_PAGES = new Set(['/welcome', '/privacy', '/terms']);

export function AnalyticsConsent() {
  const [choice, setChoice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const allowed = useRef(false);

  useEffect(() => {
    function restore() {
      let saved: string | null = null;
      try { saved = localStorage.getItem(KEY); } catch { /* Default to off. */ }
      allowed.current = saved === 'accepted';
      setChoice(saved === 'accepted' || saved === 'rejected' ? saved : null);
      setReady(true);
    }
    function handleOpenEvent() {
      setOpen(true);
    }
    restore();
    window.addEventListener('storage', restore);
    window.addEventListener('grub:open-privacy', handleOpenEvent);
    return () => {
      window.removeEventListener('storage', restore);
      window.removeEventListener('grub:open-privacy', handleOpenEvent);
    };
  }, []);

  function choose(value: 'accepted' | 'rejected') {
    allowed.current = value === 'accepted';
    setChoice(value);
    setOpen(false);
    try { localStorage.setItem(KEY, value); } catch { /* Keep this visit's choice. */ }
    // Reload on withdrawal to remove the already-loaded analytics script.
    if (value === 'rejected' && choice === 'accepted') window.location.reload();
  }

  return (
    <>
      {ready && choice === 'accepted' && (
        <Analytics debug={false} beforeSend={(event) => {
          if (!allowed.current) return null;
          const url = new URL(event.url);
          if (!PUBLIC_PAGES.has(url.pathname) || url.search || url.hash) return null;
          return event;
        }} />
      )}
      {ready && (choice === null || open) ? (
        <section aria-label="Cookie and analytics preferences" className="fixed bottom-0 inset-x-0 z-[110] border-t border-outline-variant bg-surface-0 p-md shadow-lg">
          <div className="mx-auto flex max-w-4xl flex-col gap-sm">
            <h2 className="font-semibold">Cookies and analytics</h2>
            <p className="text-sm">We use essential cookies to keep you signed in. Optional analytics helps us understand visits to our public pages. It stays off unless you accept.</p>
            <div className="flex flex-wrap items-center gap-sm">
              <Button variant="outline" onClick={() => choose('rejected')}>Reject analytics</Button>
              <Button variant="outline" onClick={() => choose('accepted')}>Accept analytics</Button>
              <Link className="p-sm underline" href="/privacy">Privacy policy</Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
