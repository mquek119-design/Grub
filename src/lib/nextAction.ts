import type { PlanStatus, SplitStatus } from './types';

export interface NextActionContext {
  status: PlanStatus;
  cutoffPassed: boolean;
  mealCount: number;
  hasInput: boolean;
  hasBasket: boolean;
  needsPackData: boolean;
  userId: string;
  collector: { id: string; name: string } | null;
  splits: { user: { id: string }; status: SplitStatus }[];
}

export interface NextAction {
  title: string;
  body: string;
  href: string;
  label: string;
  icon: string;
}

/** One next step from saved week state; never implies a payment or delivery happened. */
export function nextAction(context: NextActionContext): NextAction {
  const { status, cutoffPassed, mealCount, hasInput, hasBasket, needsPackData, userId, collector, splits } = context;
  const isCollector = collector?.id === userId;

  if (status === 'planning' && !cutoffPassed) {
    return hasInput
      ? { title: "You're in for this week", body: 'Review your meals or join a housemate before the cutoff.', href: '/plan', label: 'Review your week', icon: 'calendar_month' }
      : { title: 'What do you fancy?', body: 'Pick a meal or join one your housemate has planned before the cutoff.', href: '/plan', label: 'Add what you fancy', icon: 'restaurant' };
  }

  if (!collector) {
    return { title: 'Choose a collector', body: 'The house needs someone to place the order and receive payments.', href: '/settings', label: 'Choose the collector', icon: 'person' };
  }

  if (status === 'planning' || status === 'locked') {
    if (!hasBasket && mealCount === 0) {
      return { title: 'No meals in this shop', body: 'Planning is closed for this week. Start picking meals for next week.', href: '/plan?week=next', label: 'Plan next week', icon: 'event_upcoming' };
    }
    if (!isCollector) {
      return { title: `${collector.name} takes it from here`, body: 'Planning is closed. The collector builds, reviews and orders the shared shop.', href: '/basket', label: 'View the basket', icon: 'shopping_basket' };
    }
    if (!hasBasket) {
      return { title: 'Build the house basket', body: 'Planning is closed. Turn the meals into one shop, then review it before ordering.', href: '/basket', label: 'Build the basket', icon: 'shopping_basket' };
    }
    if (needsPackData) {
      return { title: 'Fill in the missing prices', body: 'Some basket items need pack details before you can review the full cost.', href: '/basket', label: 'Review pack details', icon: 'price_check' };
    }
    return { title: 'Review and place the order', body: 'Check the basket and slot, then complete Tesco checkout from your desktop.', href: '/basket', label: 'Review the basket', icon: 'shopping_cart_checkout' };
  }

  if (status === 'ordered') {
    if (isCollector && needsPackData) {
      return { title: 'Fill in the missing prices', body: 'Add the missing pack prices before completing the delivery check and opening payments.', href: '/basket', label: 'Review pack details', icon: 'price_check' };
    }
    return isCollector
      ? { title: 'Check the delivery when it arrives', body: 'Record missing items and substitutions. Completing the check updates the split and opens payments.', href: '/split/reconcile', label: 'Check delivery', icon: 'local_shipping' }
      : { title: 'Wait for the delivery check', body: `${collector.name} needs to check what arrived before payments open. Your share is still an estimate.`, href: '/split', label: 'View your estimate', icon: 'receipt_long' };
  }

  if (isCollector) {
    if (splits.some((split) => split.status === 'notified')) {
      return { title: 'Check the payments received', body: 'A housemate says they paid. Check your bank or payment app before confirming.', href: '/split', label: 'Review payments', icon: 'payments' };
    }
    if (splits.some((split) => split.status !== 'confirmed')) {
      return { title: 'Keep track of the split', body: 'Delivery is checked. See who still needs to pay and review any disputed payments.', href: '/split', label: 'Review the split', icon: 'receipt_long' };
    }
    return splits.length > 0
      ? { title: "This week's split is settled", body: 'Everyone on the posted split is confirmed. See what the house is cooking next.', href: '/plan', label: 'See your meals', icon: 'skillet' }
      : { title: 'Review the delivery split', body: 'Delivery is checked. Open Split to review the shares for this shop.', href: '/split', label: 'Review the split', icon: 'receipt_long' };
  }

  const mine = splits.find((split) => split.user.id === userId);
  if (mine?.status === 'pending' || mine?.status === 'disputed') {
    return mine.status === 'disputed'
      ? { title: 'Check your payment with the collector', body: `${collector.name} has not confirmed receiving it. Check the transfer before sending anything again.`, href: '/split', label: 'Review payment', icon: 'payments' }
      : { title: `Settle up with ${collector.name}`, body: 'Delivery is checked. Review your share and payment details, then mark your transfer as sent.', href: '/split', label: 'View payment details', icon: 'payments' };
  }
  if (mine?.status === 'notified') {
    return { title: 'Waiting for payment confirmation', body: `${collector.name} still needs to confirm your transfer. You can check its status in Split.`, href: '/split', label: 'View payment status', icon: 'schedule' };
  }
  return { title: mine ? "You're settled up" : 'Your meals for the week', body: mine ? 'Your payment is confirmed. See what you are cooking next.' : 'There is no posted share for you in this shop. See what the house has planned.', href: '/plan', label: 'See your meals', icon: 'skillet' };
}
