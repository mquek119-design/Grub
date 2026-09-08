'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { Badge } from '@/components/ui/Badge';
import { clsx } from '@/lib/clsx';
import { Stocky, type StockyMood } from '@/components/mascot/Stocky';

const CHROME_EXTENSION_URL =
  'https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm?hl=en';

interface Slide {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  badge: string;
  stockyMood: StockyMood;
  stockyCaption: string;
  renderIllustration: () => React.ReactNode;
  highlights: string[];
}

export function VisualGuide() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    // Slide 1: Feed (The Weekly Pulse)
    {
      id: 'feed',
      step: '01 / 06',
      title: 'The Weekly Household Pulse',
      subtitle: 'Never wonder what’s for dinner or who is cooking. Your house’s collective rhythm lives here.',
      badge: 'Feed',
      stockyMood: 'stressed',
      stockyCaption: '2h to cutoff!',
      highlights: [
        'Live countdown to your weekly grocery cutoff',
        'Tonight’s dinner card with cook assignment & diners',
        'Instant settlement balances and low staple warnings',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          {/* Mockup: Countdown card */}
          <div className="p-3.5 rounded-xl bg-primary text-on-primary flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                <Icon name="timer" className="text-[18px]" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Cutoff In</p>
                <p className="text-sm font-bold font-numeric-data">2h 15m · Sunday 8:00 PM</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-on-primary/15 font-semibold">Tesco Shop</span>
          </div>

          {/* Mockup: Tonight's Dinner */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-secondary-fixed/40 text-secondary flex items-center justify-center text-xl shrink-0">
              🍝
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-primary truncate">Spaghetti Bolognese</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">YOU'RE IN</span>
              </div>
              <p className="text-[11px] text-on-surface-variant truncate mt-0.5">Cooked by <strong>Maya</strong> · 4 diners</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-secondary font-semibold">
                <Icon name="skillet" className="text-[13px]" />
                <span>Cook Mode available</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 2: Plan (Communal Dinners + Partner/Guest seats)
    {
      id: 'plan',
      step: '02 / 06',
      title: 'Stack Dinners, Cut the Bill',
      subtitle: 'Pick what you fancy before the cutoff. Bring a friend or partner? Scale portions in 1 tap.',
      badge: 'Plan',
      stockyMood: 'smug',
      stockyCaption: '1 pack, 4 meals!',
      highlights: [
        'Shared ingredients are pooled so you never buy four bottles of oil',
        '+1 Guest toggle adds partner/friend portions fairly',
        'Nobody is locked into a meal they didn’t choose',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-surface-container-highest">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] font-bold text-primary">MON</p>
              <p className="text-xs font-semibold text-on-surface mt-0.5">Curry 🍛</p>
              <span className="text-[9px] text-primary font-bold">4 Eating</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant">TUE</p>
              <p className="text-xs font-semibold text-on-surface mt-0.5">Pasta 🍝</p>
              <span className="text-[9px] text-on-surface-variant">3 Eating</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant">WED</p>
              <p className="text-xs font-semibold text-on-surface mt-0.5">Fajitas 🌮</p>
              <span className="text-[9px] text-on-surface-variant">5 Eating</span>
            </div>
          </div>

          {/* Guest Seating Callout */}
          <div className="p-3 rounded-xl bg-secondary-fixed/25 border border-secondary-fixed flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-xs">
                +1
              </span>
              <div>
                <p className="text-xs font-bold text-on-secondary-fixed">Partner / Guest Staying?</p>
                <p className="text-[10px] text-on-secondary-fixed/80">Scales groceries & calculates their share</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-secondary text-on-secondary shadow-xs">
              Active
            </span>
          </div>
        </div>
      ),
    },

    // Slide 3: Tesco Automation & 1-Click Cookie Export
    {
      id: 'tesco-automation',
      step: '03 / 06',
      title: 'Tesco Automation & Session Link',
      subtitle: 'The collector connects Tesco once using the free Cookie-Editor extension. Grub builds the basket automatically.',
      badge: 'Automation',
      stockyMood: 'neutral',
      stockyCaption: 'Tesco cart filled!',
      highlights: [
        'Grub takes the entire flat’s meals and fills the Tesco trolley in seconds',
        'Clubcard discounts and price swaps applied automatically',
        'Uses free, safe browser cookie export — no passwords stored',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          {/* Anonymized Stylized Browser Mockup */}
          <div className="rounded-xl overflow-hidden border border-outline-variant/50 bg-surface-container-low shadow-xs">
            <div className="px-3 py-2 bg-surface-container flex items-center justify-between border-b border-outline-variant/40">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-secondary/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/80 bg-surface-container-lowest px-2.5 py-0.5 rounded-md border border-outline-variant/30">
                tesco.com/groceries
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary text-on-primary font-bold">
                Cookie-Editor
              </span>
            </div>

            <div className="p-3 flex flex-col gap-2 bg-surface-container-lowest">
              <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                <span className="flex items-center gap-1.5">
                  <span className="text-primary font-extrabold">TESCO</span>
                  <span className="text-on-surface-variant font-normal">· Cannon Park Superstore</span>
                </span>
                <Badge tone="primary" className="text-[10px]">Connected</Badge>
              </div>

              {/* Step pills */}
              <div className="grid grid-cols-3 gap-1 text-[10px] text-center pt-1">
                <div className="p-1.5 rounded bg-surface-container font-medium text-on-surface-variant">
                  1. Open Tesco
                </div>
                <div className="p-1.5 rounded bg-secondary-fixed/40 font-bold text-on-secondary-fixed border border-secondary-fixed">
                  2. Export JSON
                </div>
                <div className="p-1.5 rounded bg-primary/10 font-bold text-primary border border-primary/20">
                  3. Auto-Sync!
                </div>
              </div>
            </div>
          </div>

          <a
            href={CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Icon name="extension" className="text-[16px] text-primary" />
            <span>Get Cookie-Editor Chrome Extension</span>
            <Icon name="open_in_new" className="text-[13px] text-on-surface-variant ml-auto" />
          </a>
        </div>
      ),
    },

    // Slide 4: Automatic Delivery & Collection Slot Reservation
    {
      id: 'slot-reservation',
      step: '04 / 06',
      title: 'Grub Reserves the Slot For You',
      subtitle: 'Never miss a delivery or carry heavy bags alone. Grub holds the 1-hour slot when flatmates are home.',
      badge: 'Fulfillment',
      stockyMood: 'asleep',
      stockyCaption: 'Slot held for flat!',
      highlights: [
        'Home Delivery or Click & Collect (e.g. Cannon Park pickup)',
        'Grub holds the 1-hour window before cutoff so groceries arrive on schedule',
        'Automatic phone calendar alarms 30 minutes before arrival',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-low border border-primary/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-xs text-primary">
                <Icon name="local_shipping" className="text-base" />
                <span>Reserved Delivery Slot</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-on-primary">
                Held by Grub
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40">
              <p className="text-xs font-bold text-on-surface">Thursday · 19:00 – 20:00</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Delivery Van · Tesco Cannon Park Superstore
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant pt-1">
              <Icon name="check_circle" className="text-primary text-[15px]" />
              <span>Collector & flatmates alerted via Web Push & Calendar</span>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 5: Fair Splits & 1-Tap Settle Up (Monzo / Revolut)
    {
      id: 'split',
      step: '05 / 06',
      title: 'Penny-Perfect Split & Instant Settlement',
      subtitle: 'Pay exact pennies via Monzo or Revolut in 1 tap. No spreadsheets, receipt arguments, or chasing people.',
      badge: 'Split',
      stockyMood: 'split',
      stockyCaption: 'Down to the penny!',
      highlights: [
        'Split down to the penny for shared meals — never pay for someone else’s snacks',
        '1-tap Monzo & Revolut payment links pre-filled with the exact amount owed',
        'Personal grocery items (e.g. oat milk, gym fuel) stay completely separate',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          {/* Split summary card */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Your Flat Share</p>
                <p className="text-base font-extrabold text-on-surface font-numeric-data">£18.40</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                4 Meals + Personal Milk
              </span>
            </div>

            {/* 1-Tap Banking Settlement Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-9 px-3 rounded-lg bg-[#FF3B69] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                <span>Pay Monzo</span>
                <Icon name="arrow_forward" className="text-[13px]" />
              </div>
              <div className="h-9 px-3 rounded-lg bg-[#0075EB] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                <span>Pay Revolut</span>
                <Icon name="arrow_forward" className="text-[13px]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant px-1">
            <Icon name="check_circle" className="text-primary text-[15px]" />
            <span>Collector is marked paid instantly — zero awkward reminders</span>
          </div>
        </div>
      ),
    },

    // Slide 6: Kitchen Counter Cook Mode (Wake Lock & Leftovers)
    {
      id: 'kitchen-cook',
      step: '06 / 06',
      title: 'Kitchen Counter Cook Mode',
      subtitle: 'Prop your phone by the hob while you cook. Your screen never sleeps and steps are huge.',
      badge: 'Cook Mode',
      stockyMood: 'cooking',
      stockyCaption: 'Worktop mode on!',
      highlights: [
        'Screen Wake Lock keeps your recipe visible — no greasy fingers unlocking your phone',
        '20px bold typography legible from across the kitchen counter',
        'Knuckle-tap step checkoffs & 1-tap spare portion logging to the house fridge',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          {/* Active cooking card */}
          <div className="p-3.5 rounded-xl bg-primary text-on-primary flex flex-col gap-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍳</span>
                <div>
                  <p className="text-xs font-bold text-secondary">Spaghetti Bolognese</p>
                  <p className="text-[10px] text-on-primary/80">Step 2 of 5 · 4 portions</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-on-primary/15 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Screen Awake
              </span>
            </div>

            {/* Big step text */}
            <div className="p-2.5 rounded-lg bg-on-primary/10 border border-on-primary/10">
              <p className="text-xs font-semibold leading-relaxed text-on-primary">
                &ldquo;Brown 500g beef mince over medium heat until caramelised...&rdquo;
              </p>
            </div>

            {/* Knuckle tap & leftover pill */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] font-semibold text-secondary flex items-center gap-1">
                <Icon name="touch_app" className="text-[14px]" />
                Knuckle-tap check
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-on-secondary shadow-xs">
                + Fridge Leftover
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  return (
    <div className="flex flex-col gap-lg max-w-md mx-auto w-full">
      {/* Header step counter & skip */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-numeric-data font-bold text-primary tracking-wider">
          STEP {current.step}
        </span>
        <Link
          href="/onboarding"
          className="text-on-surface-variant hover:text-primary font-semibold transition-colors"
        >
          Skip to setup
        </Link>
      </div>

      {/* Main visual card */}
      <div className="flex flex-col gap-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Badge tone="primary" className="text-xs font-bold uppercase tracking-wider">
                {current.badge}
              </Badge>
            </div>
            <h1 className="font-georgia text-title-lg font-bold text-on-surface">
              {current.title}
            </h1>
          </div>
          <Stocky
            mood={current.stockyMood}
            size="sm"
            caption={current.stockyCaption}
            className="shrink-0 pt-0.5"
          />
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          {current.subtitle}
        </p>

        {/* Dynamic Illustration Canvas */}
        <div className="py-2">
          {current.renderIllustration()}
        </div>

        {/* Highlight bullets */}
        <ul className="flex flex-col gap-2 pt-xs">
          {current.highlights.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-on-surface-variant">
              <Icon name="check_circle" className="text-primary text-[16px] shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Stepper navigation buttons */}
      <div className="flex flex-col gap-sm pt-md border-t border-outline-variant/30">
        <div className="flex items-center justify-between gap-sm">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={clsx(
                  'h-2 rounded-full transition-all duration-300',
                  idx === currentSlide ? 'w-7 bg-primary' : 'w-2 bg-outline-variant/60 hover:bg-outline-variant'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-sm">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                className="h-11 px-4 rounded-xl border border-outline-variant/60 text-on-surface-variant font-semibold text-xs hover:bg-surface-container transition-colors"
              >
                Back
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                className="h-11 px-5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1 btn-tactile"
              >
                <span>Next</span>
                <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            ) : (
              <Link
                href="/onboarding"
                className="h-11 px-6 rounded-xl bg-secondary-container text-on-secondary font-bold text-xs hover:bg-secondary transition-colors shadow-sm flex items-center gap-1 btn-tactile"
              >
                <span>Get Started</span>
                <Icon name="check" className="text-[16px]" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
