export interface DietOption {
  id: string;
  label: string;
  icon: string;
}

export const DIETS: DietOption[] = [
  { id: 'vegetarian', label: 'Vegetarian', icon: 'eco' },
  { id: 'vegan', label: 'Vegan', icon: 'spa' },
  { id: 'pescatarian', label: 'Pescatarian', icon: 'set_meal' },
  { id: 'halal', label: 'Halal', icon: 'verified' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: 'grain' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: 'water_drop' },
  { id: 'nut_allergy', label: 'Nut Allergy', icon: 'warning' },
];

export interface VibeOption {
  id: string;
  label: string;
  hint: string;
  icon: string;
}

export const VIBES: VibeOption[] = [
  { id: 'speedy', label: 'Speedy (<20m)', hint: 'Quick lecture-night fuel', icon: 'bolt' },
  { id: 'high_protein', label: 'High Protein', hint: 'Gym staples & clean gains', icon: 'fitness_center' },
  { id: 'budget_king', label: 'Budget King (<£1.50)', hint: 'Pasta bakes & dahl', icon: 'savings' },
  { id: 'fakeaway', label: 'Fakeaway Night', hint: 'Curry, burgers & stir-fry', icon: 'takeout_dining' },
  { id: 'comfort_food', label: 'Comfort Food', hint: 'Sunday roast & stews', icon: 'soup_kitchen' },
];

export function getBudgetTier(budget: number) {
  if (budget <= 25) {
    return {
      tier: 'frugal' as const,
      mood: 'smug' as const,
      label: 'Frugal Tier',
    };
  }
  if (budget <= 45) {
    return {
      tier: 'student' as const,
      mood: 'neutral' as const,
      label: 'Student Tier',
    };
  }
  if (budget <= 70) {
    return {
      tier: 'gym' as const,
      mood: 'cooking' as const,
      label: 'Gym / High Protein',
    };
  }
  return {
    tier: 'rich' as const,
    mood: 'cooking' as const,
    label: 'Premium Tier',
  };
}

export interface ParsedDietaryPreferences {
  diets: string[];
  vibes: string[];
  budget: number;
  customAllergies: string[];
}

/**
 * Parses raw stored dietary_preferences strings like
 * ["vegetarian", "vibe:speedy", "budget:35", "allergy:shellfish"]
 * and also safely normalizes legacy strings like ["Vegetarian", "Dairy free"].
 */
export function parseDietaryPreferences(preferences: string[] = []): ParsedDietaryPreferences {
  const diets: string[] = [];
  const vibes: string[] = [];
  const customAllergies: string[] = [];
  let budget = 30;

  for (const raw of preferences) {
    const p = raw.trim();
    if (!p) continue;

    if (p.startsWith('budget:')) {
      const parsed = parseInt(p.replace('budget:', ''), 10);
      if (!isNaN(parsed) && parsed > 0) budget = parsed;
    } else if (p.startsWith('vibe:')) {
      const v = p.replace('vibe:', '');
      if (v && !vibes.includes(v)) vibes.push(v);
    } else if (p.startsWith('allergy:')) {
      const a = p.replace('allergy:', '');
      if (a && !customAllergies.includes(a.toLowerCase())) customAllergies.push(a.toLowerCase());
    } else {
      // Could be an ID like 'vegetarian' or legacy like 'Vegetarian' / 'Gluten free'
      const normalized = p.toLowerCase().replace(/[\s-]+/g, '_');
      const matchedDiet = DIETS.find((d) => d.id === normalized || d.label.toLowerCase() === p.toLowerCase());
      if (matchedDiet) {
        if (!diets.includes(matchedDiet.id)) diets.push(matchedDiet.id);
      } else {
        if (!customAllergies.includes(p.toLowerCase())) customAllergies.push(p.toLowerCase());
      }
    }
  }

  return { diets, vibes, budget, customAllergies };
}

export interface FormattedBadge {
  id: string;
  label: string;
  icon?: string;
  type: 'diet' | 'vibe' | 'budget' | 'allergy';
}

export function formatDietaryBadge(pref: string): FormattedBadge {
  const p = pref.trim();
  if (p.startsWith('budget:')) {
    const amount = p.replace('budget:', '');
    return { id: p, label: `£${amount}/wk`, icon: 'savings', type: 'budget' };
  }
  if (p.startsWith('vibe:')) {
    const vId = p.replace('vibe:', '');
    const vibe = VIBES.find((v) => v.id === vId);
    return { id: p, label: vibe ? vibe.label : vId, icon: vibe?.icon ?? 'bolt', type: 'vibe' };
  }
  if (p.startsWith('allergy:')) {
    const a = p.replace('allergy:', '');
    return { id: p, label: `Allergy: ${a}`, icon: 'warning', type: 'allergy' };
  }

  const normalized = p.toLowerCase().replace(/[\s-]+/g, '_');
  const diet = DIETS.find((d) => d.id === normalized || d.label.toLowerCase() === p.toLowerCase());
  if (diet) {
    return { id: p, label: diet.label, icon: diet.icon, type: 'diet' };
  }

  return { id: p, label: p, type: 'diet' };
}
