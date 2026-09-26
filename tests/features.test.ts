import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDeterministicInsights, detectDuplicateTransaction } from '../src/utils/calculations.ts';
import type { Transaction, Account, Budget, Category } from '../src/types/finance.ts';

const baseAccount: Account = {
  id: 'acc1',
  name: 'Main Checking',
  type: 'BANK',
  openingBalance: 10000,
  currency: 'INR',
  isArchived: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const baseCategory: Category = {
  id: 'cat1',
  name: 'Groceries',
  icon: 'ShoppingCart',
  color: '#20C4E8',
  type: 'EXPENSE',
  isDefault: true,
};

const baseBudget: Budget = {
  id: 'b1',
  categoryId: 'cat1',
  amount: 5000,
  period: 'MONTHLY',
  alertThreshold: 80,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const currentDateStr = new Date().toISOString().slice(0, 7);

const sampleTransactions: Transaction[] = [
  {
    id: 'tx1',
    accountId: 'acc1',
    categoryId: 'cat1',
    type: 'EXPENSE',
    amount: 4200,
    date: `${currentDateStr}-10`,
    time: '12:00',
    note: 'Supermarket purchase',
    createdAt: '2026-09-10',
    updatedAt: '2026-09-10',
  },
];

test('generateDeterministicInsights provides concise titles without awkward phrasing', () => {
  const insights = generateDeterministicInsights(sampleTransactions, [baseBudget], [baseCategory], [baseAccount]);
  assert.ok(Array.isArray(insights));
  for (const insight of insights) {
    assert.ok(insight.title, 'Insight must have a title');
    assert.ok(!insight.title.startsWith('Your largest'), 'Should not use awkward truncation like "Your largest"');
  }
});

test('detectDuplicateTransaction identifies matching candidate', () => {
  const candidate = {
    accountId: 'acc1',
    amount: 4200,
    type: 'EXPENSE',
    date: `${currentDateStr}-10`,
    note: 'Supermarket purchase',
  };

  const duplicate = detectDuplicateTransaction(candidate, sampleTransactions);
  assert.ok(duplicate, 'Should find duplicate transaction');
  assert.equal(duplicate?.id, 'tx1');
});
