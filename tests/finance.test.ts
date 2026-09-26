import test from 'node:test';
import assert from 'node:assert/strict';
import { sumTransactionType } from '../src/utils/financialTotals.ts';
import { calculateGoalProgress } from '../src/utils/goals.ts';
import { escapeCSVField } from '../src/utils/csv.ts';
import type { Transaction } from '../src/types/finance.ts';

const base = { accountId: 'a', categoryId: 'c', date: '2026-09-10', time: '10:00', note: '', createdAt: '', updatedAt: '' };
const transactions: Transaction[] = [
  { ...base, id: '1', type: 'INCOME', amount: 1000 },
  { ...base, id: '2', type: 'EXPENSE', amount: 250 },
  { ...base, id: '3', type: 'TRANSFER', amount: 500, toAccountId: 'b' },
];

test('income and expenses exclude transfers', () => {
  assert.equal(sumTransactionType(transactions, 'INCOME', '2026-09'), 1000);
  assert.equal(sumTransactionType(transactions, 'EXPENSE', '2026-09'), 250);
});

test('goal progress is planning-only arithmetic with a monthly requirement', () => {
  const result = calculateGoalProgress({ targetAmount: 1200, targetDate: '2026-12-31', contributions: [{ id: 'c', amount: 300, date: '2026-09-01' }] }, new Date('2026-09-01T00:00:00'));
  assert.equal(result.allocated, 300);
  assert.equal(result.remaining, 900);
  assert.equal(result.percentage, 25);
  assert.ok(result.requiredMonthly && result.requiredMonthly > 0);
});

test('CSV fields escape quotes and neutralize spreadsheet formulas', () => {
  assert.equal(escapeCSVField('hello, "world"'), '"hello, ""world"""');
  assert.equal(escapeCSVField('=2+2'), '"\'=2+2"');
});
