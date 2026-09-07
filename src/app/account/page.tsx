import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Avatar } from '@/components/avatars/Avatar';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/ui/PageShell';
import { Notice } from '@/components/ui/Notice';
import { formatPence } from '@/lib/money';
import {
  getCurrentUser,
  getHouse,
  getLedger,
  getRealUser,
  getSavings,
  getWeeklyPlan,
} from '@/lib/queries';
import {
  DeleteAccountPanel,
  DietaryPanel,
  LeaveHousePanel,
  LogoutButton,
  PaymentDetailsPanel,
  ProfileInfoPanel,
} from '@/components/account/AccountPanels';

export const metadata = { title: 'My Account · Grub', description: 'Manage your account and dietary preferences.' };

// Reads the signed-in user's house — nothing to prerender at build time.
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const [user, house, ledger, savings, plan] = await Promise.all([
    Promise.resolve(currentUser),
    getHouse(),
    getLedger(),
    getSavings(),
    getWeeklyPlan(),
  ]);

  const ordersJoined = new Set(ledger.map((entry) => entry.weekNumber)).size;
  const mealsPlanned =
    plan?.meals.filter((meal) => meal.participants.some((p) => p.userId === user.id)).length ?? 0;

  const realUser = await getRealUser();
  const viewingAs = realUser && realUser.id !== user.id ? user.name : null;

  return (
    <PageShell wide>
      {viewingAs && (
        <Notice tone="info" icon="visibility" title={`This is ${viewingAs}'s account`}>
          Payment details and dietary profile save against them, which is what makes paying them
          testable. Leaving and deleting are hidden — those end an account. Switch back on{' '}
          <Link href="/dev" className="underline font-semibold">
            Testing &amp; Development
          </Link>
          .
        </Notice>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Personal Settings & Household */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-lg min-w-0">
          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs">
              <Icon name="person" className="text-primary text-lg" />
              Personal Settings
            </h2>
            <ProfileInfoPanel user={user} />
            <PaymentDetailsPanel user={user} />
            <DietaryPanel user={user} />
            <Card padded={false} className="overflow-hidden hover:border-outline-variant/60 transition-colors">
              <Link
                href="/account/savings"
                className="p-md flex items-center gap-md hover:bg-surface-container-low transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                  <Icon name="trending_up" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-body-lg text-body-lg font-semibold text-on-surface">Savings History</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">See how much money pooling ingredients has saved you</p>
                </div>
                <Icon name="chevron_right" className="text-on-surface-variant" />
              </Link>
            </Card>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs">
              <Icon name="home" className="text-primary text-lg" />
              Household Details
            </h2>
            <Card className="flex flex-col gap-sm">
              <div className="flex items-center justify-between gap-md p-xs bg-surface-container-low rounded-xl">
                <span className="font-body-lg text-body-lg font-medium px-xs">House Invite Code</span>
                <code className="font-numeric-data text-headline-sm bg-surface-container-highest px-md py-xs rounded-lg tracking-wider text-primary font-bold">
                  {house.inviteCode}
                </code>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-xs text-primary font-semibold text-[14px] hover:opacity-80 mt-xs"
              >
                <Icon name="settings" className="text-[18px]" />
                Manage House Settings
              </Link>
            </Card>
          </section>
        </div>

        {/* Right Column: Profile Hero, Impact & Danger Zone */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-lg lg:sticky lg:top-[90px]">
          <Card className="flex flex-col items-center text-center gap-sm py-lg">
            <Avatar user={user} size="xl" />
            <div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">{user.name}</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {user.room ? `Room ${user.room}` : 'No room set'} · {house.name}
              </p>
            </div>
            <div className="w-full mt-xs">
              <LogoutButton />
            </div>
          </Card>

          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs">
              <Icon name="military_tech" className="text-primary text-lg" />
              My Impact
            </h2>
            <div className="grid grid-cols-3 gap-sm">
              {[
                { label: 'Orders', value: ordersJoined.toString(), icon: 'local_shipping' },
                { label: 'Meals', value: mealsPlanned.toString(), icon: 'restaurant' },
                { label: 'Saved', value: formatPence(savings.totalAllTime), icon: 'savings' },
              ].map((stat) => (
                <Card key={stat.label} className="flex flex-col items-center gap-xs text-center p-sm">
                  <Icon name={stat.icon} className="text-primary text-xl" />
                  <span className="font-numeric-data text-title-md font-bold text-on-surface">{stat.value}</span>
                  <span className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">
                    {stat.label}
                  </span>
                </Card>
              ))}
            </div>
          </section>

          {!viewingAs && (
            <section className="flex flex-col gap-sm">
              <LeaveHousePanel />
              <DeleteAccountPanel />
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
}
