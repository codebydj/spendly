/** A single financial display format keeps every surface consistent. */
export const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

export const formatINRMasked = (amount: number, isMasked = false): string =>
  isMasked ? '₹•••••' : formatINR(amount);
