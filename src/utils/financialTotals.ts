import type { Transaction } from '../types/finance';
import { Money } from './money.ts';


export const sumTransactionType = (transactions: Transaction[], type: 'INCOME' | 'EXPENSE', monthPrefix?: string) =>
  Money.fromPaise(
    transactions
      .filter((transaction) => transaction.type === type && (!monthPrefix || transaction.date.startsWith(monthPrefix)))
      .reduce((sumPaise, transaction) => sumPaise + Money.toPaise(transaction.amount), 0)
  );

