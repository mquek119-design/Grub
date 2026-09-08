import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Avatar } from '@/components/avatars/Avatar';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/ui/PageShell';
import { Notice } from '@/components/ui/Notice';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import { formatDietaryBadge } from '@/lib/dietary';
import {
  getCurrentUser,
  getHouse,
  getHousemates,
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

  const [user, house, ledger, savings, plan, housemates] = await Promise.all([
    Promise.resolve(currentUser),
    getHouse(),
    getLedger(),
    getSavings(),
    getWeeklyPlan(),
    getHousemates(),
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
            <ProfileInfoPanel user={user} housemates={housemates.filter((h) => h.id !== user.id)} />
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
          <Card className="flex flex-col items-center text-center gap-md py-lg relative overflow-hidden border border-outline-variant/60 shadow-ambient-card">
            {/* Soft decorative background tint */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="relative mt-2">
              <Avatar user={user} size="xl" className="ring-4 ring-primary/20 shadow-lg" />
              {user.isAdmin && (
                <span
                  title="House Lead"
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md text-xs font-bold"
                >
                  ★
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-1 min-w-0">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                {user.name}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {house.name}
              </p>
              {user.dietaryPreferences.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-1.5 max-w-xs">
                  {user.dietaryPreferences.map((pref) => {
                    const badge = formatDietaryBadge(pref);
                    return (
                      <span
                        key={pref}
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium',
                          badge.type === 'allergy'
                            ? 'bg-error/10 text-error border border-error/20'
                            : badge.type === 'budget'
                            ? 'bg-primary/10 text-primary font-bold'
                            : badge.type === 'vibe'
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        )}
                      >
                        {badge.icon && <Icon name={badge.icon} className="text-[12px]" />}
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              )}

              <a
                href="#profile-studio"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors btn-tactile"
              >
                <Icon name="palette" className="text-sm" />
                <span>Customise Avatar &amp; Profile</span>
              </a>
            </div>

            <div className="w-full mt-xs pt-sm border-t border-surface-container-highest">
              <LogoutButton />
            </div>
          </Card>

          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
              <Icon name="military_tech" className="text-primary text-lg" />
              My Impact
            </h2>
            <div className="grid grid-cols-3 gap-sm">
              {[
                { label: 'Orders', value: ordersJoined.toString(), icon: 'local_shipping' },
                { label: 'Meals', value: mealsPlanned.toString(), icon: 'restaurant' },
                { label: 'Saved', value: formatPence(savings.totalAllTime), icon: 'savings' },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="flex flex-col items-center gap-xs text-center p-sm interactive-card hover:border-primary/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon name={stat.icon} className="text-base" />
                  </div>
                  <span className="font-numeric-data text-title-md font-bold text-on-surface">
                    {stat.value}
                  </span>
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
