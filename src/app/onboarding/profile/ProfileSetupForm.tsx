'use client';

import { useActionState, useState } from 'react';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';
import { saveProfilePreferences, type OnboardingState } from '../actions';

const INITIAL: OnboardingState = { status: 'idle', message: '' };

const DIETS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: 'eco' },
  { id: 'vegan', label: 'Vegan', icon: 'spa' },
  { id: 'pescatarian', label: 'Pescatarian', icon: 'set_meal' },
  { id: 'halal', label: 'Halal', icon: 'verified' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: 'grain' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: 'water_drop' },
  { id: 'nut_allergy', label: 'Nut Allergy', icon: 'warning' },
];

const VIBES = [
  { id: 'speedy', label: 'Speedy (<20m)', hint: 'Quick lecture-night fuel', icon: 'bolt' },
  { id: 'high_protein', label: 'High Protein', hint: 'Gym staples & clean gains', icon: 'fitness_center' },
  { id: 'budget_king', label: 'Budget King (<£1.50)', hint: 'Pasta bakes & dahl', icon: 'savings' },
  { id: 'fakeaway', label: 'Fakeaway Night', hint: 'Curry, burgers & stir-fry', icon: 'takeout_dining' },
  { id: 'comfort_food', label: 'Comfort Food', hint: 'Sunday roast & stews', icon: 'soup_kitchen' },
];

const ACCENTS = [
  { id: 'green', label: 'Sage', bg: 'bg-[#2D6A4F]', border: 'border-[#2D6A4F]' },
  { id: 'orange', label: 'Amber', bg: 'bg-[#D97706]', border: 'border-[#D97706]' },
  { id: 'blue', label: 'Ocean', bg: 'bg-[#2563EB]', border: 'border-[#2563EB]' },
  { id: 'purple', label: 'Lavender', bg: 'bg-[#7C3AED]', border: 'border-[#7C3AED]' },
];

export function ProfileSetupForm({ defaultName = '' }: { defaultName?: string }) {
  const [state, formAction] = useActionState(saveProfilePreferences, INITIAL);
  const [name, setName] = useState(defaultName);
  const [accent, setAccent] = useState('green');
  const [budget, setBudget] = useState(30);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(['speedy', 'budget_king']);

  const toggleDiet = (id: string) => {
    setSelectedDiets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleVibe = (id: string) => {
    if (selectedVibes.includes(id)) {
      setSelectedVibes((prev) => prev.filter((x) => x !== id));
    } else {
      if (selectedVibes.length >= 3) {
        setSelectedVibes((prev) => [...prev.slice(1), id]);
      } else {
        setSelectedVibes((prev) => [...prev, id]);
      }
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-xl">
      {/* 1. Identity */}
      <div className="flex flex-col gap-md">
        <h2 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
          1. Your Details
        </h2>

        <label className="flex flex-col gap-xs">
          <span className="font-body-sm text-xs font-semibold text-on-surface">
            Preferred Name <span className="text-error">*</span>
          </span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Maya"
            className="h-12 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 focus:ring-2 focus:ring-primary text-body-md"
          />
        </label>

        {/* Avatar Color Accent */}
        <div className="flex flex-col gap-xs pt-1">
          <span className="font-body-sm text-xs font-semibold text-on-surface-variant">
            Avatar Colour Palette
          </span>
          <div className="flex items-center gap-3">
            {ACCENTS.map((item) => (
              <label
                key={item.id}
                className={clsx(
                  'w-9 h-9 rounded-full cursor-pointer flex items-center justify-center transition-all',
                  item.bg,
                  accent === item.id ? 'ring-3 ring-primary ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                )}
              >
                <input
                  type="radio"
                  name="accent"
                  value={item.id}
                  checked={accent === item.id}
                  onChange={() => setAccent(item.id)}
                  className="sr-only"
                />
                {accent === item.id && <Icon name="check" className="text-white text-[16px]" />}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Personal Weekly Budget Slider */}
      <div className="flex flex-col gap-sm p-lg rounded-2xl bg-surface-container-low border border-outline-variant/40">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary font-bold">
            2. Personal Weekly Food Target
          </span>
          <span className="font-numeric-data text-title-md font-extrabold text-primary">
            £{budget}/week
          </span>
        </div>

        <p className="font-body-sm text-xs text-on-surface-variant">
          Grub tracks your individual total in Split so you can see if you&apos;re staying on budget.
        </p>

        <input
          type="range"
          name="budget"
          min={20}
          max={60}
          step={5}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg cursor-pointer my-2"
        />

        <div className="flex justify-between text-[11px] text-on-surface-variant/70 font-numeric-data font-semibold">
          <span>£20 (Frugal)</span>
          <span>£35 (Average)</span>
          <span>£60+ (Gym / High Protein)</span>
        </div>
      </div>

      {/* 3. Diets & Allergies */}
      <div className="flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
            3. Diets &amp; Allergies
          </h2>
          <span className="text-xs text-on-surface-variant">Flags safety warnings on meals</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DIETS.map((diet) => {
            const isSelected = selectedDiets.includes(diet.id);
            return (
              <label
                key={diet.id}
                className={clsx(
                  'px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all btn-tactile select-none',
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-outline-variant/50'
                )}
              >
                <input
                  type="checkbox"
                  name="diet"
                  value={diet.id}
                  checked={isSelected}
                  onChange={() => toggleDiet(diet.id)}
                  className="sr-only"
                />
                <Icon name={diet.icon} className="text-[15px]" />
                <span>{diet.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Meal Vibes (Pick up to 3) */}
      <div className="flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
            4. Dinner Vibes (Pick up to 3)
          </h2>
          <span className="text-xs font-bold text-primary font-numeric-data">
            {selectedVibes.length}/3
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VIBES.map((vibe) => {
            const isSelected = selectedVibes.includes(vibe.id);
            return (
              <label
                key={vibe.id}
                className={clsx(
                  'p-3 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all btn-tactile select-none',
                  isSelected
                    ? 'bg-secondary-fixed/30 border-secondary shadow-xs'
                    : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50'
                )}
              >
                <input
                  type="checkbox"
                  name="vibe"
                  value={vibe.id}
                  checked={isSelected}
                  onChange={() => toggleVibe(vibe.id)}
                  className="sr-only"
                />
                <span
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'
                  )}
                >
                  <Icon name={vibe.icon} className="text-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-title-sm text-xs font-bold text-on-surface leading-tight">
                    {vibe.label}
                  </p>
                  <p className="font-body-xs text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                    {vibe.hint}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {state.status === 'error' && (
        <p role="alert" className="font-body-sm text-xs text-error text-center">
          {state.message}
        </p>
      )}

      <SubmitButton
        variant="secondary"
        size="lg"
        fullWidth
        icon="check_circle"
        pendingLabel="Saving profile…"
      >
        Complete Setup &amp; Enter Flat
      </SubmitButton>
    </form>
  );
}
