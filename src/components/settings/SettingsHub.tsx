'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/avatars/Avatar';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Notice';
import { clsx } from '@/lib/clsx';
import { formatPence } from '@/lib/money';
import { formatDietaryBadge } from '@/lib/dietary';
import { WEEKDAY_LABELS } from '@/lib/types';
import type { House, HouseStaple, LedgerEntry, Savings, User, WeeklyPlan } from '@/lib/types';

import { InviteLink } from '@/components/settings/InviteLink';
import { TescoSessionPanel } from '@/components/settings/TescoSessionPanel';
import { FulfillmentSettingsPanel } from '@/components/settings/FulfillmentSettingsPanel';
import { SlotPreferencePanel } from '@/components/settings/SlotPreferencePanel';
import { RoutinePanel } from '@/components/settings/RoutinePanel';
import { StaplesPanel } from '@/components/settings/StaplesPanel';
import { SharedStaplesToggle } from '@/components/settings/SharedStaplesToggle';
import { NotificationsCalendarPanel } from '@/components/settings/NotificationsCalendarPanel';
import { ManagePrivacyButton } from '@/components/privacy/ManagePrivacyButton';

import {
  ProfileInfoPanel,
  PaymentDetailsPanel,
  DietaryPanel,
  LeaveHousePanel,
  DeleteAccountPanel,
  LogoutButton,
} from '@/components/account/AccountPanels';

export type SettingsTab = 'house' | 'profile';
export type HouseSection = 'all' | 'members' | 'routine' | 'ordering' | 'staples' | 'calendar';

export interface SettingsHubProps {
  house: House;
  housemates: User[];
  collector: User | null;
  staples: HouseStaple[];
  currentUser: User;
  realUser?: User | null;
  ledger: LedgerEntry[];
  savings: Savings;
  plan: WeeklyPlan | null;
  defaultTab?: SettingsTab;
  defaultSection?: HouseSection;
}

