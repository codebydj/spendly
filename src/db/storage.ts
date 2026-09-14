import type { Account, Category, Transaction, Budget, RecurringPayment, NotificationItem, AppSettings, BackupData } from '../types/finance';
import {
  INITIAL_CATEGORIES,
  PRODUCTION_ACCOUNTS,
  PRODUCTION_TRANSACTIONS,
  PRODUCTION_BUDGETS,
  PRODUCTION_RECURRING,
  PRODUCTION_NOTIFICATIONS,
  INITIAL_SETTINGS,
  DEMO_ACCOUNTS,
  DEMO_TRANSACTIONS,
  DEMO_BUDGETS,
  DEMO_RECURRING,
} from './initialData';

const BASE_KEYS = {
  ACCOUNTS: 'accounts_v2',
  CATEGORIES: 'categories_v2',
  TRANSACTIONS: 'transactions_v2',
  BUDGETS: 'budgets_v2',
  RECURRING: 'recurring_v2',
  NOTIFICATIONS: 'notifications_v2',
  SETTINGS: 'settings_v2',
};

export class StorageEngine {
  private static getKey(baseKey: string, userId?: string): string {
    const prefix = userId ? `spendly_${userId}_` : `spendly_guest_`;
    return prefix + baseKey;
  }

  public static loadAccounts(userId?: string): Account[] {
    const key = this.getKey(BASE_KEYS.ACCOUNTS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveAccounts(PRODUCTION_ACCOUNTS, userId);
      return PRODUCTION_ACCOUNTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return PRODUCTION_ACCOUNTS;
    }
  }

  public static saveAccounts(accounts: Account[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.ACCOUNTS, userId);
    localStorage.setItem(key, JSON.stringify(accounts));
  }

  public static loadCategories(userId?: string): Category[] {
    const key = this.getKey(BASE_KEYS.CATEGORIES, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveCategories(INITIAL_CATEGORIES, userId);
      return INITIAL_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  public static saveCategories(categories: Category[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.CATEGORIES, userId);
    localStorage.setItem(key, JSON.stringify(categories));
  }

  public static loadTransactions(userId?: string): Transaction[] {
    const key = this.getKey(BASE_KEYS.TRANSACTIONS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveTransactions(PRODUCTION_TRANSACTIONS, userId);
      return PRODUCTION_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return PRODUCTION_TRANSACTIONS;
    }
  }

  public static saveTransactions(transactions: Transaction[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.TRANSACTIONS, userId);
    localStorage.setItem(key, JSON.stringify(transactions));
  }

  public static loadBudgets(userId?: string): Budget[] {
    const key = this.getKey(BASE_KEYS.BUDGETS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveBudgets(PRODUCTION_BUDGETS, userId);
      return PRODUCTION_BUDGETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return PRODUCTION_BUDGETS;
    }
  }

  public static saveBudgets(budgets: Budget[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.BUDGETS, userId);
    localStorage.setItem(key, JSON.stringify(budgets));
  }

  public static loadRecurring(userId?: string): RecurringPayment[] {
    const key = this.getKey(BASE_KEYS.RECURRING, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveRecurring(PRODUCTION_RECURRING, userId);
      return PRODUCTION_RECURRING;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return PRODUCTION_RECURRING;
    }
  }

  public static saveRecurring(recurring: RecurringPayment[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.RECURRING, userId);
    localStorage.setItem(key, JSON.stringify(recurring));
  }

  public static loadNotifications(userId?: string): NotificationItem[] {
    const key = this.getKey(BASE_KEYS.NOTIFICATIONS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveNotifications(PRODUCTION_NOTIFICATIONS, userId);
      return PRODUCTION_NOTIFICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return PRODUCTION_NOTIFICATIONS;
    }
  }

  public static saveNotifications(notifications: NotificationItem[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.NOTIFICATIONS, userId);
    localStorage.setItem(key, JSON.stringify(notifications));
  }

  public static loadSettings(userId?: string): AppSettings {
    const key = this.getKey(BASE_KEYS.SETTINGS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.saveSettings(INITIAL_SETTINGS, userId);
      return INITIAL_SETTINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  public static saveSettings(settings: AppSettings, userId?: string): void {
    const key = this.getKey(BASE_KEYS.SETTINGS, userId);
    localStorage.setItem(key, JSON.stringify(settings));
  }

  public static loadDemoData(userId?: string): void {
    this.saveAccounts(DEMO_ACCOUNTS, userId);
    this.saveTransactions(DEMO_TRANSACTIONS, userId);
    this.saveBudgets(DEMO_BUDGETS, userId);
    this.saveRecurring(DEMO_RECURRING, userId);
    const settings = this.loadSettings(userId);
    this.saveSettings({ ...settings, demoModeLoaded: true }, userId);
  }

  public static exportFullBackup(userId?: string): BackupData {
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      accounts: this.loadAccounts(userId),
      categories: this.loadCategories(userId),
      transactions: this.loadTransactions(userId),
      budgets: this.loadBudgets(userId),
      recurringPayments: this.loadRecurring(userId),
      notifications: this.loadNotifications(userId),
      settings: this.loadSettings(userId),
    };
  }

  public static importFullBackup(data: BackupData, userId?: string): boolean {
    if (!data || !Array.isArray(data.accounts) || !Array.isArray(data.transactions)) {
      return false;
    }
    this.saveAccounts(data.accounts, userId);
    this.saveCategories(data.categories || INITIAL_CATEGORIES, userId);
    this.saveTransactions(data.transactions, userId);
    this.saveBudgets(data.budgets || [], userId);
    this.saveRecurring(data.recurringPayments || [], userId);
    this.saveNotifications(data.notifications || [], userId);
    this.saveSettings(data.settings || INITIAL_SETTINGS, userId);
    return true;
  }

  public static resetToEmptyProduction(userId?: string): void {
    this.saveAccounts(PRODUCTION_ACCOUNTS, userId);
    this.saveCategories(INITIAL_CATEGORIES, userId);
    this.saveTransactions(PRODUCTION_TRANSACTIONS, userId);
    this.saveBudgets(PRODUCTION_BUDGETS, userId);
    this.saveRecurring(PRODUCTION_RECURRING, userId);
    this.saveNotifications(PRODUCTION_NOTIFICATIONS, userId);
    this.saveSettings(INITIAL_SETTINGS, userId);
  }
}
