'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  checkPushSupport,
  requestPushPermission,
  sendTestNotification,
  type PushStatus,
} from '@/lib/pushNotifications';

interface NotificationsCalendarPanelProps {
  houseId: string;
}

export function NotificationsCalendarPanel({ houseId }: NotificationsCalendarPanelProps) {
  const [calendarCopied, setCalendarCopied] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus>({
    supported: true,
    permission: 'default',
    isSubscribed: false,
  });
  const [testSent, setTestSent] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    checkPushSupport().then(setPushStatus);
  }, []);

  const icsUrl = origin ? `${origin}/api/calendar/${houseId}` : `/api/calendar/${houseId}`;
  const webcalUrl = origin
    ? origin.replace(/^https?:\/\//, 'webcal://') + `/api/calendar/${houseId}`
    : `webcal:///api/calendar/${houseId}`;
  const gcalSubscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      setCalendarCopied(true);
      setTimeout(() => setCalendarCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleEnablePush = async () => {
    setIsRequesting(true);
    try {
      await requestPushPermission();
      const updated = await checkPushSupport();
      setPushStatus(updated);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestPush = async () => {
    const success = await sendTestNotification();
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  return (
    <Card className="flex flex-col gap-lg border border-outline-variant/40 shadow-xs">
      {/* 1. Calendar Sync Section */}
      <div className="flex flex-col gap-md">
        <div className="flex items-start justify-between gap-sm flex-wrap">
          <div className="flex items-center gap-sm">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="event" className="text-[20px]" />
            </span>
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">
                Flat Calendar Sync
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Live iCal feed for Apple Calendar, Google Calendar, and Outlook.
              </p>
            </div>
          </div>
          <Badge tone="primary" className="text-[11px] font-semibold">
            Auto-Syncs
          </Badge>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Subscribing to this live feed adds this week&apos;s meals, cook duties, Tesco delivery slots,
          and weekly cutoff alerts directly to your phone&apos;s calendar, with alarms set 1 hour before dinner and cutoff.
        </p>

        <div className="flex flex-wrap items-center gap-sm pt-xs">
          <a
            href={webcalUrl}
            className="h-10 px-4 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs btn-tactile"
          >
            <Icon name="calendar_month" className="text-[16px]" />
            <span>Subscribe (Apple / Outlook)</span>
          </a>

          <a
            href={gcalSubscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-on-surface font-semibold text-xs inline-flex items-center gap-1.5 transition-colors btn-tactile"
          >
            <Icon name="open_in_new" className="text-[16px] text-primary" />
            <span>Add to Google Calendar</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="h-10 px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface-variant font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Icon name={calendarCopied ? 'check' : 'content_copy'} className="text-[15px]" />
            <span>{calendarCopied ? 'Link Copied!' : 'Copy Feed URL'}</span>
          </button>

          <a
            href={icsUrl}
            download="grub-calendar.ics"
            className="h-10 px-3 rounded-xl hover:bg-surface-container text-on-surface-variant font-medium text-xs inline-flex items-center gap-1 transition-colors"
          >
            <Icon name="download" className="text-[15px]" />
            <span>.ics file</span>
          </a>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-outline-variant/30" />

      {/* 2. Web Push Notifications Section */}
      <div className="flex flex-col gap-md">
        <div className="flex items-start justify-between gap-sm flex-wrap">
          <div className="flex items-center gap-sm">
            <span className="w-10 h-10 rounded-xl bg-secondary-fixed/40 text-secondary flex items-center justify-center shrink-0">
              <Icon name="notifications" className="text-[20px]" />
            </span>
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">
                Phone Lock-Screen Alerts
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Browser Web Push alerts on Android, iOS 16.4+ (PWA), and desktop.
              </p>
            </div>
          </div>

          <Badge
            tone={
              pushStatus.permission === 'granted'
                ? 'solid-primary'
                : pushStatus.permission === 'denied'
                ? 'neutral'
                : 'primary'
            }
            className="text-[11px] font-semibold"
          >
            {pushStatus.permission === 'granted'
              ? 'ENABLED'
              : pushStatus.permission === 'denied'
              ? 'BLOCKED IN BROWSER'
              : 'NOT ENABLED'}
          </Badge>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Receive a push notification directly on your lock screen 2 hours before the Sunday cutoff
          so you never forget to add your groceries before the order locks.
        </p>

        <div className="flex flex-wrap items-center gap-sm pt-xs">
          {pushStatus.permission !== 'granted' ? (
            <Button
              variant="secondary"
              size="md"
              icon="notifications_active"
              onClick={handleEnablePush}
              pending={isRequesting}
            >
              Enable Cutoff Alerts
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              icon="send"
              onClick={handleTestPush}
              pending={testSent}
            >
              {testSent ? 'Notification Sent!' : 'Send Test Notification'}
            </Button>
          )}

          {pushStatus.permission === 'denied' && (
            <span className="text-xs text-on-surface-variant italic">
              Notifications were blocked. Tap the lock icon in your browser address bar to allow.
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
