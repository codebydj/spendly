import test from 'node:test';
import assert from 'node:assert/strict';
import { Money, formatINR, formatINRCompact } from '../src/utils/money.ts';
import { hasValidCoordinates, parseCoordinates } from '../src/utils/coordinates.ts';
import { SyncService } from '../src/services/syncService.ts';
import { validateJSONBackup, escapeCSVField } from '../src/utils/exportUtils.ts';
import { formatAccountLabel, validateAccountFields, validateTransactionAmount, validateTransferAccounts } from '../src/utils/accountUtils.ts';
import { advanceRecurringDueDate } from '../src/utils/dateUtils.ts';


test('Money math avoids IEEE 754 floating point inaccuracies', () => {
  // 0.1 + 0.2 = 0.30000000000000004 in standard JS float
  assert.equal(0.1 + 0.2 === 0.3, false);
  assert.equal(Money.add(0.1, 0.2), 0.3);

  // Subtraction & negative balances
  assert.equal(Money.subtract(100, 105.96), -5.96);
  assert.equal(Money.round(-5.960000000000001), -5.96);

  // Large amounts & paise conversion
  assert.equal(Money.toPaise(1200.5), 120050);
  assert.equal(Money.fromPaise(120050), 1200.5);

  // Indian Rupee formatting
  assert.match(formatINR(5.96), /₹\s*5\.96/);
  assert.match(formatINR(-203.7), /-₹\s*203\.70/);
  assert.equal(formatINRCompact(5.96), '₹5.96');
  assert.equal(formatINRCompact(1500), '₹1.5k');
});

test('hasValidCoordinates validates coordinates and prevents Leaflet NaN crashes', () => {
  assert.equal(hasValidCoordinates(14.68, 77.6), true);
  assert.equal(hasValidCoordinates(0, 0), true);
  assert.equal(hasValidCoordinates(-90, -180), true);
  assert.equal(hasValidCoordinates(90, 180), true);

  // Invalid cases
  assert.equal(hasValidCoordinates(NaN, 77.6), false);
  assert.equal(hasValidCoordinates(14.68, NaN), false);
  assert.equal(hasValidCoordinates(undefined, null), false);
  assert.equal(hasValidCoordinates('14.68', '77.6'), false);
  assert.equal(hasValidCoordinates(95, 10), false);
  assert.equal(hasValidCoordinates(10, -190), false);

  // Parsing helper
  const parsed = parseCoordinates('14.68', '77.6');
  assert.ok(parsed);
  assert.equal(parsed?.latitude, 14.68);
  assert.equal(parsed?.longitude, 77.6);
  assert.equal(parseCoordinates('invalid', 'NaN'), null);
});

test('SyncService validates recurring payment payloads before cloud write', () => {
  const validPayload = {
    title: 'Airtel Broadband',
    amount: 999,
    account_id: 'acc_bank',
    category_id: 'cat_bills',
    next_due_date: '2026-10-05',
    frequency: 'MONTHLY',
  };

  assert.equal(SyncService.validateRecurringPayment(validPayload).valid, true);

  // Missing title
  assert.equal(SyncService.validateRecurringPayment({ ...validPayload, title: '' }).valid, false);
  // Non-positive amount
  assert.equal(SyncService.validateRecurringPayment({ ...validPayload, amount: 0 }).valid, false);
  // Missing account
  assert.equal(SyncService.validateRecurringPayment({ ...validPayload, account_id: '' }).valid, false);
  // Missing category
  assert.equal(SyncService.validateRecurringPayment({ ...validPayload, category_id: '' }).valid, false);
});

test('Backup JSON validation detects malformed schemas', () => {
  assert.equal(validateJSONBackup({ accounts: [{ id: '1' }], transactions: [] }).isValid, true);
  assert.equal(validateJSONBackup(null).isValid, false);
  assert.equal(validateJSONBackup({ invalidKey: 123 }).isValid, false);
});

test('CSV escaping neutralizes formula injection and preserves quotes', () => {
  assert.equal(escapeCSVField('=CMD|\' /C calc\'!A1'), '"\'=CMD|\' /C calc\'!A1"');
  assert.equal(escapeCSVField('Canara, "Salary Account"'), '"Canara, ""Salary Account"""');
});

test('formatAccountLabel formats bank, institution, last4, and prevents duplicate type names', () => {
  // Canara • Salary Account • 1234
  assert.equal(
    formatAccountLabel({ name: 'Salary Account', institution: 'Canara', lastFourDigits: '1234' }),
    'Canara • Salary Account • 1234'
  );

  // Canara • Savings Account • 8890
  assert.equal(
    formatAccountLabel({ name: 'Savings Account', institution: 'Canara', lastFourDigits: '8890' }),
    'Canara • Savings Account • 8890'
  );

  // Cash account without redundant Cash Cash label
  assert.equal(
    formatAccountLabel({ name: 'Cash', type: 'CASH' }),
    'Cash'
  );

  // Validation tests
  assert.equal(validateAccountFields({ name: 'A' }).isValid, false); // Too short
  assert.equal(validateAccountFields({ name: 'Canara Savings Account', lastFourDigits: '12' }).isValid, false); // Not 4 digits
  assert.equal(validateAccountFields({ name: 'Canara Savings Account', lastFourDigits: '1234' }).isValid, true);
});

test('validateTransactionAmount and validateTransferAccounts enforce financial safety rules', () => {
  // Amount checks
  assert.equal(validateTransactionAmount('0').isValid, false);
  assert.equal(validateTransactionAmount('-100').isValid, false);
  assert.equal(validateTransactionAmount('abc').isValid, false);
  assert.equal(validateTransactionAmount('10.123').isValid, false); // 3 decimals
  assert.equal(validateTransactionAmount('10.50').isValid, true);

  // Transfer checks
  assert.equal(validateTransferAccounts('TRANSFER', 'acc1', 'acc1').isValid, false); // Same account
  assert.equal(validateTransferAccounts('TRANSFER', 'acc1', 'acc2').isValid, true);
  assert.equal(validateTransferAccounts('EXPENSE', 'acc1', 'acc1').isValid, true);
});

test('advanceRecurringDueDate accurately computes EOM, leap years, and snooze offsets', () => {
  // Monthly on Jan 31 -> Feb 28
  assert.equal(advanceRecurringDueDate('2026-01-31', 'MONTHLY'), '2026-02-28');

  // Monthly on Jan 31 in leap year 2028 -> Feb 29
  assert.equal(advanceRecurringDueDate('2028-01-31', 'MONTHLY'), '2028-02-29');

  // Yearly on Feb 29 2028 -> Feb 28 2029
  assert.equal(advanceRecurringDueDate('2028-02-29', 'YEARLY'), '2029-02-28');

  // Snooze 3 days from Oct 1 -> Oct 4
  assert.equal(advanceRecurringDueDate('2026-10-01', 'MONTHLY', 3), '2026-10-04');
});

