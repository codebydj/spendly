import type { Transaction } from '../types/finance';

export const sumTransactionType = (transactions: Transaction[], type: 'INCOME' | 'EXPENSE', monthPrefix?: string) =>
  transactions
    .filter((transaction) => transaction.type === type && (!monthPrefix || transaction.date.startsWith(monthPrefix)))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
