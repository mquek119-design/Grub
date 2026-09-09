'use client';

import { useState, useTransition, useActionState } from 'react';
import { Notice } from '@/components/ui/Notice';
import { Button } from '@/components/ui/Button';
import { formatRecipeTitle } from '@/lib/recipeFormatting';
import { respondToOverlapProposal, type PlanActionState } from '@/app/plan/actions';
import type { PlannedMeal, Recipe, User } from '@/lib/types';
import { WEEKDAY_LABELS, MEAL_TYPE_LABELS } from '@/lib/types';

const INITIAL: PlanActionState = { status: 'idle', message: '' };

interface OverlapProposalPromptProps {
  proposals: PlannedMeal[];
  housemates: User[];
  recipes: Map<string, Recipe>;
}

export function OverlapProposalPrompt({
  proposals: initialProposals,
  housemates,
  recipes,
}: OverlapProposalPromptProps) {
  const [proposals, setProposals] = useState(initialProposals);
  const [isPending, startTransition] = useTransition();

  if (proposals.length === 0) {
    return null;
  }

  const handleProposalResponded = (respondedMealId: string) => {
    startTransition(() => {
      setProposals((current) => current.filter((meal) => meal.id !== respondedMealId));
    });
  };

  return (
    <div className="flex flex-col gap-md">
      {proposals.map((meal) => (
        <OverlapProposalCard
          key={meal.id}
          meal={meal}
          housemates={housemates}
          recipes={recipes}
          onRespond={handleProposalResponded}
          disabled={isPending}
        />
      ))}
    </div>
  );
}

interface OverlapProposalCardProps {
  meal: PlannedMeal;
  housemates: User[];
  recipes: Map<string, Recipe>;
  onRespond: (mealId: string) => void;
  disabled?: boolean;
}

function OverlapProposalCard({
  meal,
  housemates,
  recipes,
  onRespond,
  disabled,
}: OverlapProposalCardProps) {
  const proposer = housemates.find((h) => h.id === meal.proposalCreatedBy);
  const proposerName = proposer?.name ?? 'A housemate';
  const dayLabel = WEEKDAY_LABELS[meal.day];
  const mealLabel = MEAL_TYPE_LABELS[meal.mealType];
  const targetRecipe = meal.proposalRecipeId ? recipes.get(meal.proposalRecipeId) : undefined;
  const targetTitle = targetRecipe ? formatRecipeTitle(targetRecipe.title) : meal.recipeTitle;

  return (
    <Notice tone="suggest" icon="handshake">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-on-surface">
            {proposerName} proposed cooking {targetTitle} together
          </p>
          <p className="text-on-surface-variant text-sm mt-0.5">
            On {dayLabel} {mealLabel.toLowerCase()} to pool shared ingredients and cut costs. Both parties must agree before meals merge.
          </p>
        </div>
        <div className="flex items-center gap-xs shrink-0">
          <ProposalResponseButton
            meal={meal}
            accept={true}
            onRespond={onRespond}
            disabled={disabled}
          />
          <ProposalResponseButton
            meal={meal}
            accept={false}
            onRespond={onRespond}
            disabled={disabled}
          />
        </div>
      </div>
    </Notice>
  );
}

interface ProposalResponseButtonProps {
  meal: PlannedMeal;
  accept: boolean;
  onRespond: (mealId: string) => void;
  disabled?: boolean;
}

function ProposalResponseButton({
  meal,
  accept,
  onRespond,
  disabled,
}: ProposalResponseButtonProps) {
  const [_state, formAction, isSubmitting] = useActionState(respondToOverlapProposal, INITIAL);

  const handleAction = async (formData: FormData) => {
    await formAction(formData);
    onRespond(meal.id);
  };

  return (
    <form action={handleAction}>
      <input type="hidden" name="mealId" value={meal.id} />
      <input type="hidden" name="accept" value={String(accept)} />
      <Button
        type="submit"
        variant={accept ? 'primary' : 'outline'}
        size="sm"
        disabled={disabled || isSubmitting}
        icon={accept ? 'check' : 'close'}
      >
        {isSubmitting
          ? accept
            ? 'Merging…'
            : 'Declining…'
          : accept
          ? 'Agree to Share'
          : 'Keep Separate'}
      </Button>
    </form>
  );
}
