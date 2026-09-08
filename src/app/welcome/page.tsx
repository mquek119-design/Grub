import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoMark } from '@/components/brand/Logo';
import { Icon } from '@/components/media/Icon';
import { Reveal } from '@/components/motion/Reveal';
import { Marquee } from '@/components/motion/Marquee';
import { getCurrentUserOrNull } from '@/lib/queries';

export const metadata = {
  title: 'Grub — one house, automated Tesco shop, split fair',
  description:
    'Plan meals together, automate your Tesco online basket building, and split it per item — you pay for what you ate.',
};

export const dynamic = 'force-dynamic';

const STRIP = [
  'Automates Tesco basket',
  'One shop, not four',
  'Split per item',
  'Clears the £25 minimum',
  'Overlap cuts the bill',
  'Own-brand swaps',
  'Pay for what you ate',
];

const BENEFITS = [
  {
    icon: 'shopping_basket',
    title: 'Automated Tesco trolley building',
    body: 'Not just a manual tracking list. Grub automatically translates your house meal plan into exact ingredients and builds your Tesco online basket in 1 click.',
  },
  {
    icon: 'savings',
    title: 'Overlap cuts the bill',
    body: 'Two meals that share an onion buy one bag, not two. The optimiser reuses ingredients across the week so less is wasted and less is bought.',
  },
  {
    icon: 'receipt_long',
    title: 'Split per item, not evenly',
    body: "You pay for what you ate — not a flat quarter of someone else's protein powder. Every line shows its own transparent arithmetic.",
  },
];

const STEPS = [
  { n: '01', title: 'Everyone picks', body: 'The house says what they fancy this week. Shared meals stack; nobody is signed up to a dinner they did not choose.' },
  { n: '02', title: 'Tesco trolley builds automatically', body: 'Grub consolidates ingredients, finds own-brand swaps, and automatically syncs the trolley directly to Tesco.' },
  { n: '03', title: 'Split settles on delivery', body: 'The shopper confirms order placement; everyone pays their real share back with transparent itemized receipts.' },
];

