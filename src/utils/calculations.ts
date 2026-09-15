import type { Account, Transaction, Budget, Category } from '../types/finance';

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

export interface NetWorthBreakdown {
  totalNetWorth: number;
  totalAssets: number;
  totalCreditCardDebt: number;
  cashTotal: number;
  bankTotal: number;
  walletTotal: number;
  otherAssetsTotal: number;
}

export const calculateNetWorthBreakdown = (
  accounts: Account[],
  transactions: Transaction[]
): NetWorthBreakdown => {
  const active = accounts.filter((a) => !a.isArchived);
  let totalAssets = 0;
  let totalCreditCardDebt = 0;
  let cashTotal = 0;
  let bankTotal = 0;
  let walletTotal = 0;
  let otherAssetsTotal = 0;

  active.forEach((acc) => {
    const bal = calculateAccountBalance(acc, transactions);
    if (acc.type === 'CREDIT_CARD') {
      totalCreditCardDebt += Math.max(0, bal);
    } else {
      const posBal = Math.max(0, bal);
      totalAssets += posBal;
      if (acc.type === 'CASH') cashTotal += posBal;
      else if (acc.type === 'BANK') bankTotal += posBal;
      else if (acc.type === 'WALLET') walletTotal += posBal;
      else otherAssetsTotal += posBal;
    }
  });

  const totalNetWorth = totalAssets - totalCreditCardDebt;
  return {
    totalNetWorth,
    totalAssets,
    totalCreditCardDebt,
    cashTotal,
    bankTotal,
    walletTotal,
    otherAssetsTotal,
  };
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

export interface CashFlowPeriod {
  income: number;
  expense: number;
  net: number;
}

export interface CashFlowSummary {
  today: CashFlowPeriod;
  week: CashFlowPeriod;
  month: CashFlowPeriod;
}

export const calculateCashFlowSummary = (transactions: Transaction[]): CashFlowSummary => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthPrefix = now.toISOString().slice(0, 7);

  // Start of week (Monday)
  const day = now.getDay();
  const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
  const monDate = new Date(now.setDate(diffToMon));
  const weekStartStr = monDate.toISOString().slice(0, 10);

  let todayInc = 0, todayExp = 0;
  let weekInc = 0, weekExp = 0;
  let monthInc = 0, monthExp = 0;

  transactions.forEach((t) => {
    if (t.type === 'INCOME') {
      if (t.date === todayStr) todayInc += t.amount;
      if (t.date >= weekStartStr) weekInc += t.amount;
      if (t.date.startsWith(monthPrefix)) monthInc += t.amount;
    } else if (t.type === 'EXPENSE') {
      if (t.date === todayStr) todayExp += t.amount;
      if (t.date >= weekStartStr) weekExp += t.amount;
      if (t.date.startsWith(monthPrefix)) monthExp += t.amount;
    }
  });

  return {
    today: { income: todayInc, expense: todayExp, net: todayInc - todayExp },
    week: { income: weekInc, expense: weekExp, net: weekInc - weekExp },
    month: { income: monthInc, expense: monthExp, net: monthInc - monthExp },
  };
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

/**
 * Deterministic Local Spending Insights (No AI, No Fake Data)
 */
export const generateDeterministicInsights = (
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[]
): string[] => {
  const insights: string[] = [];
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);

  // Previous month prefix
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

  // Current vs Previous month total spending
  const currentTotal = calculateExpenses(transactions, currentMonthStr);
  const prevTotal = calculateExpenses(transactions, prevMonthStr);

  if (currentTotal > 0 && prevTotal > 0) {
    const diffPct = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
    if (diffPct > 0) {
      insights.push(`Overall spending is ${diffPct}% higher than last month.`);
    } else if (diffPct < 0) {
      insights.push(`Overall spending is ${Math.abs(diffPct)}% lower than last month.`);
    }
  }

  // Top spending category this month
  const categoryTotals = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'EXPENSE' && t.date.startsWith(currentMonthStr))
    .forEach((t) => {
      const current = categoryTotals.get(t.categoryId) || 0;
      categoryTotals.set(t.categoryId, current + t.amount);
    });

  let topCatId = '';
  let topAmount = 0;
  categoryTotals.forEach((amt, catId) => {
    if (amt > topAmount) {
      topAmount = amt;
      topCatId = catId;
    }
  });

  if (topCatId && topAmount > 0) {
    const catName = categories.find((c) => c.id === topCatId)?.name || 'Categories';
    insights.push(`Your largest spending category this month is ${catName} (₹${topAmount.toLocaleString()}).`);
  }

  // Budget status insight
  budgets.forEach((b) => {
    const { remaining, percentage, status } = calculateBudgetStatus(b, transactions, currentMonthStr);
    const catName = categories.find((c) => c.id === b.categoryId)?.name || 'Category';

    if (status === 'OVER BUDGET') {
      insights.push(`Budget exceeded for ${catName} by ₹${Math.abs(remaining).toLocaleString()}.`);
    } else if (percentage >= 80) {
      insights.push(`You have ₹${remaining.toLocaleString()} remaining in your ${catName} budget.`);
    }
  });

  return insights.slice(0, 4); // Limit to top 4 deterministic insights
};

/**
 * Deterministic Financial Health Summary Statements
 */
