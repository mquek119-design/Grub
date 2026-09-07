import type { BasketItem, ReconciliationItem, Substitution } from './types';

/** Preserve allocations while pricing only the packs actually received. */
export function reconciledItems(
  items: BasketItem[],
  receipts: ReconciliationItem[],
  substitutions: Substitution[]
): BasketItem[] {
  const receiptById = new Map(receipts.map((receipt) => [receipt.basketItemId, receipt]));
  const subById = new Map(substitutions.map((sub) => [sub.basketItemId, sub]));
  return items.map((item) => {
    const receipt = receiptById.get(item.id);
    const sub = subById.get(item.id);
    const quantity = receipt ? (receipt.received ? receipt.receivedQuantity : 0) : item.quantity;
    return {
      ...item,
      quantity: sub?.decision === 'rejected' ? 0 : quantity,
      unitPrice: sub?.decision === 'accepted' ? sub.receivedPrice : item.unitPrice,
      name: sub?.decision === 'accepted' ? sub.receivedName : item.name,
    };
  });
}
