'use client';

import { useState, useRef, useTransition, useActionState } from 'react';
import { Avatar, ACCENT_CLASSES } from '@/components/avatars/Avatar';
import { AvatarGlyph, AVATAR_OPTIONS, parseAvatarUrl, type AvatarId } from '@/components/avatars/AvatarGlyphs';
import { Stocky } from '@/components/mascot/Stocky';
import { DIETS, VIBES, getBudgetTier, parseDietaryPreferences } from '@/lib/dietary';
import { Icon } from '@/components/media/Icon';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Card } from '@/components/ui/Card';
import { clsx } from '@/lib/clsx';
import {
  deleteAccount,
  leaveHouse,
  signOutAction,
  updateDietaryPreferences,
  updatePaymentDetails,
  updateProfileInfo,
  type AccountActionState,
} from '@/app/account/actions';
import type { User } from '@/lib/types';

const INITIAL: AccountActionState = { status: 'idle', message: '' };

const FIELD =
  'w-full px-3 py-3 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-body-lg';

function SaveButton({ label = 'Save' }: { label?: string }) {
  return (
    <SubmitButton icon="check" className="self-start" pendingLabel="Saving…">
      {label}
    </SubmitButton>
  );
}

function Status({ state }: { state: AccountActionState }) {
  if (state.status === 'idle') return null;
  return (
    <p
      role="status"
      className={clsx(
        'font-body-sm text-body-sm',
        state.status === 'error' ? 'text-error' : 'text-primary'
      )}
    >
      {state.message}
    </p>
  );
}

const ACCENT_OPTIONS: { key: User['accent']; label: string; bg: string; text: string }[] = [
  { key: 'green', label: 'Sage Green', bg: 'bg-[#D8F3DC]', text: 'text-[#1B4332]' },
  { key: 'orange', label: 'Honey Amber', bg: 'bg-[#FDECD0]', text: 'text-[#7C4A1E]' },
  { key: 'rust', label: 'Rust', bg: 'bg-[#FCDAD1]', text: 'text-[#8C2D19]' },
  { key: 'blue', label: 'Ocean Blue', bg: 'bg-[#cfe4ff]', text: 'text-[#001d36]' },
  { key: 'purple', label: 'Lavender', bg: 'bg-[#e6ddff]', text: 'text-[#22005d]' },
  { key: 'olive', label: 'Olive', bg: 'bg-[#E5ECD6]', text: 'text-[#2D4519]' },
];

