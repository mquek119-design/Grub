import { redirect } from 'next/navigation';
import { LeftoversBoard } from '@/components/leftovers/LeftoversBoard';
import { KitchenSubNav } from '@/components/kitchen/KitchenSubNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageShell } from '@/components/ui/PageShell';
import { getCurrentUser, getHousemates, getLeftovers } from '@/lib/queries';

export const metadata = { title: 'Leftovers · Grub', description: 'Claim or share spare portions and leftovers.' };
export const dynamic = 'force-dynamic';

export default async function LeftoversPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const [leftovers, housemates] = await Promise.all([getLeftovers(), getHousemates()]);

  return (
    <PageShell wide>
      <div className="flex flex-col gap-sm">
        <KitchenSubNav current="leftovers" />
        <PageHeader
          title="Fridge Leftovers"
          subtitle="Put spare portions on the fridge board before they disappear at the back of a shelf."
        />
      </div>
      <LeftoversBoard leftovers={leftovers} housemates={housemates} />
    </PageShell>
  );
}
