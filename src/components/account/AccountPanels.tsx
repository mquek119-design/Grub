'use client';

import { useState, useTransition, useActionState } from 'react';
import { Avatar, ACCENT_CLASSES } from '@/components/avatars/Avatar';
import { AvatarGlyph, AVATAR_OPTIONS, parseAvatarUrl, isAvatarId, type AvatarId } from '@/components/avatars/AvatarGlyphs';
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

const COMMON_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Halal',
  'No pork',
  'Gluten free',
  'Dairy free',
  'Nut allergy',
];

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
export function ProfileInfoPanel({ user }: { user: User }) {
  const [state, action] = useActionState(updateProfileInfo, INITIAL);
  const [selectedAccent, setSelectedAccent] = useState<User['accent']>(user.accent || 'green');
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || '');
  const [name, setName] = useState<string>(user.name);

  // Parse existing avatar character if set
  const { avatarId: initialAvatarId } = parseAvatarUrl(user.avatarUrl);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId | null>(initialAvatarId);

  // Build effective avatar URL for preview and submission
  const effectiveAvatarUrl = selectedAvatar ? `avatar:${selectedAvatar}` : avatarUrl.trim() || null;

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
            Personalise your avatar, display name, and house room shown across rosters and splits.
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-lg">
        {/* Avatar Live Studio Preview */}
        <div className="p-md rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row items-center gap-md">
          <div className="relative group">
            <Avatar user={previewUser} size="xl" className="ring-4 ring-primary/20 shadow-md transition-all duration-300" />
            {previewUser.avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                title="Remove custom photo"
                className="absolute -top-1 -right-1 size-6 rounded-full bg-error text-white grid place-items-center shadow-xs hover:opacity-90 btn-tactile"
              >
                <Icon name="close" className="text-xs" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-xs text-center sm:text-left min-w-0 flex-1">
            <span className="font-title-md text-body-lg font-bold text-on-surface truncate">
              {name || 'Your Name'}
            </span>
            <span className="font-body-sm text-xs text-on-surface-variant">
              {selectedAvatar ? `Using ${AVATAR_OPTIONS.find((o) => o.id === selectedAvatar)?.name} avatar` : previewUser.avatarUrl ? 'Using custom photo URL' : `Using ${selectedAccent} color avatar initials`}
            </span>
            {previewUser.avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="text-xs text-error font-semibold underline self-center sm:self-start mt-0.5 hover:opacity-80"
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
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold tracking-wider">
            Avatar Character
          </span>
          <div className="flex items-center gap-2.5">
            {AVATAR_OPTIONS.map((opt) => {
              const isSelected = selectedAvatar === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(isSelected ? null : opt.id);
                    if (!isSelected) setAvatarUrl('');
                  }}
                  title={`${opt.name} (${opt.subtitle})`}
                  className={clsx(
                    'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer btn-tactile',
                    isSelected
                      ? `${accentClass} ring-2 ring-primary ring-offset-2 scale-110 shadow-sm`
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:scale-105'
                  )}
                >
                  <AvatarGlyph id={opt.id} className="w-5 h-5" />
                </button>
              );
            })}
          </div>
          <span className="font-body-sm text-[11px] text-on-surface-variant">
            Pick a character or leave blank for initials. Characters use your chosen accent colour.
          </span>
        </div>

        {/* Avatar Color Accent Palette */}
        <div className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold tracking-wider">
            Avatar Color Accent
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-xs">
            {ACCENT_OPTIONS.map((opt) => {
              const isSelected = selectedAccent === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedAccent(opt.key)}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-xl border transition-all btn-tactile text-left',
                    isSelected
                      ? 'border-primary bg-primary/8 ring-2 ring-primary/30 font-bold shadow-xs'
                      : 'border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container'
                  )}
                >
                  <span className={clsx('size-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0', opt.bg, opt.text)}>
                    {(name || 'Y')[0]?.toUpperCase()}
                  </span>
                  <span className="font-body-sm text-xs text-on-surface truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Avatar Photo URL */}
        <label className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold tracking-wider">
            Custom Photo URL (Optional)
          </span>
          <div className="relative">
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              className={FIELD}
            />
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                aria-label="Clear photo URL"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors"
              >
                <Icon name="close" className="text-sm" />
              </button>
            )}
          </div>
          <span className="font-body-sm text-[12px] text-on-surface-variant">
            Paste a public image link or GitHub avatar URL. Leave blank to use your chosen color initials.
          </span>
        </label>

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

        {/* Room Number */}
        <label className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold tracking-wider">
            Room number / name (optional)
          </span>
          <input
            name="room"
            defaultValue={user.room ?? ''}
            placeholder="e.g. 4B or N/A"
            className={FIELD}
          />
          <span className="font-body-sm text-[12px] text-on-surface-variant">
            Type room number or &quot;N/A&quot; / leave blank if you have no room number.
          </span>
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

/** Dietary preferences. The same field the Plan tab writes. */
export function DietaryPanel({ user }: { user: User }) {
  const [state, action] = useActionState(updateDietaryPreferences, INITIAL);
  const custom = user.dietaryPreferences.filter((p) => !COMMON_PREFERENCES.includes(p));

  return (
    <Card className="flex flex-col gap-sm">
      <div className="min-w-0">
        <h2 className="font-title-md text-title-md">Dietary profile</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Visible to the house when planning meals, so nobody cooks something you can&apos;t eat.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-md">
        <div className="flex flex-wrap gap-sm">
          {COMMON_PREFERENCES.map((preference) => (
            <label
              key={preference}
              className={clsx(
                'px-md py-sm rounded-full border flex items-center gap-xs text-[14px] font-semibold cursor-pointer transition-colors',
                'has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary',
                'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <input
                type="checkbox"
                name="preference"
                value={preference}
                defaultChecked={user.dietaryPreferences.includes(preference)}
                className="sr-only"
              />
              {preference}
            </label>
          ))}
        </div>

        <label className="flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Anything else
          </span>
          <input
            name="custom"
            defaultValue={custom.join(', ')}
            placeholder="Comma separated, e.g. no shellfish"
            className={FIELD}
          />
        </label>

        <SaveButton label="Save profile" />
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
