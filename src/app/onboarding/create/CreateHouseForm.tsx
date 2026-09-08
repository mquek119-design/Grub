'use client';

import { useActionState, useState } from 'react';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Icon } from '@/components/media/Icon';
import { WEEKDAYS, WEEKDAY_LABELS } from '@/lib/types';
import { KitchenScene, KITCHEN_APPLIANCES } from '@/components/onboarding/KitchenScene';
import { clsx } from '@/lib/clsx';
import { createHouse, type OnboardingState } from '../actions';

const INITIAL: OnboardingState = { status: 'idle', message: '' };
const TOTAL_STEPS = 4;

const FIELD =
  'h-12 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 focus:ring-2 focus:ring-primary focus:border-primary text-body-md text-on-surface';

const SUPERMARKETS = [
  {
    id: 'tesco_cannon_park',
    name: 'Tesco Superstore',
    location: 'Cannon Park, Coventry',
    tag: 'Full Automation',
    colour: '#00539F',
    stripes: ['#EE1C2E', '#00539F', '#EE1C2E'],
  },
  {
    id: 'tesco_leamington',
    name: 'Tesco Superstore',
    location: 'Leamington Spa',
    tag: 'Full Automation',
    colour: '#00539F',
    stripes: ['#EE1C2E', '#00539F', '#EE1C2E'],
  },
  {
    id: 'aldi_cannon_park',
    name: 'Aldi',
    location: 'Cannon Park / Shires',
    tag: 'Coming Soon',
    colour: '#081E3F',
    stripes: ['#00A3E0', '#FFB300', '#DE2A27'],
    comingSoon: true,
  },
];

/** Tesco-inspired grocery bag logo — adapted, not a direct copy */
function TescoInspiredLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Shopping bag outline */}
      <path
        d="M8 10h20l-2 22H10L8 10z"
        fill="#F5F5F5"
        stroke="#00539F"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Bag handle */}
      <path
        d="M14 10V6a4 4 0 0 1 8 0v4"
        fill="none"
        stroke="#00539F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Red-blue-red stripes across bag */}
      <rect x="10" y="16" width="16" height="3" rx="0.5" fill="#EE1C2E" />
      <rect x="10.5" y="21" width="15" height="3" rx="0.5" fill="#00539F" />
      <rect x="11" y="26" width="14" height="3" rx="0.5" fill="#EE1C2E" />
    </svg>
  );
}

/** Aldi-inspired logo — adapted geometric ribbon abstraction */
function AldiInspiredLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer rounded container with deep navy background */}
      <rect
        x="3"
        y="2"
        width="30"
        height="32"
        rx="4.5"
        fill="#081E3F"
        stroke="#00A3E0"
        strokeWidth="1"
      />

      {/* Characteristic concentric inner border trim in yellow and red */}
      <rect
        x="4.8"
        y="3.8"
        width="26.4"
        height="28.4"
        rx="3"
        fill="none"
        stroke="#FFB300"
        strokeWidth="0.9"
      />
      <rect
        x="6.2"
        y="5.2"
        width="23.6"
        height="25.6"
        rx="2"
        fill="none"
        stroke="#DE2A27"
        strokeWidth="0.8"
      />

      {/* Iconic Aldi 3-band curved ribbon 'A' motif */}
      {/* Outer cyan band */}
      <path
        d="M11 25.5 C11 18, 14.5 10, 20.5 8"
        fill="none"
        stroke="#00A3E0"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Middle electric blue band */}
      <path
        d="M13.5 25.5 C13.5 19.5, 16 13, 20.5 11"
        fill="none"
        stroke="#1E88E5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Inner deep navy-blue band */}
      <path
        d="M16 25.5 C16 22, 17.5 16, 20.5 14"
        fill="none"
        stroke="#283593"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Right diagonal leg of the 'A' */}
      <path
        d="M20.5 8 L25.5 25.5"
        fill="none"
        stroke="#00A3E0"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Signature warm crossbars in red and golden yellow */}
      <rect x="13" y="19" width="10" height="1.8" rx="0.9" fill="#DE2A27" />
      <rect x="14" y="22" width="8.5" height="1.6" rx="0.8" fill="#FFB300" />
    </svg>
  );
}

