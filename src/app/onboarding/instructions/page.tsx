import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { Reveal } from '@/components/motion/Reveal';
import { clsx } from '@/lib/clsx';

export const metadata = {
  title: 'How Grub Works · Grub',
  description: 'How the week runs, and where everything lives.',
};

// The week, in the order it actually happens. This is the rhythm every house
// settles into; the tabs below are just where each step lives.
const RHYTHM = [
  {
    n: '01',
    title: 'Everyone picks',
    body: 'Before the cutoff, each of you says what you fancy. Shared meals stack up; nobody is signed up to a dinner they did not choose.',
  },
  {
    n: '02',
    title: 'Build and review the basket',
    body: 'After the cutoff, the collector builds and reviews the basket. Shared ingredients are combined, with own-brand swaps where they save.',
  },
  {
    n: '03',
    title: 'Someone orders',
    body: 'One housemate — the collector, and it rotates each week — places the order from their Tesco account. Everyone else plans and pays from their phone.',
  },
  {
    n: '04',
    title: 'It turns up',
    body: 'The receipt never quite matches the plan. Tick off what actually arrived; the split is rebuilt from that, not from what you hoped for.',
  },
  {
    n: '05',
    title: 'Settle up',
    body: 'Everyone pays the collector their real share — the workings are printed under every line. Pay by bank transfer or Revolut; the app never touches the money.',
  },
];

// Where each of the above lives. Icons match the bottom nav exactly.
const TABS = [
  {
    icon: 'ti-home',
    name: 'Feed',
    body: 'Where you land. The countdown to the cutoff, who still owes what, and anything that needs doing before the shop goes in.',
  },
  {
    icon: 'ti-calendar',
    name: 'Plan',
    body: 'The week as day cards. Add a meal, join a housemate’s, or browse the recipe book. This is where "what do you fancy?" gets answered.',
  },
  {
    icon: 'ti-shopping-cart',
    name: 'Basket',
    body: 'The shop the plan built. Review it, swap anything to own-brand. Only the collector can check out — everyone else is just looking.',
  },
  {
    icon: 'ti-receipt',
    name: 'Split',
    body: 'What everyone owes, item by item, with the sums shown. Mark yourself paid, and reconcile the delivery once it arrives.',
  },
  {
    icon: 'ti-soup',
    name: 'Leftovers',
    body: 'Whatever is going spare in the kitchen. Free to whoever claims it — nobody owes anyone for a bowl of chilli.',
  },
];

/**
 * Shown to new users after signup, before they create or join a house.
 *
 * Two parts: the weekly rhythm (when things happen) and a guide to the tabs
 * (where things live). Mandatory but skippable — learn as you go if you like.
 */
export default function InstructionsPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between px-6 sm:px-8 py-xl max-w-md mx-auto">
      <div className="flex flex-col gap-xl">
        <div className="flex flex-col gap-sm pt-xl">
          <h1 className="font-georgia font-bold text-headline-lg-mobile text-primary">
            How Grub Works
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            The buying unit is the house, not you. Here is how a week runs, and where everything
            lives.
          </p>
        </div>

        {/* Part one — the rhythm */}
        <section className="flex flex-col gap-md">
          <h2 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            The week, in order
          </h2>
          <Reveal className="rounded-xl bg-primary text-on-primary p-lg flex flex-col">
            {RHYTHM.map((step, i) => (
              <div
                key={step.n}
                className={clsx('flex gap-md', i > 0 && 'pt-md mt-md border-t border-on-primary/15')}
              >
                <span className="font-numeric-data text-secondary text-title-md shrink-0">
                  {step.n}
                </span>
                <div className="flex flex-col gap-xs min-w-0">
                  <h3 className="font-title-md text-title-md">{step.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-primary/80">{step.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </section>

        {/* Part two — the tabs */}
        <section className="flex flex-col gap-md">
          <h2 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Getting around
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Five tabs along the bottom. Everything is one of these.
          </p>
          {TABS.map((tab, i) => (
            <Reveal
              key={tab.name}
              delay={i * 70}
              className="flex items-start gap-md p-lg rounded-xl bg-surface-container-lowest border border-surface-container-highest shadow-ambient-card"
            >
              <span className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                <Icon name={tab.icon} className="text-[20px]" />
              </span>
              <div className="flex flex-col gap-xs min-w-0">
                <h3 className="font-title-md text-title-md text-on-surface">{tab.name}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tab.body}</p>
              </div>
            </Reveal>
          ))}
        </section>
      </div>

      <div className="flex flex-col gap-sm pt-xl">
        <Link
          href="/onboarding"
          className="w-full h-12 rounded-lg bg-secondary-container text-on-secondary font-title-md text-title-md flex items-center justify-center hover:bg-secondary transition-colors"
        >
          Let&apos;s go
        </Link>
        <Link
          href="/onboarding"
          className="w-full h-12 rounded-lg border border-primary text-primary font-title-md text-title-md flex items-center justify-center hover:bg-primary/10 transition-colors"
        >
          Skip
        </Link>
      </div>
    </main>
  );
}
