import { reconciledItems } from '../reconciledItems';
import { perPersonTotals } from '../calc';
import type { BasketItem, ReconciliationItem, Substitution } from '../types';

const item = { id: 'food', unitPrice: 100, quantity: 3, allocatedTo: [{ userId: 'a', share: 1 }, { userId: 'b', share: 1 }] } as BasketItem;
const receipt = { basketItemId: 'food', received: true, receivedQuantity: 2 } as ReconciliationItem;
const substitution = { basketItemId: 'food', receivedPrice: 151, receivedName: 'Replacement', decision: 'accepted' } as Substitution;

it('charges for received packs at the substitute price, with original allocations', () => {
  const corrected = reconciledItems([item], [receipt], [substitution]);
  expect(perPersonTotals(corrected, ['a', 'b'])).toEqual({ a: 151, b: 151 });
  expect(item.quantity).toBe(3);
  expect(item.unitPrice).toBe(100);
});

it('does not charge for a missing item or a rejected substitute', () => {
  expect(perPersonTotals(reconciledItems([item], [{ ...receipt, received: false }], []), ['a', 'b'])).toEqual({ a: 0, b: 0 });
  expect(perPersonTotals(reconciledItems([item], [receipt], [{ ...substitution, decision: 'rejected' }]), ['a', 'b'])).toEqual({ a: 0, b: 0 });
});

it('uses the original basket for an estimate before receipts exist', () => {
  expect(perPersonTotals(reconciledItems([item], [], []), ['a', 'b'])).toEqual({ a: 150, b: 150 });
});