/** Revamped Profile & Avatar Studio Panel. */
export function ProfileInfoPanel({
  user,
  housemates = [],
}: {
  user: User;
  housemates?: User[];
}) {
  const otherHousemates = housemates.filter((h) => h.id !== user.id);
  const [state, action] = useActionState(updateProfileInfo, INITIAL);
  const [selectedAccent, setSelectedAccent] = useState<User['accent']>(user.accent || 'green');
  const [name, setName] = useState<string>(user.name);

  // Parse existing avatar character if set
  const { avatarId: initialAvatarId } = parseAvatarUrl(user.avatarUrl);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId | null>(initialAvatarId);

  // Build effective avatar URL for preview and submission
  const effectiveAvatarUrl = selectedAvatar ? `avatar:${selectedAvatar}` : null;
  const myInitial = (name.trim()[0] || user.name.trim()[0] || 'Y').toUpperCase();

  // Live avatar preview object
  const previewUser = {
    name: name || user.name || 'You',
    accent: selectedAccent,
    avatarUrl: effectiveAvatarUrl,
  };

  const accentClass = ACCENT_CLASSES[selectedAccent] ?? ACCENT_CLASSES.green;

  return (
    <Card id="profile-studio" className="flex flex-col gap-lg interactive-card card-glow">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="font-title-md text-title-md font-bold text-on-surface">Profile & Avatar Studio</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Personalise your avatar and display name shown across rosters and splits.
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-lg">
        {/* Avatar Live Studio Preview */}
        <div className="p-md rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row items-center gap-md">
          <div className="relative">
            <Avatar user={previewUser} size="xl" className="ring-4 ring-primary/20 shadow-md transition-all duration-300" />
          </div>
          <div className="flex flex-col gap-xs text-center sm:text-left min-w-0 flex-1">
            <span className="font-title-md text-body-lg font-bold text-on-surface truncate">
              {name || 'Your Name'}
            </span>
            <span className="font-body-sm text-xs text-on-surface-variant">
              {selectedAvatar
                ? `Using ${AVATAR_OPTIONS.find((o) => o.id === selectedAvatar)?.name} character avatar`
                : `Using ${selectedAccent} color initials (${myInitial})`}
            </span>
            {selectedAvatar && (
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                className="text-xs text-primary font-semibold underline self-center sm:self-start mt-0.5 hover:opacity-80 cursor-pointer"
              >
                Switch to color initials
              </button>
            )}
          </div>
        </div>

        {/* Hidden inputs for accent and avatarUrl */}
        <input type="hidden" name="accent" value={selectedAccent} />
        <input type="hidden" name="avatarUrl" value={effectiveAvatarUrl ?? ''} />

        {/* Avatar Character Picker */}
        <div className="flex flex-col gap-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold tracking-wider">
              Avatar Character
            </span>
            {selectedAvatar && (
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Clear character (use initials)
              </button>
            )}
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {AVATAR_OPTIONS.map((opt) => {
              const isSelected = selectedAvatar === opt.id;
              const takenBy = otherHousemates.find(
                (h) => parseAvatarUrl(h.avatarUrl).avatarId === opt.id
              );

              return (
                <div key={opt.id} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    disabled={Boolean(takenBy)}
                    onClick={() => {
                      if (takenBy) return;
                      setSelectedAvatar(isSelected ? null : opt.id);
                    }}
                    title={
                      takenBy
                        ? `${opt.name} — Taken by ${takenBy.name}`
                        : `${opt.name} (${opt.subtitle})`
                    }
                    className={clsx(
                      'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 relative',
                      takenBy
                        ? 'opacity-35 cursor-not-allowed bg-surface-container-high text-on-surface-variant/40'
                        : isSelected
                        ? `${accentClass} ring-2 ring-primary ring-offset-2 scale-110 shadow-sm cursor-pointer btn-tactile`
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:scale-105 cursor-pointer btn-tactile'
                    )}
                  >
                    <AvatarGlyph id={opt.id} className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] text-center font-medium leading-tight max-w-[56px] truncate">
                    {takenBy ? (
                      <span className="text-error/80" title={`Taken by ${takenBy.name}`}>
                        Taken
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">{opt.name}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <span className="font-body-sm text-[11px] text-on-surface-variant">
            Pick a character or leave unselected for your initials. Each housemate must have a unique character.
          </span>
        </div>

        {/* Avatar Color Accent Palette */}
        <div className="flex flex-col gap-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold tracking-wider">
              Avatar Color Accent
            </span>
            <span className="text-xs text-on-surface-variant">
              Initial &apos;{myInitial}&apos;
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-xs">
            {ACCENT_OPTIONS.map((opt) => {
              const isSelected = selectedAccent === opt.key;
              const takenBy = otherHousemates.find(
                (h) =>
                  h.accent === opt.key &&
                  (h.name.trim()[0] || '').toUpperCase() === myInitial
              );

              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={Boolean(takenBy)}
                  onClick={() => {
                    if (!takenBy) setSelectedAccent(opt.key);
                  }}
                  title={
                    takenBy
                      ? `${opt.label} — Taken by ${takenBy.name} (${myInitial})`
                      : opt.label
                  }
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-xl border transition-all text-left relative',
                    takenBy
                      ? 'opacity-40 cursor-not-allowed border-outline-variant/30 bg-surface-container-lowest'
                      : isSelected
                      ? 'border-primary bg-primary/8 ring-2 ring-primary/30 font-bold shadow-xs cursor-pointer btn-tactile'
                      : 'border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container cursor-pointer btn-tactile'
                  )}
                >
                  <span className={clsx('size-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0', opt.bg, opt.text)}>
                    {myInitial}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-body-sm text-xs text-on-surface truncate">{opt.label}</span>
                    {takenBy && (
                      <span className="text-[9px] text-error font-medium truncate" title={`Taken by ${takenBy.name}`}>
                        Taken by {takenBy.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <span className="font-body-sm text-[11px] text-on-surface-variant">
            Housemates with the same first initial cannot share the same colour accent.
          </span>
        </div>

        {/* Display Name */}
        <label className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold tracking-wider">
            Display name
          </span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
            className={FIELD}
          />
        </label>

        <SaveButton label="Save Profile & Avatar" />
        <Status state={state} />
      </form>
    </Card>
  );
}

/** Log Out Button */
export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await signOutAction();
        });
      }}
      className="w-full h-11 rounded-lg border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container flex items-center justify-center gap-xs transition-colors"
    >
      <Icon name="logout" className="text-sm" />
      {pending ? 'Logging out...' : 'Log Out'}
    </button>
  );
}

/** How housemates pay you. */
export function PaymentDetailsPanel({ user }: { user: User }) {
  const [state, action] = useActionState(updatePaymentDetails, INITIAL);
  const payment = user.payment;

  return (
    <Card className="flex flex-col gap-sm">
      <div className="min-w-0">
        <h2 className="font-title-md text-title-md">Payment details</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Shown to housemates when you are the collector. Separate fields so nobody has to guess
          what a half-filled line means — the app never contacts a bank, it only displays these.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-md">
        <label className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Bank or app
          </span>
          <input
            name="bankName"
            defaultValue={payment.bankName ?? ''}
            placeholder="Monzo"
            className={FIELD}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <label className="flex flex-col gap-xs">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Sort code
            </span>
            <input
              name="sortCode"
              inputMode="numeric"
              maxLength={8}
              defaultValue={payment.sortCode ?? ''}
              placeholder="04-00-04"
              className={`${FIELD} font-numeric-data tracking-wider`}
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Account number
            </span>
            <input
              name="accountNumber"
              inputMode="numeric"
              maxLength={8}
              defaultValue={payment.accountNumber ?? ''}
              placeholder="12345678"
              className={`${FIELD} font-numeric-data tracking-wider`}
            />
          </label>
        </div>
        <span className="font-body-sm text-[12px] text-on-surface-variant -mt-xs">
          Both or neither — one on its own can&apos;t be paid to.
        </span>

        <label className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Payment link or tag
          </span>
          <input
            name="paymentLink"
            defaultValue={payment.link ?? ''}
            placeholder="monzo.me/yourname  ·  revolut.me/yourtag  ·  @yourtag"
            className={FIELD}
          />
          <span className="font-body-sm text-[12px] text-on-surface-variant">
            Optional, and enough on its own if you never use a bank transfer.
          </span>
        </label>

        <label className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Anything else
          </span>
          <input
            name="note"
            maxLength={300}
            defaultValue={payment.note ?? ''}
            placeholder="e.g. reference your name"
            className={FIELD}
          />
        </label>

        <SaveButton />
        <Status state={state} />
      </form>
    </Card>
  );
}

/** Dietary profile and meal habits panel. Synced with onboarding setup. */
export function DietaryPanel({ user }: { user: User }) {
  const [state, action] = useActionState(updateDietaryPreferences, INITIAL);

  const initial = parseDietaryPreferences(user.dietaryPreferences);
  const [budget, setBudget] = useState<number>(initial.budget);
  const [selectedDiets, setSelectedDiets] = useState<string[]>(initial.diets);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(
    initial.vibes.length > 0 ? initial.vibes : ['speedy', 'budget_king']
  );
  const [customAllergies, setCustomAllergies] = useState<string[]>(initial.customAllergies);
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const customAllergyRef = useRef<HTMLInputElement>(null);

  const tier = getBudgetTier(budget);

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

  return (
    <Card className="flex flex-col gap-lg interactive-card card-glow">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="font-title-md text-title-md font-bold text-on-surface">Dietary Profile &amp; Habits</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Visible to the house when planning meals, budgeting, and avoiding allergens.
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-lg">
        {/* Hidden inputs for custom allergies */}
        {customAllergies.map((allergy) => (
          <input key={allergy} type="hidden" name="customAllergy" value={allergy} />
        ))}

        {/* 1. Personal Weekly Budget Slider */}
        <div className="flex flex-col gap-sm p-md rounded-2xl bg-surface-container-low border border-outline-variant/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary font-bold block">
                Personal Weekly Food Target
              </span>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Grub tracks your individual total in Split so you can see if you&apos;re staying on budget.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Stocky mood={tier.mood} tier={tier.tier} size="md" />
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
            max={100}
            step={5}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg cursor-pointer my-2"
          />

          <div className="flex justify-between text-[11px] text-on-surface-variant/70 font-numeric-data font-semibold">
            <span>£10</span>
            <span>£25</span>
            <span>£50</span>
            <span>£75</span>
            <span>£100</span>
          </div>
        </div>

        {/* 2. Diets & Allergies */}
        <div className="flex flex-col gap-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
              Diets &amp; Safety Requirements
            </span>
            <span className="text-xs text-on-surface-variant">Flags meal safety warnings</span>
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
                    className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
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
              placeholder="Add custom allergy (e.g. shellfish, peanuts)"
              className="flex-1 h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 focus:ring-2 focus:ring-primary text-base sm:text-body-sm"
            />
            <button
              type="button"
              onClick={addCustomAllergy}
              disabled={!customAllergyInput.trim()}
              className="h-10 px-3.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-tactile flex items-center gap-1 cursor-pointer"
            >
              <Icon name="add" className="text-[16px]" />
              Add
            </button>
          </div>
        </div>

        {/* 3. Meal Vibes (Pick up to 3) */}
        <div className="flex flex-col gap-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
              Meal Vibes <span className="text-[11px] font-normal lowercase">(pick up to 3)</span>
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              {selectedVibes.length}/3 selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VIBES.map((vibe) => {
              const isSelected = selectedVibes.includes(vibe.id);
              return (
                <label
                  key={vibe.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all select-none btn-tactile',
                    isSelected
                      ? 'border-secondary bg-secondary/10 ring-1 ring-secondary'
                      : 'border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container'
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

        {/* 4. Daily Nutrition Targets (Optional) */}
        <div className="flex flex-col gap-xs pt-xs border-t border-outline/20">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
              <Icon name="local_fire_department" className="text-amber-500 text-sm" />
              Daily Nutrition Targets <span className="text-[11px] font-normal lowercase">(optional)</span>
            </span>
          </div>
          <p className="font-body-xs text-[11px] text-on-surface-variant">
            Set optional calorie and protein goals to see how planned meals fit into your day.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-1">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface">Daily Calories (kcal)</span>
              <input
                type="number"
                name="dailyCalorieTarget"
                defaultValue={user.dailyCalorieTarget ?? ''}
                placeholder="e.g. 2200"
                min="1000"
                max="6000"
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 text-base sm:text-body-sm font-numeric-data"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface">Daily Protein (g)</span>
              <input
                type="number"
                name="dailyProteinTarget"
                defaultValue={user.dailyProteinTarget ?? ''}
                placeholder="e.g. 140"
                min="30"
                max="400"
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 text-base sm:text-body-sm font-numeric-data"
              />
            </label>
          </div>
        </div>

        <SaveButton label="Save Dietary Profile" />
        <Status state={state} />
      </form>
    </Card>
  );
}

/** Leaving the house. */
export function LeaveHousePanel() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function leave() {
    startTransition(async () => {
      const result = await leaveHouse();
      if (result?.status === 'error') {
        setMessage(result.message);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-sm">
      {confirming ? (
        <Card accent="error" className="flex flex-col gap-sm">
          <p className="font-body-sm text-body-sm">
            You&apos;ll be detached from this house&apos;s plans and basket. Money already recorded
            in past splits stays on the ledger — leaving does not settle it. You&apos;d need the
            invite code to come back.
          </p>
          <div className="flex gap-sm">
            <button
              type="button"
              disabled={pending}
              onClick={leave}
              className="flex-1 h-11 rounded-lg bg-error text-on-error font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {pending ? 'Leaving…' : 'Yes, leave'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 h-11 rounded-lg border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full h-12 rounded-lg border border-error text-error font-title-md text-title-md flex items-center justify-center gap-sm hover:bg-error-container transition-colors"
        >
          <Icon name="logout" />
          Leave House
        </button>
      )}

      {message && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {message}
        </p>
      )}
    </div>
  );
}

type DeleteStage = 'idle' | 'account' | 'house';
const SOLID_ERROR = 'bg-error text-on-error border-error hover:opacity-90';

export function DeleteAccountPanel() {
  const [stage, setStage] = useState<DeleteStage>('idle');
  const [houseWarning, setHouseWarning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove(alsoDeleteHouse: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteAccount(alsoDeleteHouse);
      if (result?.status === 'confirm-house') {
        setHouseWarning(result.message);
        setStage('house');
        return;
      }
      if (result?.status === 'error') {
        setMessage(result.message);
        setStage('idle');
      }
    });
  }

  return (
    <div className="flex flex-col gap-sm">
      {stage === 'account' && (
        <Card accent="error" className="flex flex-col gap-sm">
          <p className="font-body-sm text-body-sm">
            This removes your profile, your place on every meal, your pantry items and your
            recipes&apos; authorship. It cannot be undone.
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Your sign-in email itself is held by Supabase and is not deleted from here — using it
            again would start you off with a blank account and no house.
          </p>
          <div className="flex gap-sm">
            <Button
              variant="danger"
              fullWidth
              className={SOLID_ERROR}
              pending={pending}
              pendingLabel="Deleting…"
              onClick={() => remove(false)}
            >
              Yes, delete my account
            </Button>
            <Button variant="outline" fullWidth disabled={pending} onClick={() => setStage('idle')}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {stage === 'house' && (
        <Card accent="error" className="flex flex-col gap-sm">
          <h3 className="font-title-md text-title-md text-error">The house goes with it</h3>
          <p className="font-body-sm text-body-sm">{houseWarning}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Nobody else is in it to hand it to. If you would rather keep it, cancel and invite
            somebody first.
          </p>
          <div className="flex gap-sm">
            <Button
              variant="danger"
              fullWidth
              className={SOLID_ERROR}
              pending={pending}
              pendingLabel="Deleting…"
              onClick={() => remove(true)}
            >
              Delete both
            </Button>
            <Button variant="outline" fullWidth disabled={pending} onClick={() => setStage('idle')}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {stage === 'idle' && (
        <Button variant="danger" size="lg" fullWidth icon="delete_forever" onClick={() => setStage('account')}>
          Delete my account
        </Button>
      )}

      {message && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {message}
        </p>
      )}
    </div>
  );
}
