'use client';

import { useActionState, useState, useRef } from 'react';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';
import { Stocky } from '@/components/mascot/Stocky';
import { AvatarGlyph, AVATAR_OPTIONS, type AvatarId } from '@/components/avatars/AvatarGlyphs';
import { ACCENT_CLASSES } from '@/components/avatars/Avatar';
import { saveProfilePreferences, type OnboardingState } from '../actions';
import type { User } from '@/lib/types';

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

const ACCENTS: { id: User['accent']; label: string; bg: string }[] = [
  { id: 'green', label: 'Sage', bg: 'bg-[#2D6A4F]' },
  { id: 'orange', label: 'Amber', bg: 'bg-[#D97706]' },
  { id: 'rust', label: 'Rust', bg: 'bg-[#C2593F]' },
  { id: 'blue', label: 'Ocean', bg: 'bg-[#2563EB]' },
  { id: 'purple', label: 'Lavender', bg: 'bg-[#7C3AED]' },
  { id: 'olive', label: 'Olive', bg: 'bg-[#4A6B3E]' },
];

function getBudgetTier(budget: number) {
  if (budget <= 25) return { mood: 'smug' as const, label: 'Frugal tier' };
  if (budget <= 45) return { mood: 'neutral' as const, label: 'Average tier' };
  if (budget <= 80) return { mood: 'cooking' as const, label: 'Gym / High protein' };
  return { mood: 'cooking' as const, label: 'Premium tier' };
}

export function ProfileSetupForm({ defaultName = '' }: { defaultName?: string }) {
  const [state, formAction] = useActionState(saveProfilePreferences, INITIAL);
  const [name, setName] = useState(defaultName);
  const [accent, setAccent] = useState<User['accent']>('green');
  const [avatar, setAvatar] = useState<AvatarId | null>(null);
  const [budget, setBudget] = useState(30);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>(['speedy', 'budget_king']);
  const customAllergyRef = useRef<HTMLInputElement>(null);

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

  const addCustomAllergy = () => {
    const val = customAllergyInput.trim();
    if (val && !customAllergies.includes(val.toLowerCase())) {
      setCustomAllergies((prev) => [...prev, val.toLowerCase()]);
      setCustomAllergyInput('');
      customAllergyRef.current?.focus();
    }
  };

  const removeCustomAllergy = (allergy: string) => {
    setCustomAllergies((prev) => prev.filter((x) => x !== allergy));
  };

  const accentClass = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.green;
  const tier = getBudgetTier(budget);

  return (
    <form action={formAction} className="flex flex-col gap-xl">
      {/* Hidden inputs for avatar */}
      {avatar && <input type="hidden" name="avatar" value={avatar} />}
      {/* Hidden inputs for custom allergies */}
      {customAllergies.map((allergy) => (
        <input key={allergy} type="hidden" name="diet" value={`allergy:${allergy}`} />
      ))}

      {/* 1. Identity & Avatar */}
      <div className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h2 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
            1. Your Details
          </h2>
          <Stocky mood="neutral" size="sm" caption="Profile" />
        </div>

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

        {/* Avatar Character Picker */}
        <div className="flex flex-col gap-xs pt-1">
          <span className="font-body-sm text-xs font-semibold text-on-surface-variant">
            Choose Your Avatar
          </span>
          <div className="flex items-center gap-3">
            {AVATAR_OPTIONS.map((opt) => {
              const isSelected = avatar === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatar(isSelected ? null : opt.id)}
                  title={`${opt.name} (${opt.subtitle})`}
                  className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer',
                    isSelected
                      ? `${accentClass} ring-3 ring-primary ring-offset-2 scale-110 shadow-sm`
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:scale-105'
                  )}
                >
                  <AvatarGlyph id={opt.id} className="w-6 h-6" />
                </button>
              );
            })}
          </div>
          {avatar && (
            <span className="font-body-xs text-[10px] text-on-surface-variant">
              {AVATAR_OPTIONS.find((o) => o.id === avatar)?.name} — {AVATAR_OPTIONS.find((o) => o.id === avatar)?.subtitle}
            </span>
          )}
        </div>

        {/* Avatar Colour Accent */}
        <div className="flex flex-col gap-xs pt-1">
          <span className="font-body-sm text-xs font-semibold text-on-surface-variant">
            Avatar Colour
          </span>
          <div className="flex items-center gap-2.5">
            {ACCENTS.map((item) => (
              <label
                key={item.id}
                title={item.label}
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary font-bold block">
              2. Personal Weekly Food Target
            </span>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Grub tracks your individual total in Split so you can see if you&apos;re staying on budget.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Stocky
              mood={tier.mood}
              size="sm"
            />
            <div className="flex flex-col items-end">
              <span className="font-numeric-data text-title-md font-extrabold text-primary leading-tight">
                £{budget}/week
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">
                {tier.label}
              </span>
            </div>
          </div>
        </div>

        <input
          type="range"
          name="budget"
          min={10}
          max={200}
          step={5}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg cursor-pointer my-2"
        />

        <div className="flex justify-between text-[11px] text-on-surface-variant/70 font-numeric-data font-semibold">
          <span>£10</span>
          <span>£35</span>
          <span>£60</span>
          <span>£100</span>
          <span>£200</span>
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

        {/* Custom allergies */}
        {customAllergies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {customAllergies.map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-error/10 text-error text-[11px] font-semibold border border-error/20"
              >
                <Icon name="warning" className="text-[12px]" />
                {allergy}
                <button
                  type="button"
                  onClick={() => removeCustomAllergy(allergy)}
                  className="ml-0.5 hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${allergy}`}
                >
                  <Icon name="close" className="text-[12px]" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input
            ref={customAllergyRef}
            type="text"
            value={customAllergyInput}
            onChange={(e) => setCustomAllergyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomAllergy();
              }
            }}
            placeholder="Add custom allergy (e.g. shellfish)"
            className="flex-1 h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 focus:ring-2 focus:ring-primary text-body-sm text-[13px]"
          />
          <button
            type="button"
            onClick={addCustomAllergy}
            disabled={!customAllergyInput.trim()}
            className="h-10 px-3.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-tactile flex items-center gap-1"
          >
            <Icon name="add" className="text-[16px]" />
            Add
          </button>
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
