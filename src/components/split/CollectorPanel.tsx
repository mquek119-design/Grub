'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/avatars/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { useToast } from '@/components/ui/Toast';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import { confirmPaymentReceived, disputePayment } from '@/app/split/actions';
import { postSplit } from '@/app/split/postActions';
import type { PlanStatus, SplitStatus, User } from '@/lib/types';

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
          <h2 className="font-title-md text-title-md font-bold text-on-surface">You&apos;re the collector</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            You pay Tesco; the house pays you back. Post the week to turn everyone&apos;s share into a posted split.
          </p>
        </div>
        {splits.length > 0 && (
          <div className="text-right shrink-0 bg-primary-container/20 p-sm rounded-xl border border-primary/20">
            <p className="font-label-caps text-label-caps uppercase text-primary font-bold">
              Owed to you
            </p>
            <p className="font-numeric-data text-headline-sm font-bold text-primary">{formatPence(owed)}</p>
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
        <div className="flex flex-col gap-sm">
          {splits.map((entry) => {
            const copy = STATUS_COPY[entry.status];
            const isNotified = entry.status === 'notified';
            const isConfirmed = entry.status === 'confirmed';

            return (
              <div
                key={entry.splitId}
                className={clsx(
                  'p-md rounded-xl border transition-all flex flex-col gap-sm',
                  isNotified
                    ? 'bg-secondary-container/20 border-secondary/40 shadow-sm'
                    : 'bg-surface-container-lowest border-surface-container-highest'
                )}
              >
                {/* Header Row: User Info + Status Badge + Amount */}
                <div className="flex items-center justify-between gap-md">
                  <div className="flex items-center gap-sm min-w-0">
                    <Avatar user={entry.user} size="sm" />
                    <div className="min-w-0">
                      <p className="font-body-lg text-body-lg font-semibold truncate text-on-surface">
                        {entry.user.name}
                      </p>
                      <div className="flex items-center gap-xs mt-0.5">
                        <Badge tone={copy.tone}>{copy.label.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-sm shrink-0">
                    <span
                      className={clsx(
                        'font-numeric-data text-title-md font-bold',
                        isConfirmed ? 'text-on-surface-variant line-through opacity-60' : 'text-on-surface'
                      )}
                    >
                      {formatPence(entry.amount)}
                    </span>
                  </div>
                </div>

                {/* Verification Bar for "Says They Paid" */}
                {isNotified && (
                  <div className="flex flex-col gap-sm pt-xs border-t border-secondary/20 mt-xs">
                    <div className="flex items-center gap-xs text-xs font-semibold text-secondary">
                      <Icon name="payments" className="text-sm" />
                      <span>{entry.user.name} marked {formatPence(entry.amount)} as paid. Check your bank app.</span>
                    </div>

                    <div className="flex items-center gap-sm">
                      <button
                        type="button"
                        disabled={isPending || planStatus !== 'delivered'}
                        onClick={() => run(() => confirmPaymentReceived(entry.splitId), `Confirmed ${entry.user.name}'s payment`)}
                        className="flex-1 inline-flex items-center justify-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Icon name="check_circle" className="text-sm" />
                        Confirm Received ({formatPence(entry.amount)})
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(() => disputePayment(entry.splitId))}
                        className="inline-flex items-center justify-center gap-xs px-md py-sm rounded-lg border border-error text-error font-semibold text-xs hover:bg-error-container/20 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Icon name="cancel" className="text-sm" />
                        Not Received
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
