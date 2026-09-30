import type { Account } from '../types/finance';

/**
 * Formats an account label consistently across all screens, dropdowns, and filters.
 * E.g.:
 * "Canara • Salary Account • 1234"
 * "HDFC • Savings Account • 8890"
 * "Cash • Wallet"
 */
export function formatAccountLabel(account?: Partial<Account> | null): string {
  if (!account) return 'Deleted Account';

  const parts: string[] = [];

  const inst = account.institution?.trim();
  const name = account.name?.trim() || 'Unnamed Account';
  const last4 = account.lastFourDigits?.trim();

  if (inst) {
    parts.push(inst);
  }

  parts.push(name);

  if (last4) {
    parts.push(last4);
  }

  // If no lastFourDigits or institution, append type if not redundant (e.g., Cash Cash)
  if (!last4 && account.type && !inst) {
    const formattedType = account.type.replace('_', ' ');
    if (name.toLowerCase() !== formattedType.toLowerCase()) {
      parts.push(`(${formattedType})`);
    }
  }

  return parts.join(' • ');
}

export interface AccountFieldErrors {
  name?: string;
  institution?: string;
  lastFourDigits?: string;
  routingCode?: string;
  creditLimit?: string;
  openingBalance?: string;
  general?: string;
}

/**
 * Comprehensive validation for Account editing and creation forms.
 */
export function validateAccountFields(account: Partial<Account>): { isValid: boolean; errors: AccountFieldErrors } {
  const errors: AccountFieldErrors = {};

  const name = account.name?.trim() || '';
  if (!name) {
    errors.name = 'Account name is required';
  } else if (name.length < 2 || name.length > 60) {
    errors.name = 'Account name must be between 2 and 60 characters';
  }

  if (account.lastFourDigits && account.lastFourDigits.trim()) {
    const trimmedLast4 = account.lastFourDigits.trim();
    if (!/^\d{4}$/.test(trimmedLast4)) {
      errors.lastFourDigits = 'Last four digits must contain exactly 4 numeric digits';
    }
  }

  if (account.routingCode && account.routingCode.trim()) {
    const code = account.routingCode.trim();
    if (code.length < 3 || code.length > 20 || !/^[A-Za-z0-9\-\.]+$/.test(code)) {
      errors.routingCode = 'Routing code / IFSC must be 3-20 alphanumeric characters';
    }
  }

  if (account.creditLimit !== undefined && account.creditLimit !== null) {
    if (isNaN(account.creditLimit) || account.creditLimit < 0) {
      errors.creditLimit = 'Credit limit cannot be negative';
    }
  }

  if (account.openingBalance !== undefined && account.openingBalance !== null) {
    if (isNaN(account.openingBalance) || !isFinite(account.openingBalance)) {
      errors.openingBalance = 'Please enter a valid numeric opening balance';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a transaction amount string for numeric validity, positive value, and max 2 decimal places.
 */
export function validateTransactionAmount(amountStr: string): { isValid: boolean; parsedAmount: number; errorMessage?: string } {
  if (!amountStr || !amountStr.trim()) {
    return { isValid: false, parsedAmount: 0, errorMessage: 'Amount is required' };
  }

  const parsedAmount = parseFloat(amountStr);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { isValid: false, parsedAmount: 0, errorMessage: 'Amount must be greater than zero' };
  }

  if (!isFinite(parsedAmount) || parsedAmount > 100000000000) {
    return { isValid: false, parsedAmount: 0, errorMessage: 'Amount exceeds maximum supported limit' };
  }

  // Check decimal places
  const parts = amountStr.trim().split('.');
  if (parts.length > 2 || (parts[1] && parts[1].length > 2)) {
    return { isValid: false, parsedAmount: 0, errorMessage: 'Amount cannot have more than 2 decimal places' };
  }

  return { isValid: true, parsedAmount };
}

/**
 * Validates that transfer source and destination accounts are selected and distinct.
 */
export function validateTransferAccounts(
  type: string,
  sourceAccountId: string,
  targetAccountId?: string
): { isValid: boolean; errorMessage?: string } {
  if (type !== 'TRANSFER') {
    return { isValid: true };
  }

  if (!sourceAccountId) {
    return { isValid: false, errorMessage: 'Please select a source account' };
  }

  if (!targetAccountId) {
    return { isValid: false, errorMessage: 'Please select a destination account' };
  }

  if (sourceAccountId === targetAccountId) {
    return { isValid: false, errorMessage: 'Source and Destination accounts must be different for transfers' };
  }

  return { isValid: true };
}
