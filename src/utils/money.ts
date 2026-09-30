/**
 * Precision Money Math Utility for Spendly
 * Prevents IEEE 754 floating-point errors (e.g. 0.1 + 0.2 = 0.30000000000000004 or -5.960000000000001)
 */
export class Money {
  /** Convert decimal currency to integer paise/cents (rounded safely) */
  public static toPaise(amount: number): number {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || Number.isNaN(amount)) {
      return 0;
    }
    return Math.round((amount + Number.EPSILON) * 100);
  }

  /** Convert integer paise/cents back to decimal number */
  public static fromPaise(paise: number): number {
    if (typeof paise !== 'number' || !Number.isFinite(paise) || Number.isNaN(paise)) {
      return 0;
    }
    return Math.round(paise) / 100;
  }

  /** Add multiple money amounts safely */
  public static add(...amounts: number[]): number {
    const totalPaise = amounts.reduce((sum, a) => sum + Money.toPaise(a), 0);
    return Money.fromPaise(totalPaise);
  }

  /** Subtract b from a safely: a - b */
  public static subtract(a: number, b: number): number {
    return Money.fromPaise(Money.toPaise(a) - Money.toPaise(b));
  }

  /** Round a monetary amount to 2 decimal places */
  public static round(amount: number): number {
    return Money.fromPaise(Money.toPaise(amount));
  }

  /** Calculate percentage safely */
  public static percentage(part: number, total: number): number {
    const totalP = Money.toPaise(total);
    if (totalP === 0) return 0;
    const partP = Money.toPaise(part);
    return Math.round((partP / totalP) * 100);
  }
}

/** Format currency consistently in Indian Rupee format */
export const formatINR = (amount: number): string => {
  const rounded = Money.round(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
};

/** Format currency with masking option for private view */
export const formatINRMasked = (amount: number, isMasked = false): string =>
  isMasked ? '₹•••••' : formatINR(amount);

/** Format compact currency for tight grid cells (e.g. ₹5.96 or ₹12.5k) */
export const formatINRCompact = (amount: number): string => {
  const rounded = Money.round(amount);
  const absVal = Math.abs(rounded);
  const sign = rounded < 0 ? '-' : '';

  if (absVal >= 10000007) {
    return `${sign}₹${(absVal / 10000000).toFixed(2)}Cr`;
  }
  if (absVal >= 100000) {
    return `${sign}₹${(absVal / 100000).toFixed(2)}L`;
  }
  if (absVal >= 1000) {
    return `${sign}₹${(absVal / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${absVal.toFixed(2)}`;
};
