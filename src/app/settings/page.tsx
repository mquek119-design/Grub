import { redirect } from 'next/navigation';
import { PageShell } from '@/components/ui/PageShell';
import {
  getCollector,
  getCurrentUser,
  getHouse,
  getHouseStaples,
  getHousemates,
  getLedger,
  getRealUser,
  getSavings,
  getWeeklyPlan,
} from '@/lib/queries';
import { SettingsHub, type HouseSection, type SettingsTab } from '@/components/settings/SettingsHub';

export const metadata = {
  title: 'House Settings & Hub · Grub',
  description: 'Manage housemates, routines, Tesco integration, shared staples, and personal preferences.',
};

// Reads the signed-in user's house — dynamic rendering.
export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; section?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const params = searchParams ? await searchParams : {};
  const defaultTab: SettingsTab = params.tab === 'profile' ? 'profile' : 'house';
  const defaultSection: HouseSection = (params.section as HouseSection) || 'all';

  const [house, housemates, collector, staples, ledger, savings, plan, realUser] = await Promise.all([
    getHouse(),
    getHousemates(),
    getCollector(),
    getHouseStaples(),
    getLedger(),
    getSavings(),
    getWeeklyPlan(),
    getRealUser(),
  ]);

  return (
    <PageShell wide>
      <SettingsHub
        house={house}
        housemates={housemates}
        collector={collector}
        staples={staples}
        currentUser={currentUser}
        realUser={realUser}
        ledger={ledger}
        savings={savings}
        plan={plan}
        defaultTab={defaultTab}
        defaultSection={defaultSection}
      />
    </PageShell>
  );
}
