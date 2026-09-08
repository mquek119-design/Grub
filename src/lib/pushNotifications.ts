/**
 * Client-side Web Push Notification Manager
 * Handles Service Worker registration, permission requests, and test notifications.
 */

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
}

export async function checkPushSupport(): Promise<PushStatus> {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'unsupported', isSubscribed: false };
  }

  const supported =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  if (!supported) {
    return { supported: false, permission: 'unsupported', isSubscribed: false };
  }

  const permission = Notification.permission;
  let isSubscribed = false;

  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      isSubscribed = Boolean(sub);
    }
  } catch {
    // Ignore error
  }

  return { supported, permission, isSubscribed };
}

/**
 * Register the Grub service worker and request user notification permission.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (err) {
      console.error('Service worker registration failed:', err);
    }
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Send a test lock-screen notification directly through the registered Service Worker.
 */
export async function sendTestNotification(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission !== 'granted') {
    const permission = await requestPushPermission();
    if (permission !== 'granted') return false;
  }

  try {
    let reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    }

    if (reg) {
      await reg.showNotification('🛒 Grub · Basket Cutoff Test', {
        body: '2 hours until this week’s Tesco basket cutoff! Add your milk, bread, and meals.',
        icon: '/icon.svg',
        badge: '/brand/grub-mark.svg',
        data: { url: '/plan' },
        vibrate: [100, 50, 100],
      } as any);
      return true;
    }
  } catch (err) {
    console.error('Failed to trigger test notification:', err);
  }

  return false;
}