export default async function WelcomePage() {
  const currentUser = await getCurrentUserOrNull();
  if (currentUser?.houseId) redirect('/');
  if (currentUser) redirect('/onboarding');
  const hasHouse = false;

  const headerLink = currentUser ? (
    <Link
      href="/account"
      className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-surface-0 px-lg font-body-sm text-body-sm font-semibold text-primary transition-[background-color,border-color,transform] hover:border-primary hover:bg-primary-fixed active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
    >
      Account
    </Link>
  ) : (
    <Link
      href="/login"
      className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-surface-0 px-lg font-body-sm text-body-sm font-semibold text-primary transition-[background-color,border-color,transform] hover:border-primary hover:bg-primary-fixed active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
    >
      Sign in
    </Link>
  );

  const primaryCta = currentUser ? (
    hasHouse ? (
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-xs h-12 px-xl rounded-full bg-secondary text-on-secondary font-title-md text-title-md hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
      >
        Go to your house
        <Icon name="arrow_forward" className="text-[20px]" />
      </Link>
    ) : (
      <Link
        href="/onboarding"
        className="inline-flex items-center justify-center gap-xs h-12 px-xl rounded-full bg-secondary text-on-secondary font-title-md text-title-md hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
      >
        Set up house
        <Icon name="arrow_forward" className="text-[20px]" />
      </Link>
    )
  ) : (
    <Link
      href="/onboarding/signup"
      className="inline-flex items-center justify-center gap-xs h-12 px-xl rounded-full bg-secondary text-on-secondary font-title-md text-title-md hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
    >
      Sign up
      <Icon name="arrow_forward" className="text-[20px]" />
    </Link>
  );

  const secondaryCta = !currentUser && (
    <Link
      href="/onboarding/join"
      className="inline-flex items-center justify-center h-12 px-lg font-body-sm text-body-sm font-semibold text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 rounded-full"
    >
      Got an invite code? Join a house
    </Link>
  );

  const closingCta = currentUser ? (
    hasHouse ? (
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-xs h-12 px-xl rounded-full bg-secondary text-on-secondary font-title-md text-title-md hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
      >
        Go to your house
        <Icon name="arrow_forward" className="text-[20px]" />
      </Link>
    ) : (
      <Link
        href="/onboarding"
        className="inline-flex items-center justify-center gap-xs h-12 px-xl rounded-full bg-secondary text-on-secondary font-title-md text-title-md hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
      >
        Set up house
        <Icon name="arrow_forward" className="text-[20px]" />
      </Link>
    )
  ) : (
    <Link
      href="/onboarding/signup"
      className="inline-flex items-center justify-center gap-xs h-12 px-xl rounded-full bg-secondary text-on-secondary font-title-md text-title-md hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
    >
      Sign up
      <Icon name="arrow_forward" className="text-[20px]" />
    </Link>
  );

  return (
    <main className="min-h-screen bg-surface-0 text-on-background overflow-x-hidden">
      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="relative w-full pt-lg md:pt-xl pb-[3rem] md:pb-[3.5rem]">
        <div className="px-margin-mobile md:px-margin-desktop mx-auto flex items-center justify-between gap-xl animate-fade-in">
          <Link href="/welcome" aria-label="Grub home" className="inline-flex min-w-0 items-center gap-sm hover:opacity-90 transition-opacity">
            <LogoMark className="h-9 w-auto" />
            <span className="font-georgia font-bold text-title-md text-primary">Grub</span>
          </Link>
          {headerLink}
        </div>

        <div className="px-margin-mobile md:px-margin-desktop mx-auto pt-[2.5rem] md:pt-[3.5rem] max-w-3xl">
          <h1 className="font-georgia text-[2.75rem] leading-[1.05] md:text-[4.5rem] md:leading-[1.02] font-bold text-primary animate-fade-in-up">
            Stop buying four bags of pasta.
          </h1>
          <p
            className="mt-md md:mt-lg font-body-lg text-body-lg md:text-[1.35rem] md:leading-relaxed text-on-surface-variant max-w-xl animate-fade-in-up"
            style={{ animationDelay: '120ms' }}
          >
            One house, one shop, split fair. Plan meals together, buy a single
            order that actually clears the minimum, and pay for what you ate.
          </p>

          <div
            className="mt-xl flex flex-col sm:flex-row gap-sm animate-fade-in-up"
            style={{ animationDelay: '240ms' }}
          >
            {primaryCta}
            {secondaryCta}
          </div>
        </div>

        <span aria-hidden="true" className="hidden lg:block absolute right-8 top-[7rem] opacity-15 animate-float">
          <LogoMark className="h-40 w-auto" />
        </span>
      </section>

      {/* ---- Marquee ------------------------------------------------------- */}
      <Marquee className="border-y border-surface-container-highest bg-primary py-md">
        {STRIP.map((phrase) => (
          <span key={phrase} className="inline-flex items-center gap-md px-md">
            <span className="font-georgia text-title-md text-secondary">{phrase}</span>
            <Icon name="soup_kitchen" className="text-[18px] text-primary-fixed-dim" />
          </span>
        ))}
      </Marquee>

      {/* ---- Why Grub ------------------------------------------------------ */}
      <section className="w-full px-margin-mobile md:px-margin-desktop py-[4rem]">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="font-georgia text-headline-lg-mobile md:text-headline-lg text-primary mb-lg">
            Why Grub
          </Reveal>
          <Reveal className="max-w-3xl">
            <p className="font-body-lg text-body-lg md:text-[1.1rem] md:leading-relaxed text-on-surface-variant">
              Every student house faces the same issue: manual shopping lists left unchecked, four separate deliveries paying delivery fees, or group chat arguments over who owes what. Grub is built to automate your Tesco basket directly from your weekly meal plan, pool orders to clear supermarket delivery thresholds, and calculate per-item dry-money splits automatically.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---- Benefits ------------------------------------------------------ */}
      <section className="w-full px-margin-mobile md:px-margin-desktop py-[4rem]">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="font-georgia text-headline-lg-mobile md:text-headline-lg text-primary max-w-2xl">
            The buying unit is the household, not the individual.
          </Reveal>
          <div className="mt-xl grid gap-md md:grid-cols-3">
            {BENEFITS.map((benefit, i) => (
              <Reveal
                key={benefit.title}
                delay={i * 90}
                className="flex flex-col gap-sm p-lg rounded-xl bg-surface-container-lowest border border-surface-container-highest shadow-ambient-card"
              >
                <span className="w-11 h-11 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <Icon name={benefit.icon} />
                </span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">{benefit.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{benefit.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- How it works -------------------------------------------------- */}
      <section className="w-full px-margin-mobile md:px-margin-desktop py-[4rem]">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="font-georgia text-headline-lg-mobile md:text-headline-lg text-primary">
            How a week runs
          </Reveal>
          <div className="mt-xl grid gap-md md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 90} className="flex flex-col gap-xs">
                <span className="font-numeric-data text-secondary text-title-md font-bold">{step.n}</span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">{step.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Closing CTA --------------------------------------------------- */}
      <section className="w-full px-margin-mobile md:px-margin-desktop pb-[4rem]">
        <div className="mx-auto max-w-5xl">
          <Reveal className="rounded-xl bg-primary text-on-primary p-xl md:p-[3rem] flex flex-col items-start gap-md">
            <h2 className="font-georgia text-headline-lg-mobile md:text-headline-lg text-secondary max-w-2xl">
              Automate your flat&apos;s groceries and start pooling your shop today.
            </h2>
            {closingCta}
          </Reveal>

          <p className="mt-xl text-center font-body-sm text-body-sm text-on-surface-variant flex flex-col items-center gap-2">
            <span><span className="font-georgia text-primary font-bold">Grub</span> · one house, automated Tesco shop, split fair</span>
            <span className="flex gap-4">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
