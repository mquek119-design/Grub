/**
 * Tesco account operations run on the collector's local Grub instance.
 * Standard serverless deployments cannot run the Playwright checkout flow.
 */
export const TESCO_ORDERING_UNAVAILABLE_MESSAGE =
  "Tesco ordering runs on the collector's desktop. Open Grub locally to sync the basket, reserve a slot, and continue to checkout.";

interface OrderingEnvironment {
  NODE_ENV?: string;
  TESCO_ORDERING_ENABLED?: string;
}

/**
 * Local development works without configuration. Production is deliberately
 * closed unless it is hosted somewhere that explicitly supports the ordering
 * runtime and opts in.
 */
export function isTescoOrderingEnabled(
  environment: OrderingEnvironment = process.env
): boolean {
  if (environment.TESCO_ORDERING_ENABLED !== undefined) {
    return environment.TESCO_ORDERING_ENABLED.toLowerCase() === 'true';
  }

  return environment.NODE_ENV !== 'production';
}
