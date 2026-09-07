import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import type { NextAction } from '@/lib/nextAction';

export function NextActionCard({ action }: { action: NextAction }) {
  return (
    <Card className="flex flex-col justify-between gap-md" accent="secondary">
      <div>
        <p className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-xs">Next action</p>
        <h2 className="font-title-md text-title-md text-on-surface mb-xs">{action.title}</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{action.body}</p>
      </div>
      <Link href={action.href} className="flex items-center justify-center gap-sm rounded-lg bg-secondary-container px-md py-3 text-on-secondary font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <Icon name={action.icon} />
        {action.label}
      </Link>
    </Card>
  );
}
