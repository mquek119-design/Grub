'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/avatars/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import { confirmPaymentReceived, disputePayment } from '@/app/split/actions';
import { postSplit } from '@/app/split/postActions';
import type { PlanStatus, SplitStatus, User } from '@/lib/types';

/**
 * The collector's side of the week.
 *
 * They pay Tesco and get paid back, so their Split tab has never had anything
 * on it — the old empty state told them they had nothing to pay and stopped
 * there. This is the half of the settle-up that was missing: post the week,
 * see who has said they paid, confirm it or dispute it.
 *
 * Confirming is a judgement, not a verification. The app cannot see a bank
 * account and never claims to — see CLAUDE.md, "No custody of funds".
 */

const STATUS_COPY: Record<SplitStatus, { label: string; tone: 'primary' | 'secondary' | 'neutral' }> = {
  pending: { label: 'Owes you', tone: 'neutral' },
  notified: { label: 'Says they paid', tone: 'secondary' },
  confirmed: { label: 'Settled', tone: 'primary' },
  disputed: { label: 'Disputed', tone: 'secondary' },
};

export function CollectorPanel({
  splits,
  basketIsEmpty,
  planStatus,
}: {
  splits: { user: User; amount: number; status: SplitStatus; splitId: string }[];
  basketIsEmpty: boolean;
  planStatus: PlanStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const { toast } = useToast();

  const outstanding = splits.filter((entry) => entry.status !== 'confirmed');
  const owed = outstanding.reduce((sum, entry) => sum + entry.amount, 0);

  function run(
    fn: () => Promise<{ status: string; message: string }>,
    successMessage?: string
  ) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.status === 'error') {
        setMessage({ ok: false, text: result.message });
        return;
      }

      toast(successMessage ?? result.message);
    });
  }

  return (
    <Card className="flex flex-col gap-md">
      <div className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <h2 className="font-title-md text-title-md">You&apos;re the collector</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            You pay Tesco; the house pays you back. Post the week to turn everyone&apos;s share
            into a posted split. Payments open after you check the delivery.
          </p>
        </div>
        {splits.length > 0 && (
          <div className="text-right shrink-0">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Owed to you
            </p>
            <p className="font-numeric-data text-title-md font-bold">{formatPence(owed)}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-sm flex-wrap">
        <Button
          disabled={basketIsEmpty || (planStatus !== 'ordered' && planStatus !== 'delivered')}
          pending={isPending}
          pendingLabel="Posting…"
          icon="receipt_long"
          onClick={() => run(postSplit, 'Split posted.')}
        >
          {splits.length > 0 ? 'Re-post the split' : 'Post the split'}
        </Button>

        {splits.length > 0 && (
          <Button
            variant="outline"
            icon="content_copy"
            onClick={() => {
              const lines = splits.map(
                (s) => `• ${s.user.name}: ${formatPence(s.amount)} (${s.status === 'confirmed' ? 'Settled' : s.status === 'notified' ? 'Payment sent' : 'Owes'})`
              );
              const text = `Grub Shop Split Summary:\n${lines.join('\n')}\nTotal Owed: ${formatPence(owed)}`;
              navigator.clipboard.writeText(text);
              toast('Copied split summary for WhatsApp!');
            }}
          >
            Copy WhatsApp Summary
          </Button>
        )}
      </div>

      {planStatus !== 'ordered' && planStatus !== 'delivered' && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Place the order before posting the split.
        </p>
      )}

      {basketIsEmpty && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Build the basket first — there is nothing to split yet.
        </p>
      )}

      {splits.length > 0 && (
        <ul className="flex flex-col divide-y divide-surface-container-highest">
          {splits.map((entry) => {
            const copy = STATUS_COPY[entry.status];
            return (
              <li key={entry.splitId} className="py-sm flex items-center justify-between gap-sm">
                <div className="flex items-center gap-sm min-w-0">
                  <Avatar user={entry.user} size="sm" />
                  <div className="min-w-0">
                    <p className="font-body-lg text-body-lg font-semibold truncate">
                      {entry.user.name}
                      {entry.user.room && <span className="text-on-surface-variant"> (Room {entry.user.room})</span>}
                    </p>
                    <Badge tone={copy.tone}>{copy.label.toUpperCase()}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-sm shrink-0">
                  <span
                    className={clsx(
                      'font-numeric-data text-numeric-data',
                      entry.status === 'confirmed' && 'text-on-surface-variant line-through'
                    )}
                  >
                    {formatPence(entry.amount)}
                  </span>

                  {entry.status === 'notified' && (
                    <div className="flex gap-xs">
                      <Button
                        size="sm"
                        disabled={isPending || planStatus !== 'delivered'}
                        onClick={() => run(() => confirmPaymentReceived(entry.splitId))}
                      >
                        Got it
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isPending}
                        onClick={() => run(() => disputePayment(entry.splitId))}
                      >
                        Not received
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p
          role="status"
          className={clsx(
            'font-body-sm text-body-sm font-semibold',
            message.ok ? 'text-primary' : 'text-error'
          )}
        >
          {message.text}
        </p>
      )}

      <p className="font-body-sm text-[12px] text-on-surface-variant">
        Confirming is your judgement, not a verification — the app never sees a bank account.
      </p>
    </Card>
  );
}
