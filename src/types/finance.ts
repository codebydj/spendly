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
  // Optional Location fields
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  locationPlaceId?: string;
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
  dueTime?: string; // HH:mm
  accountId: string;
  categoryId: string;
  isPaused: boolean;
  reminderDaysBefore?: number;
  note?: string;
}

export interface NotificationItem {
  id: string;
  type: 'BUDGET_ALERT' | 'RECURRING_REMINDER' | 'DAILY_REMINDER' | 'SUMMARY' | 'APP_UPDATE';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  versionManifest?: AppVersionManifest;
}

export interface AppSettings {
  hideBalances: boolean;
  pinEnabled: boolean;
  hashedPin: string; // Hashed SHA-256 string (NOT plaintext!)
  currency: string;
  lastSyncedAt: string;
  demoModeLoaded?: boolean;
  notifyAppUpdates?: boolean;
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

export interface PendingSyncOperation {
  id: string;
  user_id: string;
  entity: 'transactions' | 'accounts' | 'budgets' | 'recurring_payments' | 'notifications' | 'categories' | 'user_settings';
  entity_id: string;
  operation: 'upsert' | 'delete';
  payload?: any;
  created_at: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export interface AppVersionManifest {
  version: string;
  releaseDate: string;
  title: string;
  message: string;
  downloadUrl?: string;
  releaseNotesUrl?: string;
  releaseNotes?: string[];
}