export function SettingsHub({
  house,
  housemates,
  collector,
  staples,
  currentUser,
  realUser,
  ledger,
  savings,
  plan,
  defaultTab = 'house',
  defaultSection = 'all',
}: SettingsHubProps) {
  const [tab, setTab] = useState<SettingsTab>(defaultTab);
  const [section, setSection] = useState<HouseSection>(defaultSection);
  const [copiedCode, setCopiedCode] = useState(false);

  // Derived user stats for profile impact
  const ordersJoined = new Set(ledger.map((entry) => entry.weekNumber)).size;
  const mealsPlanned =
    plan?.meals.filter((meal) => meal.participants.some((p) => p.userId === currentUser.id)).length ?? 0;
  const viewingAs = realUser && realUser.id !== currentUser.id ? currentUser.name : null;

  function switchTab(newTab: SettingsTab) {
    setTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  }

  function switchSection(newSection: HouseSection) {
    setSection(newSection);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newSection === 'all') {
        url.searchParams.delete('section');
      } else {
        url.searchParams.set('section', newSection);
      }
      window.history.replaceState({}, '', url.toString());
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(house.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // clipboard permission denied
    }
  }

  const SUB_SECTIONS: { id: HouseSection; label: string; icon: string; count?: number }[] = [
    { id: 'all', label: 'All Sections', icon: 'grid_view' },
    { id: 'members', label: 'Members & Invites', icon: 'group', count: housemates.length },
    { id: 'routine', label: 'Routine & Rotation', icon: 'event_repeat' },
    { id: 'ordering', label: 'Ordering & Tesco', icon: 'shopping_cart' },
    { id: 'staples', label: 'Shared Staples', icon: 'shopping_basket', count: staples.length },
    { id: 'calendar', label: 'Calendar & Alerts', icon: 'event' },
  ];

  return (
    <div className="flex flex-col gap-lg">
      {/* Top Segmented Hub Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-surface-container-highest pb-sm">
        <div className="flex items-center gap-xs p-1 bg-surface-container-low rounded-2xl border border-outline-variant/40 w-full sm:w-auto shadow-xs">
          <button
            type="button"
            onClick={() => switchTab('house')}
            className={clsx(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-body-md text-body-md font-bold transition-all btn-tactile',
              tab === 'house'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            )}
          >
            <Icon name="home" className="text-[18px]" />
            <span>House Settings</span>
            <span
              className={clsx(
                'text-[11px] px-2 py-0.5 rounded-full font-numeric-data font-bold',
                tab === 'house'
                  ? 'bg-white/20 text-on-primary'
                  : 'bg-surface-container-highest text-on-surface-variant'
              )}
            >
              {housemates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('profile')}
            className={clsx(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-body-md text-body-md font-bold transition-all btn-tactile',
              tab === 'profile'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            )}
          >
            <Icon name="person" className="text-[18px]" />
            <span>Your Profile</span>
            <Avatar user={currentUser} size="xs" ring="none" />
          </button>
        </div>

        <div className="text-xs text-on-surface-variant font-medium flex items-center gap-xs">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Managing {tab === 'house' ? house.name : currentUser.name}</span>
        </div>
      </div>

      {/* TAB 1: HOUSE SETTINGS */}
      {tab === 'house' && (
        <div className="flex flex-col gap-lg">
          {/* House Control Center Hero Banner */}
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
                    <Icon
                      name={house.fulfillmentMethod === 'delivery' ? 'local_shipping' : 'storefront'}
                      className="text-primary text-[16px]"
                    />
                    <span className="capitalize">
                      {house.fulfillmentMethod === 'delivery' ? 'Home Delivery' : 'Click & Collect'}
                    </span>
                  </div>
                  <div className="flex items-center gap-xs text-xs font-medium text-on-surface-variant bg-surface-container-highest/60 px-3 py-1.5 rounded-full">
                    <Icon name="event" className="text-primary text-[16px]" />
                    <span>
                      Cutoff: <strong className="text-on-surface capitalize">{WEEKDAY_LABELS[house.cutoffDay] || house.cutoffDay}</strong>
                    </span>
                  </div>
                  {collector && (
                    <div className="flex items-center gap-xs text-xs font-medium text-on-surface-variant bg-surface-container-highest/60 px-3 py-1.5 rounded-full">
                      <Icon name="shopping_cart_checkout" className="text-primary text-[16px]" />
                      <span>
                        Collector: <strong className="text-on-surface">{collector.name}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Single tactile invite code action chip in Hero */}
              <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider">
                  House Invite Code
                </span>
                <div className="flex items-center gap-xs bg-surface-container-highest/80 border border-outline-variant/50 p-1.5 rounded-2xl shadow-xs">
                  <code className="font-numeric-data text-title-md font-bold px-3 py-1 text-primary tracking-wider">
                    {house.inviteCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center gap-1 hover:opacity-90 transition-all btn-tactile"
                    title="Copy house invite code"
                  >
                    <Icon name={copiedCode ? 'check' : 'content_copy'} className="text-[14px]" />
                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Subcategory Navigation Pills */}
          <div className="sticky top-[64px] z-20 py-2.5 bg-surface/90 backdrop-blur-md border-y border-outline-variant/30 -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex items-center gap-xs overflow-x-auto hide-scrollbar">
              {SUB_SECTIONS.map((sec) => {
                const isActive = section === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => switchSection(sec.id)}
                    className={clsx(
                      'whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-body-sm text-xs font-semibold transition-all btn-tactile',
                      isActive
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    )}
                  >
                    <Icon name={sec.icon} className="text-[15px]" />
                    <span>{sec.label}</span>
                    {typeof sec.count === 'number' && (
                      <span
                        className={clsx(
                          'text-[10px] px-1.5 py-0.2 rounded-full font-numeric-data font-bold',
                          isActive ? 'bg-white/20 text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                        )}
                      >
                        {sec.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory Sections Render */}
          <div className="flex flex-col gap-xl">
            {/* Section 1: Members & Invites */}
            {(section === 'all' || section === 'members') && (
              <section id="section-members" className="flex flex-col gap-md scroll-mt-28">
                <div className="flex items-center justify-between border-b border-surface-container-highest pb-xs">
                  <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                    <Icon name="group" className="text-primary text-lg" />
                    Housemates &amp; Invites
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {housemates.length} Total
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
                  <div className="lg:col-span-7 flex flex-col gap-sm">
                    <Card padded={false} className="overflow-hidden border border-outline-variant/60 shadow-xs">
                      <ul className="divide-y divide-surface-container-highest">
                        {housemates.map((user) => (
                          <li
                            key={user.id}
                            className="p-md flex items-center gap-md hover:bg-surface-container-low/60 transition-colors"
                          >
                            <Avatar user={user} size="md" />
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-body-lg text-body-lg font-semibold truncate text-on-surface">
                                  {user.name}
                                </p>
                                {user.id === currentUser.id && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-primary-container/40 text-primary">
                                    You
                                  </span>
                                )}
                              </div>
                              {user.dietaryPreferences.length > 0 && (
                                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                  {user.dietaryPreferences.map((p) => formatDietaryBadge(p).label).join(' · ')}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-xs shrink-0">
                              {user.id === collector?.id && <Badge tone="solid-primary">Collector</Badge>}
                              {user.isAdmin && <Badge tone="primary">Admin</Badge>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>

                  {/* Single dedicated Invite Card in Members Section */}
                  <div className="lg:col-span-5 flex flex-col gap-sm">
                    <Card className="flex flex-col gap-md border border-outline-variant/60 shadow-xs bg-gradient-to-br from-surface-container-low to-surface-container">
                      <div className="flex flex-col gap-xs">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Icon name="person_add" className="text-lg" />
                        </div>
                        <h3 className="font-body-lg text-body-lg font-bold text-on-surface">
                          Invite New Housemates
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Share this invite link with housemates. Anyone who joins will be added to meal splits, pantry planning, and household rotas.
                        </p>
                      </div>
                      <InviteLink inviteCode={house.inviteCode} />
                    </Card>
                  </div>
                </div>
              </section>
            )}

            {/* Section 2: Routine & Rotation */}
            {(section === 'all' || section === 'routine') && (
              <section id="section-routine" className="flex flex-col gap-md scroll-mt-28">
                <div className="flex items-center justify-between border-b border-surface-container-highest pb-xs">
                  <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                    <Icon name="event_repeat" className="text-primary text-lg" />
                    Weekly Routine &amp; Rotation
                  </h2>
                </div>
                <RoutinePanel house={house} housemates={housemates} collectorId={collector?.id ?? null} />
              </section>
            )}

            {/* Section 3: Ordering & Tesco */}
            {(section === 'all' || section === 'ordering') && (
              <section id="section-ordering" className="flex flex-col gap-md scroll-mt-28">
                <div className="flex items-center justify-between border-b border-surface-container-highest pb-xs">
                  <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                    <Icon name="shopping_cart" className="text-primary text-lg" />
                    Ordering &amp; Tesco Integration
                  </h2>
                </div>
                <div className="flex flex-col gap-lg">
                  <TescoSessionPanel />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md items-start">
                    <FulfillmentSettingsPanel house={house} />
                    <SlotPreferencePanel house={house} />
                  </div>
                </div>
              </section>
            )}

            {/* Section 4: Shared Household Staples */}
            {(section === 'all' || section === 'staples') && (
              <section id="section-staples" className="flex flex-col gap-md scroll-mt-28">
                <div className="flex items-center justify-between border-b border-surface-container-highest pb-xs">
                  <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                    <Icon name="shopping_basket" className="text-primary text-lg" />
                    Shared Household Staples
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {staples.length} Item{staples.length === 1 ? '' : 's'}
                  </span>
                </div>
                <Card className="flex flex-col gap-md">
                  <SharedStaplesToggle enabled={house.sharedStaplesEnabled} />
                  <div className="border-t border-surface-container-highest pt-md">
                    <StaplesPanel staples={staples} splitEqually={house.sharedStaplesEnabled} />
                  </div>
                </Card>
              </section>
            )}

            {/* Section 5: Calendar Sync & Alerts */}
            {(section === 'all' || section === 'calendar') && (
              <section id="calendar-sync" className="flex flex-col gap-md scroll-mt-28">
                <div className="flex items-center justify-between border-b border-surface-container-highest pb-xs">
                  <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                    <Icon name="event" className="text-primary text-lg" />
                    Calendar Sync &amp; Alerts
                  </h2>
                </div>
                <NotificationsCalendarPanel houseId={house.id} />
              </section>
            )}

            {/* Bottom Privacy Controls */}
            <div className="pt-sm pb-md border-t border-surface-container-highest flex items-center justify-between">
              <ManagePrivacyButton />
              {section !== 'all' && (
                <button
                  type="button"
                  onClick={() => switchSection('all')}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Icon name="grid_view" className="text-[14px]" />
                  <span>View All House Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: YOUR PROFILE */}
      {tab === 'profile' && (
        <div className="flex flex-col gap-lg">
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
            {/* Left Column: Personal Settings */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-lg min-w-0">
              <section className="flex flex-col gap-sm">
                <div className="flex items-center justify-between border-b border-surface-container-highest pb-xs">
                  <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                    <Icon name="person" className="text-primary text-lg" />
                    Personal &amp; Dietary Profile
                  </h2>
                </div>
                <ProfileInfoPanel user={currentUser} housemates={housemates.filter((h) => h.id !== currentUser.id)} />
                <DietaryPanel user={currentUser} />
                <PaymentDetailsPanel user={currentUser} />
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
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        See how much money pooling ingredients has saved you
                      </p>
                    </div>
                    <Icon name="chevron_right" className="text-on-surface-variant" />
                  </Link>
                </Card>
              </section>

              {/* Household Quick-Link inside Profile tab */}
              <section className="flex flex-col gap-sm">
                <div className="flex items-center justify-between border-b border-surface-container-highest pb-xs">
                  <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-bold">
                    <Icon name="home" className="text-primary text-lg" />
                    Household Connection
                  </h2>
                </div>
                <Card className="flex flex-col gap-sm">
                  <div className="flex items-center justify-between gap-md p-xs bg-surface-container-low rounded-xl">
                    <div className="flex flex-col px-xs">
                      <span className="font-body-md text-body-md font-medium">{house.name}</span>
                      <span className="text-xs text-on-surface-variant">House Invite Code</span>
                    </div>
                    <code className="font-numeric-data text-headline-sm bg-surface-container-highest px-md py-xs rounded-lg tracking-wider text-primary font-bold">
                      {house.inviteCode}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchTab('house')}
                    className="flex items-center gap-xs text-primary font-semibold text-[14px] hover:opacity-80 mt-xs text-left"
                  >
                    <Icon name="tune" className="text-[18px]" />
                    Switch to House Settings
                  </button>
                </Card>
              </section>
            </div>

            {/* Right Column: Profile Hero, Impact & Danger Zone */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-lg lg:sticky lg:top-[90px]">
              <Card className="flex flex-col items-center text-center gap-md py-lg relative overflow-hidden border border-outline-variant/60 shadow-ambient-card">
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                <div className="relative mt-2">
                  <Avatar user={currentUser} size="xl" className="ring-4 ring-primary/20 shadow-lg" />
                  {currentUser.isAdmin && (
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
                    {currentUser.name}
                  </h1>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {house.name}
                  </p>
                  {currentUser.dietaryPreferences.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-1.5 max-w-xs">
                      {currentUser.dietaryPreferences.map((pref) => {
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

              {/* My Impact Stats */}
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
        </div>
      )}
    </div>
  );
}
