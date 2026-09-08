import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { generateIcsFeed, type CalendarEvent } from '@/lib/calendarGenerator';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ houseId: string }> }
) {
  const { houseId } = await params;
  if (!houseId) {
    return new NextResponse('Missing house ID', { status: 400 });
  }

  // Headless Supabase client without cookies (calendar subscribers don't carry user session cookies)
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });

  const { data: house, error: houseError } = await supabase
    .from('houses')
    .select('*')
    .eq('id', houseId)
    .maybeSingle();

  if (houseError || !house) {
    return new NextResponse('House not found', { status: 404 });
  }

  // Fetch profiles for name lookups
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('house_id', houseId);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  // Fetch current/active weekly plan
  const { data: plans } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('house_id', houseId)
    .order('created_at', { ascending: false })
    .limit(2);

  const plan = plans?.[0];
  const events: CalendarEvent[] = [];
  const siteUrl = getSiteUrl();

  if (plan) {
    // 1. Cutoff Event
    if (plan.cutoff_at) {
      const cutoffDate = new Date(plan.cutoff_at);
      const cutoffEnd = new Date(cutoffDate.getTime() + 30 * 60 * 1000); // 30 min duration
      events.push({
        uid: `cutoff-${plan.id}`,
        title: `🛒 Grub Cutoff: ${house.name}`,
        description: `Weekly grocery basket locks now! Make sure you have picked your meals and added your personal staples.\n\nOpen plan: ${siteUrl}/plan`,
        url: `${siteUrl}/plan`,
        start: cutoffDate,
        end: cutoffEnd,
        alarmMinutesBefore: 60,
      });
    }

    // 2. Planned Meals
    const { data: meals } = await supabase
      .from('planned_meals')
      .select('*, recipes(id, title, cook_time_mins)')
      .eq('plan_id', plan.id);

    if (meals && meals.length > 0) {
      const weekStart = new Date(plan.week_start_date);

      for (const meal of meals) {
        const cookName = meal.cooked_by_user_id
          ? profileMap.get(meal.cooked_by_user_id) ?? 'Housemate'
          : 'Unassigned';
        const recipeTitle = meal.recipes?.title ?? meal.recipe_title ?? 'Dinner';
        const recipeId = meal.recipe_id;

        // Calculate meal date (meal.day: 0 = Monday, 6 = Sunday)
        const mealDate = new Date(weekStart);
        mealDate.setDate(mealDate.getDate() + (meal.day ?? 0));

        // Set meal time (Dinner: 18:30 - 19:30, Lunch: 12:30 - 13:30)
        const isLunch = meal.meal_type === 'lunch';
        const startHour = isLunch ? 12 : 18;
        const startMinute = 30;
        mealDate.setHours(startHour, startMinute, 0, 0);

        const durationMins = meal.recipes?.cook_time_mins ?? 45;
        const endDate = new Date(mealDate.getTime() + durationMins * 60 * 1000);

        const cookModeUrl = recipeId ? `${siteUrl}/recipes/${recipeId}?cook=true` : `${siteUrl}/plan`;

        events.push({
          uid: `meal-${meal.id}`,
          title: `🍳 ${recipeTitle} (${cookName})`,
          description: `Meal: ${recipeTitle}\nCook: ${cookName}\n\nStart Cook Mode: ${cookModeUrl}`,
          url: cookModeUrl,
          start: mealDate,
          end: endDate,
          alarmMinutesBefore: 60,
        });
      }
    }

    // 3. Booked Delivery Slot
    if (plan.booked_slot_starts_at) {
      const slotStart = new Date(plan.booked_slot_starts_at);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // default 1h slot

      events.push({
        uid: `delivery-${plan.id}`,
        title: `📦 Tesco ${house.fulfillment_method === 'collect' ? 'Click & Collect' : 'Delivery'} (Grub)`,
        description: `Tesco groceries for ${house.name}.\n\nView basket: ${siteUrl}/basket`,
        url: `${siteUrl}/basket`,
        start: slotStart,
        end: slotEnd,
        alarmMinutesBefore: 30,
      });
    }
  }

  const ics = generateIcsFeed({
    calendarName: `Grub · ${house.name}`,
    description: `Meal schedule, cook duties, and grocery delivery slots for ${house.name}.`,
    events,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="grub-${houseId}.ics"`,
      'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
    },
  });
}
