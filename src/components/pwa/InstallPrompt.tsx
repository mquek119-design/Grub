'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/media/Icon';
import { Stocky } from '@/components/mascot/Stocky';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if running standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if previously dismissed
    const wasDismissed = window.localStorage.getItem('grub:pwa-dismissed') === 'true';
    setDismissed(wasDismissed);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!mounted || isStandalone || dismissed) {
    return null;
  }

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem('grub:pwa-dismissed', 'true');
    } catch {
      // Ignore storage errors in private browsing
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsStandalone(true);
    }
    setDeferredPrompt(null);
  }

  return (
    <aside
      aria-label="Add Grub to your home screen"
      className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 shadow-ambient-card flex items-start gap-3 my-sm animate-fade-in"
    >
      <Stocky mood="smug" size="sm" className="shrink-0 pt-0.5" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-bold text-on-surface">Install Grub on your phone</p>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install tip"
            className="text-on-surface-variant hover:text-on-surface p-0.5 rounded"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>

        {isIOS ? (
          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
            Tap <strong className="text-on-surface font-semibold">Share</strong> (
            <Icon name="ios_share" className="text-[12px] inline align-middle" />) in Safari, then tap{' '}
            <strong className="text-on-surface font-semibold">&ldquo;Add to Home Screen&rdquo;</strong> for 110px of extra screen space and instant Cook Mode wake lock.
          </p>
        ) : deferredPrompt ? (
          <div className="flex flex-col gap-2 mt-1">
            <p className="text-[11px] text-on-surface-variant leading-snug">
              Get fullscreen Cook Mode and instant cutoff notifications directly from your home screen.
            </p>
            <button
              type="button"
              onClick={handleInstallClick}
              className="h-8 px-3 rounded-lg bg-primary text-on-primary text-xs font-bold w-fit flex items-center gap-1.5 shadow-xs btn-tactile"
            >
              <Icon name="download" className="text-[14px]" />
              <span>Install Grub App</span>
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
            Add Grub to your home screen for fullscreen Cook Mode and cutoff alerts.
          </p>
        )}
      </div>
    </aside>
  );
}
