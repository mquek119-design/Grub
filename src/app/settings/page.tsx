import { redirect } from 'next/navigation';
import { Avatar } from '@/components/avatars/Avatar';
import { InviteLink } from '@/components/settings/InviteLink';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/ui/PageShell';
import { getCollector, getCurrentUser, getHouse, getHouseStaples, getHousemates } from '@/lib/queries';
import { FulfillmentSettingsPanel } from '@/components/settings/FulfillmentSettingsPanel';
import { TescoSessionPanel } from '@/components/settings/TescoSessionPanel';
import { SlotPreferencePanel } from '@/components/settings/SlotPreferencePanel';
import { RoutinePanel } from '@/components/settings/RoutinePanel';
import { StaplesPanel } from '@/components/settings/StaplesPanel';
import { SharedStaplesToggle } from '@/components/settings/SharedStaplesToggle';
import { NotificationsCalendarPanel } from '@/components/settings/NotificationsCalendarPanel';
import { ManagePrivacyButton } from '@/components/privacy/ManagePrivacyButton';

export const metadata = { title: 'House Settings · Grub', description: 'Manage housemates, shared staples, and the weekly rotation.' };

// Reads the signed-in user's house — nothing to prerender at build time.
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser.houseId) redirect('/onboarding');

  const [house, housemates, collector, staples] = await Promise.all([
    getHouse(),
    getHousemates(),
    getCollector(),
    getHouseStaples(),
  ]);

  return (
    <PageShell wide>
      {/* House Identity & Overview Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-low border border-outline-variant/50 p-lg md:p-xl shadow-ambient-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg relative z-10">
          <div className="flex flex-col gap-sm">
            <div className="flex items-center gap-xs">
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-[11px] font-bold uppercase tracking-wider">
                House Control Center
              </span>
              <span className="text-on-surface-variant text-xs">•</span>
              <span className="text-on-surface-variant font-body-sm text-xs">
                {housemates.length} member{housemates.length === 1 ? '' : 's'}
              </span>
            </div>
            <h1 className="font-georgia text-headline-lg font-bold text-on-surface tracking-tight">
              {house.name}
            </h1>
            <div className="flex flex-wrap items-center gap-sm mt-1">
              <div className="flex items-center gap-xs text-xs font-medium text-on-surface-variant bg-surface-container-highest/60 px-3 py-1.5 rounded-full">
                <Icon name={house.fulfillmentMethod === 'delivery' ? 'local_shipping' : 'storefront'} className="text-primary text-[16px]" />
                <span className="capitalize">{house.fulfillmentMethod === 'delivery' ? 'Home Delivery' : 'Click & Collect'}</span>
              </div>
              <div className="flex items-center gap-xs text-xs font-medium text-on-surface-variant bg-surface-container-highest/60 px-3 py-1.5 rounded-full">
                <Icon name="event" className="text-primary text-[16px]" />
                <span>Cutoff: <strong className="text-on-surface capitalize">{house.cutoffDay}</strong></span>
              </div>
              {collector && (
                <div className="flex items-center gap-xs text-xs font-medium text-on-surface-variant bg-surface-container-highest/60 px-3 py-1.5 rounded-full">
                  <Icon name="shopping_cart_checkout" className="text-primary text-[16px]" />
                  <span>Collector: <strong className="text-on-surface">{collector.name}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-sm shrink-0">
            <span className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">
              Share House Invite Code
            </span>
            <InviteLink inviteCode={house.inviteCode} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Tesco & House Routines */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-lg min-w-0">
          <section className="flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                <Icon name="key" className="text-primary text-lg" />
                Tesco Session &amp; Credentials
              </h2>
            </div>
            <TescoSessionPanel />
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
              <Icon name="local_shipping" className="text-primary text-lg" />
              Fulfillment &amp; Slot Preferences
            </h2>
            <div className="grid grid-cols-1 gap-md">
              <FulfillmentSettingsPanel house={house} />
              <SlotPreferencePanel house={house} />
            </div>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
              <Icon name="event" className="text-primary text-lg" />
              Calendar Sync &amp; Alerts
            </h2>
            <NotificationsCalendarPanel houseId={house.id} />
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
              <Icon name="event_repeat" className="text-primary text-lg" />
              Weekly Rotation &amp; Routine
            </h2>
            <RoutinePanel house={house} housemates={housemates} collectorId={collector?.id ?? null} />
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
              <Icon name="shopping_basket" className="text-primary text-lg" />
              Shared Household Staples
            </h2>
            <Card className="flex flex-col gap-md">
              <SharedStaplesToggle enabled={house.sharedStaplesEnabled} />
              <div className="border-t border-surface-container-highest pt-md">
                <StaplesPanel staples={staples} splitEqually={house.sharedStaplesEnabled} />
              </div>
            </Card>
          </section>

          <section className="pt-sm pb-md">
            <ManagePrivacyButton />
          </section>
        </div>

        {/* Right Column: Members & Invite Link */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-lg lg:sticky lg:top-[90px]">
          <section className="flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                <Icon name="group" className="text-primary text-lg" />
                Housemates
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {housemates.length} Total
              </span>
            </div>
            <Card padded={false} className="overflow-hidden border border-outline-variant/60 shadow-xs">
              <ul className="divide-y divide-surface-container-highest">
                {housemates.map((user) => (
                  <li key={user.id} className="p-md flex items-center gap-md hover:bg-surface-container-low/60 transition-colors">
                    <Avatar user={user} size="md" />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-body-lg text-body-lg font-semibold truncate text-on-surface">{user.name}</p>
                        {user.id === currentUser.id && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-primary-container/40 text-primary">
                            You
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {user.room ? `Room ${user.room}` : 'No room assigned'}
                        {user.dietaryPreferences.length > 0 &&
                          ` · ${user.dietaryPreferences.join(', ')}`}
                      </p>
                    </div>
                    <div className="flex gap-xs shrink-0">
                      {user.id === collector?.id && <Badge tone="solid-primary">Collector</Badge>}
                      {user.isAdmin && <Badge tone="primary">Admin</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
              <Icon name="person_add" className="text-primary text-lg" />
              Invite to House
            </h2>
            <Card className="flex flex-col gap-sm border border-outline-variant/60 shadow-xs">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Give this link or code to new housemates. Anyone who joins can choose meals, split costs, and access the shared pantry.
              </p>
              <InviteLink inviteCode={house.inviteCode} />
            </Card>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