function StoreIcon({ storeId, className }: { storeId: string; className?: string }) {
  if (storeId.startsWith('tesco')) return <TescoInspiredLogo className={className} />;
  if (storeId.startsWith('aldi')) return <AldiInspiredLogo className={className} />;
  return <Icon name="storefront" className={clsx('text-[28px]', className)} />;
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between">
        <span className="font-body-sm text-[11px] font-semibold text-on-surface-variant">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="font-numeric-data text-[11px] font-bold text-primary">
          {Math.round((step / TOTAL_STEPS) * 100)}%
        </span>
      </div>
      <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function CreateHouseForm() {
  const [state, formAction] = useActionState(createHouse, INITIAL);
  const [step, setStep] = useState(1);

  // Form state
  const [houseName, setHouseName] = useState('');
  const [supermarket, setSupermarket] = useState('tesco_cannon_park');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'delivery' | 'collect'>('delivery');
  const [deliveryDay, setDeliveryDay] = useState('mon');
  const [cutoffDay, setCutoffDay] = useState('sun');
  const [cutoffTime, setCutoffTime] = useState('20:00');
  const [appliances, setAppliances] = useState<string[]>([
    'oven',
    'stovetop_4',
  ]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return houseName.trim().length >= 1;
      case 2:
        return !!supermarket && !SUPERMARKETS.find((m) => m.id === supermarket)?.comingSoon;
      case 3:
        return true;
      case 4:
        return appliances.length > 0;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (step < TOTAL_STEPS && canProceed()) {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-lg min-h-[60vh]">
      <input type="hidden" name="supermarket" value={supermarket} />
      <input type="hidden" name="fulfillmentMethod" value={fulfillmentMethod} />
      <input type="hidden" name="appliances" value={appliances.join(',')} />

      <ProgressBar step={step} />

      {/* Step Content */}
      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="flex flex-col gap-lg animate-fade-in-up">
            <div className="flex flex-col gap-sm pt-lg text-center">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto">
                <Icon name="home" className="text-[32px]" />
              </span>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                What&apos;s your house called?
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">
                This is what your housemates will see when they join. You can change it later.
              </p>
            </div>

            <label className="flex flex-col gap-xs">
              <span className="font-body-sm text-xs font-semibold text-on-surface sr-only">
                House / Flat Name
              </span>
              <input
                name="name"
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                required
                aria-required="true"
                maxLength={60}
                autoFocus
                placeholder="e.g. Ellesmere Road or Flat 4B"
                className="h-14 px-4 rounded-2xl bg-surface-container-lowest border-2 border-outline-variant/60 focus:ring-2 focus:ring-primary focus:border-primary text-body-lg text-on-surface text-center font-semibold text-[18px]"
              />
              <span className="font-body-xs text-[11px] text-on-surface-variant text-center">
                {houseName.length}/60 characters
              </span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-lg animate-fade-in-up">
            <div className="flex flex-col gap-sm text-center">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto">
                <Icon name="shopping_cart" className="text-[32px]" />
              </span>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Where does the flat shop?
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">
                Grub connects to your chosen store to automate the weekly shop.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {SUPERMARKETS.map((market) => {
                const isSelected = supermarket === market.id;
                const isComingSoon = market.comingSoon;
                return (
                  <div key={market.id} className="flex flex-col">
                    <button
                      type="button"
                      disabled={isComingSoon}
                      onClick={() => !isComingSoon && setSupermarket(market.id)}
                      className={clsx(
                        'p-4 rounded-2xl border text-left flex items-center gap-4 transition-all',
                        isComingSoon
                          ? 'bg-surface-container-lowest/60 border-dashed border-outline-variant/60 cursor-not-allowed opacity-90'
                          : isSelected
                            ? 'bg-primary/8 border-primary ring-2 ring-primary/30 shadow-sm cursor-pointer btn-tactile'
                            : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50 cursor-pointer btn-tactile'
                      )}
                    >
                      <StoreIcon storeId={market.id} className="w-10 h-10 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-title-sm text-sm font-bold text-on-surface leading-tight">
                            {market.name}
                          </p>
                          {isComingSoon && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="font-body-xs text-[11px] text-on-surface-variant mt-0.5">
                          {market.location}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          'text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap',
                          isComingSoon
                            ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
                            : isSelected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container text-on-surface-variant'
                        )}
                      >
                        {isComingSoon ? 'Budget Benchmark' : market.tag}
                      </span>
                    </button>

                    {/* Explanatory callout for Aldi budget benchmark */}
                    {isComingSoon && (
                      <div className="mt-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                        <Icon name="trending_down" className="text-[18px] text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                          <p className="font-body-sm text-xs text-on-surface font-bold">
                            Why is Aldi our Budget Benchmark?
                          </p>
                          <p className="font-body-xs text-[11px] text-on-surface-variant leading-relaxed">
                            Aldi does not offer nationwide grocery home delivery in the UK, but consistently sets the gold standard for student grocery affordability. Grub indexes Aldi prices as our baseline benchmark so your flat always sees how recipes compare to the lowest market price.
                          </p>
                          <p className="font-body-xs text-[10px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                            Direct in-store shopping list sync &amp; Click + Collect integration coming soon! Choose Tesco above for automated slot booking &amp; delivery today.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Minimum spend & delivery info callout */}
            <div className="p-3.5 rounded-xl bg-secondary-fixed/20 border border-secondary/20 flex items-start gap-2.5">
              <Icon name="info" className="text-[18px] text-secondary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="font-body-sm text-xs text-on-surface font-semibold">
                  Good to know
                </p>
                <ul className="font-body-xs text-[11px] text-on-surface-variant space-y-0.5 list-disc list-inside">
                  <li>
                    <strong>Click &amp; Collect:</strong> Free over £25 minimum spend
                  </li>
                  <li>
                    <strong>Home Delivery:</strong> From £4.49 — varies by time slot
                  </li>
                  <li>
                    Grub pools your house into one order so hitting the minimum is easy
                  </li>
                </ul>
                <p className="font-body-xs text-[10px] text-on-surface-variant/70 mt-1">
                  You can change store later in House Settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (() => {
          const selectedStore = SUPERMARKETS.find((m) => m.id === supermarket) ?? SUPERMARKETS[0];
          const shortLocation = selectedStore.location.split(',')[0].trim();

          return (
            <div className="flex flex-col gap-lg animate-fade-in-up">
              <div className="flex flex-col gap-sm text-center">
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto">
                  <Icon name="local_shipping" className="text-[32px]" />
                </span>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Delivery or Collect?
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">
                  Choose how you get your weekly shop. Grub can book the slot for you.
                </p>

                {/* Linked store pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 mx-auto text-xs text-on-surface mt-1">
                  <StoreIcon storeId={selectedStore.id} className="w-4 h-4 shrink-0" />
                  <span>
                    Linked store: <strong>{selectedStore.name} ({selectedStore.location})</strong>
                  </span>
                </div>
              </div>

              {/* Fulfillment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('delivery')}
                  className={clsx(
                    'p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer btn-tactile',
                    fulfillmentMethod === 'delivery'
                      ? 'bg-primary/8 border-primary ring-2 ring-primary/30 shadow-sm'
                      : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50'
                  )}
                >
                  <span
                    className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                      fulfillmentMethod === 'delivery' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                    )}
                  >
                    <Icon name="local_shipping" className="text-[24px]" />
                  </span>
                  <div className="text-center">
                    <p className="font-title-sm text-xs font-bold text-on-surface">Home Delivery</p>
                    <p className="font-body-xs text-[10px] text-on-surface-variant mt-0.5">
                      Van from {shortLocation}
                    </p>
                    <p className="font-body-xs text-[9px] text-on-surface-variant/70 mt-1">From £4.49</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('collect')}
                  className={clsx(
                    'p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer btn-tactile',
                    fulfillmentMethod === 'collect'
                      ? 'bg-primary/8 border-primary ring-2 ring-primary/30 shadow-sm'
                      : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50'
                  )}
                >
                  <span
                    className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                      fulfillmentMethod === 'collect' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                    )}
                  >
                    <Icon name="storefront" className="text-[24px]" />
                  </span>
                  <div className="text-center">
                    <p className="font-title-sm text-xs font-bold text-on-surface">Click &amp; Collect</p>
                    <p className="font-body-xs text-[10px] text-on-surface-variant mt-0.5">
                      {shortLocation} pickup
                    </p>
                    <p className="font-body-xs text-[9px] text-on-surface-variant/70 mt-1">Free over £25</p>
                  </div>
                </button>
              </div>

              {/* Schedule */}
              <div className="flex flex-col gap-md p-lg rounded-2xl bg-surface-container-low border border-outline-variant/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-title-sm text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Icon name="schedule" className="text-[16px] text-primary" />
                    Weekly Schedule
                  </h3>
                  <span className="font-body-xs text-[10px] text-on-surface-variant">
                    {fulfillmentMethod === 'delivery'
                      ? `Delivery from ${shortLocation}`
                      : `Collect at ${shortLocation}`}
                  </span>
                </div>

                <label className="flex flex-col gap-xs">
                  <span className="font-body-sm text-xs font-semibold text-on-surface">
                    {fulfillmentMethod === 'delivery' ? 'Delivery' : 'Collection'} Day
                  </span>
                  <select name="deliveryDay" value={deliveryDay} onChange={(e) => setDeliveryDay(e.target.value)} className={FIELD}>
                    {WEEKDAYS.map((day) => (
                      <option key={day} value={day}>
                        {WEEKDAY_LABELS[day]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-xs">
                    <span className="font-body-sm text-xs font-semibold text-on-surface">Plan Cutoff Day</span>
                    <select name="cutoffDay" value={cutoffDay} onChange={(e) => setCutoffDay(e.target.value)} className={FIELD}>
                      {WEEKDAYS.map((day) => (
                        <option key={day} value={day}>
                          {WEEKDAY_LABELS[day]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-xs">
                    <span className="font-body-sm text-xs font-semibold text-on-surface">Cutoff Time</span>
                    <input
                      type="time"
                      name="cutoffTime"
                      value={cutoffTime}
                      onChange={(e) => setCutoffTime(e.target.value)}
                      className={`${FIELD} font-numeric-data px-2`}
                    />
                  </label>
                </div>

                <p className="font-body-xs text-[10px] text-on-surface-variant leading-relaxed">
                  After the cutoff, the weekly plan locks and Grub builds the basket. Everyone needs to have their meals picked before then.
                </p>

                <div className="flex items-start gap-2 pt-1 border-t border-outline-variant/30">
                  <Icon name="edit_calendar" className="text-[15px] text-primary shrink-0 mt-0.5" />
                  <p className="font-body-xs text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>Flexible schedule:</strong> You can change your delivery day, cutoff time, or fulfillment method anytime in <strong>House Settings</strong>.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {step === 4 && (
          <div className="flex flex-col gap-lg animate-fade-in-up">
            <div className="flex flex-col gap-sm text-center">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto">
                <Icon name="kitchen" className="text-[32px]" />
              </span>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                What&apos;s in the kitchen?
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">
                Tap the appliances your flat has. Grub filters recipes to what you can cook.
              </p>
            </div>

            <KitchenScene selected={appliances} onChange={setAppliances} />
          </div>
        )}
      </div>

      {state.status === 'error' && (
        <p role="alert" className="font-body-sm text-xs text-error text-center">
          {state.message}
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-sm">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="h-12 px-5 rounded-xl border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container transition-colors flex items-center gap-1.5 btn-tactile"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Back
          </button>
        )}

        <div className="flex-1" />

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className={clsx(
              'h-12 px-6 rounded-xl font-semibold flex items-center gap-1.5 transition-all btn-tactile',
              canProceed()
                ? 'bg-secondary-container text-on-secondary hover:bg-secondary shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed'
            )}
          >
            Next
            <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        ) : (
          <SubmitButton
            variant="secondary"
            size="lg"
            className="flex-1 sm:flex-initial"
            pendingLabel="Setting up flat…"
          >
            Create House ({appliances.length} {appliances.length === 1 ? 'appliance' : 'appliances'})
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
