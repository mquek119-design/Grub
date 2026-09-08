'use client';

import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';

interface NutritionPillProps {
  calories?: number | null;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatGrams?: number | null;
  variant?: 'compact' | 'detailed' | 'bar';
  className?: string;
}

/**
 * Reusable nutrition badge displaying per-portion calories and macros.
 */
export function NutritionPill({
  calories,
  proteinGrams,
  carbsGrams,
  fatGrams,
  variant = 'compact',
  className,
}: NutritionPillProps) {
  if (!calories && !proteinGrams) return null;

  if (variant === 'bar') {
    return (
      <div
        className={clsx(
          'flex flex-wrap items-center gap-xs text-xs font-semibold py-1 px-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30',
          className
        )}
      >
        {calories !== undefined && calories !== null && (
          <span className="flex items-center gap-1 text-primary">
            <Icon name="local_fire_department" className="text-[14px] text-amber-500" />
            <strong className="font-numeric-data">{calories}</strong> kcal
          </span>
        )}
        {proteinGrams !== undefined && proteinGrams !== null && (
          <>
            <span className="text-outline-variant/50">•</span>
            <span className="flex items-center gap-1 text-on-surface">
              <span className="text-[11px] font-bold text-secondary">P:</span>
              <strong className="font-numeric-data">{proteinGrams}g</strong>
            </span>
          </>
        )}
        {carbsGrams !== undefined && carbsGrams !== null && (
          <>
            <span className="text-outline-variant/50">•</span>
            <span className="flex items-center gap-1 text-on-surface-variant">
              <span className="text-[11px] font-bold">C:</span>
              <span className="font-numeric-data">{carbsGrams}g</span>
            </span>
          </>
        )}
        {fatGrams !== undefined && fatGrams !== null && (
          <>
            <span className="text-outline-variant/50">•</span>
            <span className="flex items-center gap-1 text-on-surface-variant">
              <span className="text-[11px] font-bold">F:</span>
              <span className="font-numeric-data">{fatGrams}g</span>
            </span>
          </>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={clsx('flex flex-col gap-1.5 p-sm rounded-2xl bg-surface-container-low border border-outline-variant/40', className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-bold text-on-surface">
            <Icon name="local_fire_department" className="text-[16px] text-amber-500" />
            <span className="font-numeric-data text-sm text-primary">{calories ?? '--'}</span> kcal / portion
          </span>
          {proteinGrams && (
            <span className="font-semibold text-secondary font-numeric-data text-xs">
              {proteinGrams}g protein
            </span>
          )}
        </div>

        {(carbsGrams || fatGrams) && (
          <div className="flex items-center gap-md pt-1 border-t border-outline/20 text-[11px] text-on-surface-variant font-medium">
            {carbsGrams && (
              <span>Carbs: <strong className="font-numeric-data text-on-surface">{carbsGrams}g</strong></span>
            )}
            {fatGrams && (
              <span>Fat: <strong className="font-numeric-data text-on-surface">{fatGrams}g</strong></span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Compact variant (default for recipe cards and pills)
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant',
        className
      )}
      title={`${calories ?? 0} kcal, ${proteinGrams ?? 0}g protein per portion`}
    >
      {calories !== undefined && calories !== null && (
        <span className="flex items-center gap-0.5 text-on-surface">
          <Icon name="local_fire_department" className="text-[12px] text-amber-500" />
          <span className="font-numeric-data">{calories}</span>
          <span className="text-[10px] opacity-70">kcal</span>
        </span>
      )}
      {proteinGrams !== undefined && proteinGrams !== null && (
        <span className="flex items-center gap-0.5 text-secondary">
          <span className="font-numeric-data font-bold">{proteinGrams}g</span>
          <span className="text-[10px] opacity-80">P</span>
        </span>
      )}
    </div>
  );
}
