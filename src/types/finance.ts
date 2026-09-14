export type AccountType = 'BANK' | 'CASH' | 'CREDIT_CARD' | 'WALLET' | 'OTHER';

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number; // Derived dynamically; openingBalance + transactions
  openingBalance: number;
  creditLimit?: number; // For Credit Cards
  institution?: string;
  color?: string;
  currency: string;
  isArchived?: boolean;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId?: string; // Destination account for transfers
  categoryId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  merchant?: string;
  description?: string;
  note: string;
  paymentMethod?: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
}

export interface RecurringPayment {
  id: string;
  title: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  nextDueDate: string; // YYYY-MM-DD
  accountId: string;
  categoryId: string;
  isPaused: boolean;
  reminderDaysBefore?: number;
  note?: string;
}

export interface NotificationItem {
  id: string;
  type: 'BUDGET_ALERT' | 'RECURRING_REMINDER' | 'DAILY_REMINDER' | 'SUMMARY';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

export interface AppSettings {
  hideBalances: boolean;
  pinEnabled: boolean;
  hashedPin: string; // Hashed SHA-256 string (NOT plaintext!)
  currency: string;
  lastSyncedAt: string;
  demoModeLoaded?: boolean;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  recurringPayments: RecurringPayment[];
  categories: Category[];
  notifications: NotificationItem[];
  settings: AppSettings;
}
