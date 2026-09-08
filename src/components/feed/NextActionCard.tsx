import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import type { NextAction } from '@/lib/nextAction';

export function NextActionCard({ action }: { action: NextAction }) {
  return (
    <Card className="flex flex-col justify-between gap-md interactive-card card-glow" accent="secondary">
      <div>
        <div className="flex items-center gap-1.5 mb-xs">
          <span className="size-2 rounded-full bg-secondary animate-pulse" />
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold tracking-wider">Next action</p>
        </div>
        <h2 className="font-title-md text-title-md text-on-surface font-bold mb-xs">{action.title}</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{action.body}</p>
      </div>
      <Link
        href={action.href}
        className="flex items-center justify-center gap-sm rounded-xl bg-secondary px-md py-2.5 text-on-secondary font-semibold hover:opacity-95 btn-tactile shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Icon name={action.icon} className="text-[18px]" />
        <span>{action.label}</span>
      </Link>
    </Card>
  );
}
