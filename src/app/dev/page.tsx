import { redirect } from 'next/navigation';
import { IngredientMergePanel } from '@/components/dev/IngredientMergePanel';
import { ViewAsPanel } from '@/components/dev/ViewAsPanel';
import { WeekRunner } from '@/components/dev/WeekRunner';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageShell } from '@/components/ui/PageShell';
import { getCurrentUser, getHousemates, getRealUser, getWeeklyPlan } from '@/lib/queries';
import { findDuplicateIngredients } from '@/app/dev/ingredientActions';

export const metadata = { title: 'Testing & Development · Grub', description: 'Developer tools and simulated data.' };

export const dynamic = 'force-dynamic';

const STAGE_LABELS: Record<string, string> = {
  planning: 'Planning — the week is still being decided',
  locked: 'Locked — planning closed, order not placed',
  ordered: 'Ordered — the shop is placed and paid for',
  delivered: 'Delivered — reconcile what actually turned up',
};

/**
 * Its own page rather than a panel buried in House Settings.
 *
 * Settings is a screen four housemates share; this is a workbench for one
 * person, and half of what is on it deletes the house.
 */
export default async function DevPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const [plan, housemates, realUser, duplicateIngredients] = await Promise.all([
    getWeeklyPlan(),
    getHousemates(),
    getRealUser(),
    findDuplicateIngredients(),
  ]);
  const status = plan?.status ?? 'planning';

  const viewingAs = realUser && currentUser.id !== realUser.id ? currentUser : null;

  return (
    <PageShell wide>
      <PageHeader
        title="Testing & Development Workbench"
        subtitle="Full-lifecycle testing suite: simulate plans, orders, deliveries, and payment settlements."
      />

      {/* Lifecycle Status Banner */}
      <Card className="flex items-center justify-between gap-md border-l-4 border-l-primary bg-primary-fixed/15">
        <div className="min-w-0">
          <span className="font-label-caps text-label-caps uppercase text-primary font-bold tracking-wider">
            Active Week Status
          </span>
          <p className="font-title-md text-title-md font-bold text-on-surface mt-0.5">
            {STAGE_LABELS[status] ?? status}
          </p>
        </div>
        <Icon
          name={
            status === 'delivered'
              ? 'inventory'
              : status === 'ordered'
                ? 'local_shipping'
                : 'edit_calendar'
          }
          filled
          className="text-primary text-[32px] shrink-0"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start mt-sm">
        {/* Main Column: Lifecycle Simulation Runner */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-lg min-w-0">
          <WeekRunner status={status} />
        </div>

        {/* Side Column: Impersonation & Database Tools */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-lg lg:sticky lg:top-[90px]">
          <ViewAsPanel
            demoHousemates={housemates.filter((user) => user.isDemo)}
            viewingAs={viewingAs}
          />

          <IngredientMergePanel report={duplicateIngredients} />

          <Card className="flex items-start gap-sm">
            <Icon name="database" className="text-on-surface-variant mt-0.5 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-title-md text-title-md">Database Migrations</h3>
              <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                Migrations <span className="font-numeric-data">0012</span>–<span className="font-numeric-data">0020</span> in Supabase SQL editor enable demo housemate impersonation and non-custodial RLS bypasses.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
