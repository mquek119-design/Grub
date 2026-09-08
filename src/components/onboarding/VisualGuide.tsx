'use client';

import { useState, useEffect } from 'react';
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
  shortLabel: string;
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
    // Slide 1: Feed (The Weekly Household Pulse)
    {
      id: 'feed',
      step: '01 / 09',
      shortLabel: 'Pulse',
      title: 'The Weekly Household Pulse',
      subtitle: 'Never wonder what’s for dinner or who is cooking. Your house’s collective grocery rhythm lives here.',
      badge: 'Household Pulse',
      stockyMood: 'stressed',
      stockyCaption: 'Cutoff in 2h',
      highlights: [
        'Live countdown to your weekly grocery cutoff so orders are never missed',
        'Tonight’s dinner card with cook assignment, diner count, and calories/macros',
        'Communal fridge alerts for leftover portions ready to eat right now',
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
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-on-primary/15 font-semibold">Tesco Delivery</span>
          </div>

          {/* Mockup: Tonight's Dinner */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-secondary-fixed/40 text-secondary flex items-center justify-center text-xl shrink-0">
              🍝
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-primary truncate">Spaghetti Bolognese</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">YOU&apos;RE IN</span>
              </div>
              <p className="text-[11px] text-on-surface-variant truncate mt-0.5">Cooked by <strong>Maya</strong> · 4 diners · 🔥 620 kcal</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-secondary font-semibold">
                <Icon name="skillet" className="text-[13px]" />
                <span>Cook Mode available</span>
              </div>
            </div>
          </div>

          {/* Mockup: Fridge Leftover pill */}
          <div className="p-2.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/30 flex items-center justify-between text-[11px]">
            <span className="text-on-surface flex items-center gap-1.5">
              <span>🥡</span>
              <span><strong>2 portions</strong> Chili in house fridge</span>
            </span>
            <span className="text-[10px] font-bold text-secondary px-2 py-0.5 rounded bg-secondary/10">
              Free to claim
            </span>
          </div>
        </div>
      ),
    },

    // Slide 2: Recipes & Dietary Harmony
    {
      id: 'recipes',
      step: '02 / 09',
      shortLabel: 'Recipes',
      title: 'Dietary Harmony & Recipe Vault',
      subtitle: 'Pick meals from your flat’s cookbook or import directly from TikTok & BBC. Grub verifies allergies and dietary preferences automatically.',
      badge: 'Dietary Harmony',
      stockyMood: 'cooking',
      stockyCaption: 'Safe for all',
      highlights: [
        'Shared flat cookbook with 1-tap web recipe import from any food URL',
        'Allergen flags & dietary preferences (vegan, halal, gluten-free) noted automatically',
        'Per-portion calorie & macro tracking for fitness goals and budgeting',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-primary">Chicken Tikka Masala</p>
                <p className="text-[10px] text-on-surface-variant">25 mins · £1.45 per portion</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary">
                ★ House Fav
              </span>
            </div>

            {/* Dietary & Macro Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                ✓ Halal Friendly
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/30">
                Gluten-Free Option
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/25">
                🔥 580 kcal · 38g P
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container-high/50 border border-outline-variant/30 flex items-center gap-2 text-[11px] text-on-surface-variant">
            <Icon name="verified" className="text-primary text-[15px] shrink-0" />
            <span>Grub Reassurance: <strong>0 peanuts</strong> · Cleared for Alex</span>
          </div>
        </div>
      ),
    },

    // Slide 3: Smart Overlap Optimiser
    {
      id: 'overlap',
      step: '03 / 09',
      shortLabel: 'Overlap',
      title: 'Stack Dinners, Kill Food Waste',
      subtitle: 'Two recipes that need an onion buy one bag, not two. Grub pairs up shared ingredients across housemates to slash everyone’s bill.',
      badge: 'Smart Overlap',
      stockyMood: 'smug',
      stockyCaption: 'Saved £6.80',
      highlights: [
        'Shared ingredients are pooled across meals so nobody buys duplicate packs',
        'Pairs staple produce like onions, peppers, and garlic automatically',
        'Cuts average weekly household grocery spend by 18–24%',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          {/* Overlap connection cards */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] font-bold text-primary">MON · Bolognese</p>
              <p className="text-[9px] text-on-surface-variant mt-0.5">Mince, Onions, Garlic</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] font-bold text-primary">WED · Beef Tacos</p>
              <p className="text-[9px] text-on-surface-variant mt-0.5">Mince, Onions, Peppers</p>
            </div>
          </div>

          {/* Overlap result card */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-secondary-fixed/30 to-secondary-fixed/10 border border-secondary-fixed flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-on-secondary-fixed">
              <span className="flex items-center gap-1">
                <Icon name="savings" className="text-sm" />
                <span>Overlap Active: 1 Shared Pack</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary text-[10px] font-extrabold shadow-xs">
                -£6.80
              </span>
            </div>
            <p className="text-[10px] text-on-secondary-fixed/90 leading-tight">
              1kg Brown Onions + 750g Mince shared across 7 dinners instead of buying separate bags.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 4: Smart Basket & Personal Groceries
    {
      id: 'basket',
      step: '04 / 09',
      shortLabel: 'Basket',
      title: 'Communal Trolley + Personal Stash',
      subtitle: 'Shared pasta, oil, and dinner ingredients are pooled into the flat basket. Personal snacks, oat milk, or gym fuel stay strictly itemised to you.',
      badge: 'Smart Basket',
      stockyMood: 'neutral',
      stockyCaption: 'Oat milk safe',
      highlights: [
        'Shared dinner ingredients are pooled and split cleanly across diners',
        'Personal items (oat milk, protein powder, snacks) stay separate — never split',
        'Clears supermarket online delivery minimums (£40–£50) as a single house unit',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          {/* Communal items */}
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary">
              <span>🛒 Shared House Items</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10">Split 4 Ways</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface font-medium pt-0.5">
              <span>Fusilli 1kg + Chopped Toms x4</span>
              <span className="font-numeric-data font-bold">£2.55</span>
            </div>
          </div>

          {/* Personal items */}
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-secondary">
              <span>👤 Personal Stash</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-secondary/10">100% You</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface font-medium pt-0.5">
              <span>Oatly Barista 1L + Skyr 450g</span>
              <span className="font-numeric-data font-bold">£3.65</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] font-bold text-on-surface">
            <span className="text-on-surface-variant font-normal">Tesco Minimum Basket:</span>
            <span className="text-primary">£54.20 / £50 ✓ Cleared</span>
          </div>
        </div>
      ),
    },

    // Slide 5: Tesco Automation & 1-Click Cookie Export
    {
      id: 'tesco-automation',
      step: '05 / 09',
      shortLabel: 'Tesco Sync',
      title: '1-Click Tesco Trolley Automation',
      subtitle: 'The collector connects Tesco once using the free Cookie-Editor extension. Grub translates the meal plan into exact grocery items and fills your trolley.',
      badge: 'Automation',
      stockyMood: 'cooking',
      stockyCaption: 'Trolley loaded',
      highlights: [
        'Grub takes the entire flat’s meals and fills the Tesco trolley in seconds',
        'Clubcard discounts and best-value pack sizes applied automatically',
        'Uses free, safe browser cookie export — zero passwords stored',
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

              {/* Live sync preview */}
              <div className="p-2 rounded bg-surface-container-low text-[10px] flex items-center justify-between text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>28 items loaded</span>
                </span>
                <span className="text-primary font-bold">-£4.80 Clubcard Price</span>
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

    // Slide 6: Slot Holding & Delivery Reservation
    {
      id: 'slot-reservation',
      step: '06 / 09',
      shortLabel: 'Delivery',
      title: 'Grub Reserves the Slot For You',
      subtitle: 'Never miss a delivery or carry heavy bags across campus. Grub holds the 1-hour slot when flatmates are home.',
      badge: 'Fulfillment',
      stockyMood: 'asleep',
      stockyCaption: 'Slot held',
      highlights: [
        'Home Delivery or Click & Collect (e.g. Cannon Park pickup)',
        'Grub holds the 1-hour window before cutoff so groceries arrive on schedule',
        'Automatic phone calendar alarms sync 30 minutes before arrival',
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

    // Slide 7: The Substitution Shield (Delivery Check)
    {
      id: 'reconcile',
      step: '07 / 09',
      shortLabel: 'Shield',
      title: 'The Substitution Shield',
      subtitle: 'Did Tesco substitute bloomer for sourdough? Was fresh basil out of stock? A 1-minute delivery check recalculates the split instantly.',
      badge: 'Delivery Shield',
      stockyMood: 'stressed',
      stockyCaption: 'Check bags',
      highlights: [
        '1-minute unpacking check: mark missing or substituted items with one tap',
        'Grub recalculates everyone’s share before a single penny is paid',
        'Nobody pays for missing food or unwanted supermarket swaps',
      ],
      renderIllustration: () => (
        <div className="flex flex-col gap-sm w-full max-w-sm mx-auto p-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-ambient-card animate-fade-in">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-on-surface">
              <span>Unpacking Checklist</span>
              <span className="text-[10px] text-primary font-bold">1-Tap Adjust</span>
            </div>

            {/* Checklist items */}
            <div className="flex flex-col gap-1.5 text-[11px]">
              <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Icon name="check_circle" className="text-primary text-[14px]" />
                  <span>500g Beef Mince</span>
                </span>
                <span className="text-on-surface-variant font-mono">£3.50</span>
              </div>
              <div className="p-2 rounded bg-secondary-fixed/20 border border-secondary-fixed/40 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-on-secondary-fixed">
                  <Icon name="swap_horiz" className="text-secondary text-[14px]" />
                  <span>Oatly ➔ Alpro Oat</span>
                </span>
                <span className="text-secondary font-bold text-[10px]">+20p credited</span>
              </div>
              <div className="p-2 rounded bg-error/10 border border-error/20 flex items-center justify-between text-error">
                <span className="flex items-center gap-1.5 line-through">
                  <Icon name="close" className="text-[14px]" />
                  <span>Fresh Basil 25g</span>
                </span>
                <span className="font-bold text-[10px]">-85p deducted</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-center text-on-surface-variant font-semibold">
            ✓ Arithmetic updated automatically before anyone pays
          </div>
        </div>
      ),
    },

    // Slide 8: Fair Splits & 1-Tap Settle Up (Monzo / Revolut)
    {
      id: 'split',
      step: '08 / 09',
      shortLabel: 'Splits',
      title: 'Penny-Perfect Split & 1-Tap Settle Up',
      subtitle: 'Pay exact pennies via Monzo or Revolut in 1 tap. No spreadsheets, receipt arguments, or chasing housemates.',
      badge: 'Fair Splits',
      stockyMood: 'split',
      stockyCaption: 'Exact pennies',
      highlights: [
        'Split down to the penny for shared meals — never pay for someone else’s snacks',
        '1-tap Monzo & Revolut payment links pre-filled with the exact amount owed',
        'Personal grocery items stay completely separate in the final arithmetic',
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
                4 Meals + Personal Stash
              </span>
            </div>

            {/* 1-Tap Banking Settlement Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-9 px-3 rounded-lg bg-[#FF3B69] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 cursor-pointer">
                <span>Pay Monzo</span>
                <Icon name="arrow_forward" className="text-[13px]" />
              </div>
              <div className="h-9 px-3 rounded-lg bg-[#0075EB] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 cursor-pointer">
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

    // Slide 9: Kitchen Counter Cook Mode & Leftover Fridge
    {
      id: 'kitchen-cook',
      step: '09 / 09',
      shortLabel: 'Cook Mode',
      title: 'Kitchen Counter Cook Mode',
      subtitle: 'Prop your phone by the hob while you cook. Screen wake-lock keeps recipes lit without greasy fingers, and spare portions log to the shared fridge.',
      badge: 'Cook Mode',
      stockyMood: 'cooking',
      stockyCaption: 'Hob ready',
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

  // Enable keyboard left/right navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

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

      {/* Horizontal step category scrubber / chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={clsx(
              'px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer',
              idx === currentSlide
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            )}
          >
            {slide.shortLabel}
          </button>
        ))}
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
                  idx === currentSlide ? 'w-6 bg-primary' : 'w-2 bg-outline-variant/60 hover:bg-outline-variant'
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
