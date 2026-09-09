import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageShell } from '@/components/ui/PageShell';
import { KitchenSubNav } from '@/components/kitchen/KitchenSubNav';
import { getCurrentUser, getHouse, getHouseStaples, getPantryItems } from '@/lib/queries';
import type { IngredientCategory, PantryItem } from '@/lib/types';
import { PantryItemRow } from '@/components/pantry/PantryItemRow';
import { AddPantryItem } from '@/components/pantry/AddPantryItem';
import { StaplesPanel } from '@/components/settings/StaplesPanel';

export const metadata = {
  title: 'Pantry · Grub',
  description: 'Manage the ingredients and shared staples already in the house.',
};

// Reads the signed-in user's house — nothing to prerender at build time.
export const dynamic = 'force-dynamic';

const SECTION_META: Record<IngredientCategory, { label: string; icon: string }> = {
  fresh: { label: 'Fridge & Fresh', icon: 'kitchen' },
  cupboard: { label: 'Cupboard & Staples', icon: 'inventory_2' },
  frozen: { label: 'Freezer', icon: 'ac_unit' },
  household: { label: 'Household', icon: 'cleaning_services' },
};

function PantrySection({ title, items }: { title: string; items: PantryItem[] }) {
  const categories = (['fresh', 'cupboard', 'frozen', 'household'] as IngredientCategory[])
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className="flex flex-col gap-md">
      <h2 className="font-title-md text-title-md text-on-surface font-semibold">{title}</h2>

      {categories.length === 0 ? (
        <Card>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Nothing here yet.</p>
        </Card>
      ) : (
        categories.map(({ category, items: sectionItems }) => (
          <div key={category} className="flex flex-col gap-sm">
            <h3 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant flex items-center gap-xs">
              <Icon name={SECTION_META[category].icon} className="text-[16px]" />
              {SECTION_META[category].label}
            </h3>

            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-surface-container-highest">
                {sectionItems.map((item) => (
                  <PantryItemRow key={item.id} item={item} />
                ))}
              </ul>
            </Card>
          </div>
        ))
      )}
    </section>
  );
}

export default async function PantryPage() {
  const [items, currentUser, house, staples] = await Promise.all([
    getPantryItems(),
    getCurrentUser(),
    getHouse(),
    getHouseStaples(),
  ]);

  const shared = items.filter((item) => item.isShared);
  const personal = items.filter((item) => !item.isShared && item.ownerUserId === currentUser.id);
  const lowCount = shared.filter((item) => item.lowStock).length;

  if (items.length === 0 && staples.length === 0) {
    return (
      <PageShell wide>
        <div className="flex flex-col gap-sm">
          <KitchenSubNav current="pantry" />
          <PageHeader
            title="House Pantry"
            subtitle="What you already have, so the shop doesn't buy it twice."
          />
        </div>
        <EmptyState
          icon="inventory_2"
          title="Your cupboard is giving nothing"
          body="Probably accurate. Add staple ingredients here so the basket doesn't buy another bag of salt."
        />
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <div className="flex flex-col gap-sm">
        <KitchenSubNav current="pantry" />
        <PageHeader
          title="House Pantry"
          subtitle="What you already have. The shop won't buy these twice."
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm p-sm px-md rounded-2xl bg-gradient-to-r from-secondary-fixed/40 via-surface-container-low to-secondary-fixed/20 border border-secondary/30 text-xs interactive-card card-glow">
        <div className="flex items-center gap-sm min-w-0">
          <span className="size-8 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
            <Icon name="soup_kitchen" className="text-base" />
          </span>
          <div className="min-w-0">
            <p className="font-title-md text-[13px] font-bold text-on-surface truncate">Cooked meals and leftovers</p>
            <p className="font-body-sm text-[11px] text-on-surface-variant truncate">Check the fridge board before food goes out of date.</p>
          </div>
        </div>
        <Link
          href="/leftovers"
          className="self-start sm:self-auto shrink-0 font-bold text-secondary hover:text-on-secondary-fixed-variant px-3 py-1.5 rounded-full bg-secondary-fixed/60 border border-secondary/30 hover:bg-secondary-fixed transition-all flex items-center gap-1 btn-tactile shadow-xs"
        >
          <span>Leftovers Board</span>
          <Icon name="arrow_forward" className="text-sm" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Shared & Personal Pantry Lists */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-lg min-w-0">
          {lowCount > 0 && (
            <Card accent="secondary" className="flex items-center gap-sm">
              <Icon name="warning" filled className="text-secondary shrink-0" />
              <p className="font-body-sm text-body-sm text-on-surface">
                <strong>{lowCount}</strong> shared item{lowCount === 1 ? ' is' : 's are'} running low
                and will be added to this week&apos;s basket automatically.
              </p>
            </Card>
          )}

          <PantrySection title="Shared Food & Ingredients" items={shared} />
          {personal.length > 0 && <PantrySection title="Your Personal Shelf" items={personal} />}

          <section className="flex flex-col gap-sm mt-md">
            <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-xs font-semibold">
              <Icon name="repeat" className="text-primary text-lg" />
              Recurring Standing Staples
            </h2>
            <Card className="flex flex-col gap-md">
              <StaplesPanel staples={staples} splitEqually={house.sharedStaplesEnabled} />
            </Card>
          </section>
        </div>

        {/* Right Column: Add Item & Optimiser Info */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-lg lg:sticky lg:top-[90px]">
          <AddPantryItem />

          <Card className="flex flex-col gap-sm bg-surface-container-low/60 border-dashed">
            <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-xs">
              <Icon name="auto_awesome" className="text-primary text-sm" />
              Pantry Optimiser
            </h3>
            <ul className="space-y-xs text-body-sm text-on-surface-variant">
              <li className="flex items-start gap-xs">
                <Icon name="check" className="text-primary text-xs mt-1 shrink-0" />
                <span>Ingredients marked as in-stock are automatically deducted from the house basket.</span>
              </li>
              <li className="flex items-start gap-xs">
                <Icon name="check" className="text-primary text-xs mt-1 shrink-0" />
                <span>Items marked as low stock are added back to the order when building next week&apos;s shop.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
