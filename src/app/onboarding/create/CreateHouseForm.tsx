'use client';

import { useActionState, useState } from 'react';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Icon } from '@/components/media/Icon';
import { WEEKDAYS, WEEKDAY_LABELS } from '@/lib/types';
import { KitchenStudio } from '@/components/onboarding/KitchenStudio';
import { clsx } from '@/lib/clsx';
import { createHouse, type OnboardingState } from '../actions';

const INITIAL: OnboardingState = { status: 'idle', message: '' };

const FIELD =
  'h-12 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 focus:ring-2 focus:ring-primary focus:border-primary text-body-md text-on-surface';

const SUPERMARKETS = [
  {
    id: 'tesco_cannon_park',
    name: 'Tesco Superstore',
    location: 'Cannon Park, Coventry',
    tag: 'Full Automation',
    icon: 'storefront',
  },
  {
    id: 'tesco_leamington',
    name: 'Tesco Superstore',
    location: 'Leamington Spa',
    tag: 'Full Automation',
    icon: 'storefront',
  },
  {
    id: 'aldi_cannon_park',
    name: 'Aldi',
    location: 'Cannon Park / Shires',
    tag: 'Budget Benchmark',
    icon: 'shopping_cart',
  },
];

export function CreateHouseForm() {
  const [state, formAction] = useActionState(createHouse, INITIAL);
  const [houseName, setHouseName] = useState('');
  const [supermarket, setSupermarket] = useState('tesco_cannon_park');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'delivery' | 'collect'>('delivery');
  const [deliveryDay, setDeliveryDay] = useState('mon');
  const [cutoffDay, setCutoffDay] = useState('sun');
  const [cutoffTime, setCutoffTime] = useState('20:00');
  const [appliances, setAppliances] = useState<string[]>([
    'air_fryer',
    'microwave',
    'oven',
    'stovetop_4',
  ]);

  return (
    <form action={formAction} className="flex flex-col gap-lg">
      <input type="hidden" name="supermarket" value={supermarket} />
      <input type="hidden" name="fulfillmentMethod" value={fulfillmentMethod} />
      <input type="hidden" name="appliances" value={appliances.join(',')} />

      {/* 1. House Identity */}
      <div className="flex flex-col gap-md">
        <label className="flex flex-col gap-xs">
          <span className="font-body-sm text-xs font-semibold text-on-surface">
            House / Flat Name <span aria-hidden="true" className="text-error">*</span>
          </span>
          <input
            name="name"
            value={houseName}
            onChange={(e) => setHouseName(e.target.value)}
            required
            aria-required="true"
            maxLength={60}
            placeholder="e.g. Ellesmere Road or Flat 4B"
            className={FIELD}
          />
        </label>
      </div>

      {/* 2. Supermarket Selection */}
      <div className="flex flex-col gap-xs">
        <span className="font-body-sm text-xs font-semibold text-on-surface">
          Where does the flat shop?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SUPERMARKETS.map((market) => {
            const isSelected = supermarket === market.id;
            return (
              <button
                key={market.id}
                type="button"
                onClick={() => setSupermarket(market.id)}
                className={clsx(
                  'p-3 rounded-xl border text-left flex flex-col justify-between transition-all btn-tactile cursor-pointer',
                  isSelected
                    ? 'bg-primary/8 border-primary ring-1 ring-primary/40 shadow-xs'
                    : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon name={market.icon} className={clsx('text-[18px]', isSelected ? 'text-primary' : 'text-on-surface-variant')} />
                  <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded', isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant')}>
                    {market.tag}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="font-title-sm text-xs font-bold text-on-surface leading-tight">{market.name}</p>
                  <p className="font-body-xs text-[10px] text-on-surface-variant mt-0.5">{market.location}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Fulfillment Mode */}
      <div className="flex flex-col gap-xs">
        <span className="font-body-sm text-xs font-semibold text-on-surface">
          Delivery Mode
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFulfillmentMethod('delivery')}
            className={clsx(
              'p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer btn-tactile',
              fulfillmentMethod === 'delivery'
                ? 'bg-primary/8 border-primary ring-1 ring-primary/40 shadow-xs'
                : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50'
            )}
          >
            <Icon name="local_shipping" className={clsx('text-[20px]', fulfillmentMethod === 'delivery' ? 'text-primary' : 'text-on-surface-variant')} />
            <div className="text-left min-w-0">
              <p className="font-title-sm text-xs font-bold text-on-surface">Home Delivery</p>
              <p className="font-body-xs text-[10px] text-on-surface-variant">Van to door</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFulfillmentMethod('collect')}
            className={clsx(
              'p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer btn-tactile',
              fulfillmentMethod === 'collect'
                ? 'bg-primary/8 border-primary ring-1 ring-primary/40 shadow-xs'
                : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50'
            )}
          >
            <Icon name="storefront" className={clsx('text-[20px]', fulfillmentMethod === 'collect' ? 'text-primary' : 'text-on-surface-variant')} />
            <div className="text-left min-w-0">
              <p className="font-title-sm text-xs font-bold text-on-surface">Click &amp; Collect</p>
              <p className="font-body-xs text-[10px] text-on-surface-variant">Cannon Park pickup</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Routine & Cutoff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md p-md rounded-2xl bg-surface-container-low border border-outline-variant/40">
        <label className="flex flex-col gap-xs">
          <span className="font-body-sm text-xs font-semibold text-on-surface">Delivery / Collection Day</span>
          <select name="deliveryDay" value={deliveryDay} onChange={(e) => setDeliveryDay(e.target.value)} className={FIELD}>
            {WEEKDAYS.map((day) => (
              <option key={day} value={day}>
                {WEEKDAY_LABELS[day]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-xs">
            <span className="font-body-sm text-xs font-semibold text-on-surface">Cutoff Day</span>
            <select name="cutoffDay" value={cutoffDay} onChange={(e) => setCutoffDay(e.target.value)} className={FIELD}>
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {WEEKDAY_LABELS[day]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-xs">
            <span className="font-body-sm text-xs font-semibold text-on-surface">Time</span>
            <input
              type="time"
              name="cutoffTime"
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className={`${FIELD} font-numeric-data px-2`}
            />
          </label>
        </div>
      </div>

      {/* 5. Kitchen Appliance Studio */}
      <KitchenStudio selected={appliances} onChange={setAppliances} />

      {state.status === 'error' && (
        <p role="alert" className="font-body-sm text-xs text-error text-center">
          {state.message}
        </p>
      )}

      <SubmitButton variant="secondary" size="lg" fullWidth className="mt-sm" pendingLabel="Setting up flat…">
        Create House &amp; Get Invite Code
      </SubmitButton>
    </form>
  );
}
