import type { Account, Transaction, Budget } from '../types/finance';

export const calculateAccountBalance = (account: Account, transactions: Transaction[]): number => {
  let balance = account.openingBalance;

  transactions.forEach((tx) => {
    if (account.type === 'CREDIT_CARD') {
      // Credit card: purchases (EXPENSE) and outgoing transfers INCREASE outstanding balance.
      // Payments (INCOME / incoming TRANSFER) REDUCE outstanding balance.
      if (tx.type === 'EXPENSE' && tx.accountId === account.id) {
        balance += tx.amount;
      } else if (tx.type === 'INCOME' && tx.accountId === account.id) {
        balance -= tx.amount;
      } else if (tx.type === 'TRANSFER') {
        if (tx.accountId === account.id) {
          balance += tx.amount;
        }
        if (tx.toAccountId === account.id) {
          balance -= tx.amount; // Bill payment received
        }
      }
    } else {
      // Bank, Cash, Wallet, Other
      if (tx.type === 'INCOME' && tx.accountId === account.id) {
        balance += tx.amount;
      } else if (tx.type === 'EXPENSE' && tx.accountId === account.id) {
        balance -= tx.amount;
      } else if (tx.type === 'TRANSFER') {
        if (tx.accountId === account.id) {
          balance -= tx.amount; // Outgoing transfer
        }
        if (tx.toAccountId === account.id) {
          balance += tx.amount; // Incoming transfer
        }
      }
    }
  });

  return balance;
};

export const calculateCreditCardMetrics = (account: Account, transactions: Transaction[]) => {
  const outstanding = calculateAccountBalance(account, transactions);
  const creditLimit = account.creditLimit || 0;
  const availableCredit = Math.max(0, creditLimit - outstanding);
  return { outstanding, creditLimit, availableCredit };
};

export const calculateNetWorth = (accounts: Account[], transactions: Transaction[]): number => {
  const active = accounts.filter((a) => !a.isArchived);
  let total = 0;

  active.forEach((acc) => {
    const bal = calculateAccountBalance(acc, transactions);
    if (acc.type === 'CREDIT_CARD') {
      total -= bal; // Outstanding debt reduces net worth
    } else {
      total += bal;
    }
  });

  return total;
};

export const calculateIncome = (transactions: Transaction[], monthPrefix?: string): number => {
  return transactions
    .filter((t) => t.type === 'INCOME' && (!monthPrefix || t.date.startsWith(monthPrefix)))
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateExpenses = (transactions: Transaction[], monthPrefix?: string): number => {
  return transactions
    .filter((t) => t.type === 'EXPENSE' && (!monthPrefix || t.date.startsWith(monthPrefix)))
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateCategorySpending = (
  categoryId: string,
  transactions: Transaction[],
  monthPrefix?: string
): number => {
  return transactions
    .filter(
      (t) => t.type === 'EXPENSE' && t.categoryId === categoryId && (!monthPrefix || t.date.startsWith(monthPrefix))
    )
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateBudgetStatus = (
  budget: Budget,
  transactions: Transaction[],
  monthPrefix?: string
) => {
  const spent = calculateCategorySpending(budget.categoryId, transactions, monthPrefix);
  const limit = budget.monthlyLimit;
  const remaining = limit - spent;
  const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

  let status: 'ON TRACK' | '80% REACHED' | 'OVER BUDGET' = 'ON TRACK';
  if (spent > limit) {
    status = 'OVER BUDGET';
  } else if (percentage >= 80) {
    status = '80% REACHED';
  }

  return { spent, limit, remaining, percentage, status };
};
