import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { LogoMark } from '@/components/brand/Logo';
import { clsx } from '@/lib/clsx';

export const metadata = { title: 'Welcome · Grub', description: 'Welcome to Grub.' };

const BENEFITS = [
  {
    icon: 'groups',
    title: 'One shop, one order',
    body: 'Pool the house into a single basket that clears the £25 collection minimum.',
  },
  {
    icon: 'savings',
    title: 'Overlap cuts the bill',
    body: 'Meals that share ingredients get bought once, not four times.',
  },
  {
    icon: 'receipt_long',
    title: 'Split per item',
    body: "You pay for what you ate, not a quarter of someone else's protein powder.",
  },
];

export default function OnboardingWelcomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between px-margin-mobile py-xl max-w-md mx-auto">
      <div className="flex flex-col gap-xl">
        <div className="flex flex-col gap-sm pt-xl animate-fade-in-up">
          {/* The mark is hidden on desktop, where the layout's brand panel
              already carries it; the heading stays so the page keeps its h1. */}
          <Link href="/welcome" aria-label="Grub home" className="inline-block lg:hidden hover:opacity-90 transition-opacity">
            <LogoMark className="h-16 w-auto" />
          </Link>
          <h1 className="font-georgia font-bold text-headline-lg text-primary">Grub</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Plan meals together, buy one shop, split it fairly.
          </p>
        </div>

        <ul className="flex flex-col gap-md rounded-xl bg-primary text-on-primary p-lg animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          {BENEFITS.map((benefit, i) => (
            <li
              key={benefit.title}
              className={clsx('flex items-start gap-md', i > 0 && 'pt-md border-t border-on-primary/15')}
            >
              <span className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                <Icon name={benefit.icon} />
              </span>
              <div>
                <h2 className="font-title-md text-title-md text-secondary">{benefit.title}</h2>
                <p className="font-body-sm text-body-sm text-on-primary/80">{benefit.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-sm pt-xl">
        <Link
          href="/onboarding/create"
          className="w-full h-12 rounded-lg bg-secondary-container text-on-secondary font-title-md text-title-md flex items-center justify-center hover:bg-secondary transition-colors"
        >
          Create a House
        </Link>
        <Link
          href="/onboarding/join"
          className="w-full h-12 rounded-lg border border-primary text-primary font-title-md text-title-md flex items-center justify-center hover:bg-primary/10 transition-colors"
        >
          Join with a Code
        </Link>
      </div>
    </main>
  );
}