export const generateFinancialHealthSummary = (
  transactions: Transaction[],
  budgets: Budget[],
  accounts: Account[]
): string[] => {
  const statements: string[] = [];
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const inc = calculateIncome(transactions, currentMonthStr);
  const exp = calculateExpenses(transactions, currentMonthStr);

  if (inc > 0 || exp > 0) {
    if (exp < inc) {
      statements.push("You're spending less than you earn this month.");
    } else if (exp > inc) {
      statements.push("Your expenses are higher than your income this month.");
    }
  }

  // Budget status summary
  let nearLimitCount = 0;
  budgets.forEach((b) => {
    const { percentage } = calculateBudgetStatus(b, transactions, currentMonthStr);
    if (percentage >= 75) nearLimitCount++;
  });

  if (nearLimitCount > 0) {
    statements.push(`${nearLimitCount} budget${nearLimitCount > 1 ? 's are' : ' is'} close to or over limit.`);
  }

  // Credit card balance
  const ccAccounts = accounts.filter((a) => a.type === 'CREDIT_CARD' && !a.isArchived);
  if (ccAccounts.length > 0) {
    const ccDebt = ccAccounts.reduce((sum, a) => sum + calculateAccountBalance(a, transactions), 0);
    if (ccDebt > 0) {
      statements.push(`Active credit card debt: ₹${ccDebt.toLocaleString()}`);
    }
  }

  return statements;
};

/**
 * Monthly Closing Summary
 */
export interface MonthlyClosingSummaryData {
  hasData: boolean;
  monthName: string;
  income: number;
  expenses: number;
  net: number;
  topCategoryName: string;
  topCategoryAmount: number;
  budgetsWithinLimit: number;
  totalBudgetsCount: number;
}

export const calculateMonthlyClosingSummary = (
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[]
): MonthlyClosingSummaryData => {
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);
  const monthName = prevMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const inc = calculateIncome(transactions, prevMonthStr);
  const exp = calculateExpenses(transactions, prevMonthStr);

  if (inc === 0 && exp === 0) {
    return {
      hasData: false,
      monthName,
      income: 0,
      expenses: 0,
      net: 0,
      topCategoryName: '',
      topCategoryAmount: 0,
      budgetsWithinLimit: 0,
      totalBudgetsCount: 0,
    };
  }

  // Top category in prev month
  const categoryTotals = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'EXPENSE' && t.date.startsWith(prevMonthStr))
    .forEach((t) => {
      const current = categoryTotals.get(t.categoryId) || 0;
      categoryTotals.set(t.categoryId, current + t.amount);
    });

  let topCatId = '';
  let topCategoryAmount = 0;
  categoryTotals.forEach((amt, catId) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCatId = catId;
    }
  });

  const topCategoryName = categories.find((c) => c.id === topCatId)?.name || 'N/A';

  // Budget status in prev month
  let budgetsWithinLimit = 0;
  budgets.forEach((b) => {
    const { status } = calculateBudgetStatus(b, transactions, prevMonthStr);
    if (status !== 'OVER BUDGET') budgetsWithinLimit++;
  });

  return {
    hasData: true,
    monthName,
    income: inc,
    expenses: exp,
    net: inc - exp,
    topCategoryName,
    topCategoryAmount,
    budgetsWithinLimit,
    totalBudgetsCount: budgets.length,
  };
};

/**
 * Duplicate Transaction Detection
 */
export const detectDuplicateTransaction = (
  candidate: { accountId: string; amount: number; type: string; date: string; merchant?: string; note?: string },
  existingTxs: Transaction[]
): Transaction | null => {
  const candidateMerchant = (candidate.merchant || candidate.note || '').toLowerCase().trim();

  return (
    existingTxs.find((t) => {
      if (t.accountId !== candidate.accountId) return false;
      if (Math.abs(t.amount - candidate.amount) > 0.01) return false;
      if (t.type !== candidate.type) return false;
      if (t.date !== candidate.date) return false;

      const tMerchant = (t.merchant || t.note || '').toLowerCase().trim();
      if (candidateMerchant && tMerchant && candidateMerchant === tMerchant) {
        return true;
      }
      return false;
    }) || null
  );
};

/**
 * Merchant Category Suggestion Engine (Deterministic Local Rules)
 */
export const suggestCategoryForMerchant = (
  merchantInput: string,
  categories: Category[]
): string | null => {
  if (!merchantInput || !merchantInput.trim()) return null;
  const input = merchantInput.toLowerCase().trim();

  const rules: Record<string, string[]> = {
    Shopping: ['amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'ajio', 'meesho', 'reliancedigital'],
    Food: ['swiggy', 'zomato', 'mcdonalds', 'kfc', 'dominos', 'starbucks', 'subway', 'dine', 'restaurant', 'cafe'],
    Groceries: ['blinkit', 'zepto', 'bigbasket', 'dmart', 'd-mart', 'instamart', 'grofers', 'jiomart', 'supermarket'],
    Transport: ['uber', 'ola', 'rapido', 'namma yatri', 'metro', 'petrol', 'shell', 'hpcl', 'bpcl', 'fuel', 'fastag'],
    Bills: ['bescom', 'airtel', 'jio', 'vi', 'tatasky', 'dth', 'electricity', 'gas', 'water bill'],
    Entertainment: ['netflix', 'spotify', 'bookmyshow', 'youtube', 'prime video', 'hotstar', 'cinema', 'pvr'],
  };

  for (const [targetCatName, keywords] of Object.entries(rules)) {
    if (keywords.some((kw) => input.includes(kw))) {
      const match = categories.find((c) => c.name.toLowerCase().includes(targetCatName.toLowerCase()));
      if (match) return match.id;
    }
  }

  return null;
};
