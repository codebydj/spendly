import type { Account, Category, Transaction, Budget, RecurringPayment, NotificationItem, AppSettings, BackupData } from '../types/finance';
import { IndexedDBService, STORES } from './indexedDB';
import { APP_VERSION } from '../config/appVersion';
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
  DEMO_NOTIFICATIONS,
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

  // --- ACCOUNTS ---
  public static loadAccounts(userId?: string): Account[] {
    const key = this.getKey(BASE_KEYS.ACCOUNTS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (userId) return [];
      this.saveAccounts(PRODUCTION_ACCOUNTS, userId);
      return PRODUCTION_ACCOUNTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return userId ? [] : PRODUCTION_ACCOUNTS;
    }
  }

  public static saveAccounts(accounts: Account[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.ACCOUNTS, userId);
    localStorage.setItem(key, JSON.stringify(accounts));
    if (userId) {
      IndexedDBService.saveStoreItems(STORES.ACCOUNTS, accounts, userId);
    }
  }

  // --- CATEGORIES ---
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
    if (userId) {
      IndexedDBService.saveStoreItems(STORES.CATEGORIES, categories, userId);
    }
  }

  // --- TRANSACTIONS ---
  public static loadTransactions(userId?: string): Transaction[] {
    const key = this.getKey(BASE_KEYS.TRANSACTIONS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (userId) return [];
      this.saveTransactions(PRODUCTION_TRANSACTIONS, userId);
      return PRODUCTION_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return userId ? [] : PRODUCTION_TRANSACTIONS;
    }
  }

  public static saveTransactions(transactions: Transaction[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.TRANSACTIONS, userId);
    localStorage.setItem(key, JSON.stringify(transactions));
    if (userId) {
      IndexedDBService.saveStoreItems(STORES.TRANSACTIONS, transactions, userId);
    }
  }

  // --- BUDGETS ---
  public static loadBudgets(userId?: string): Budget[] {
    const key = this.getKey(BASE_KEYS.BUDGETS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (userId) return [];
      this.saveBudgets(PRODUCTION_BUDGETS, userId);
      return PRODUCTION_BUDGETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return userId ? [] : PRODUCTION_BUDGETS;
    }
  }

  public static saveBudgets(budgets: Budget[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.BUDGETS, userId);
    localStorage.setItem(key, JSON.stringify(budgets));
    if (userId) {
      IndexedDBService.saveStoreItems(STORES.BUDGETS, budgets, userId);
    }
  }

  // --- RECURRING PAYMENTS ---
  public static loadRecurring(userId?: string): RecurringPayment[] {
    const key = this.getKey(BASE_KEYS.RECURRING, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (userId) return [];
      this.saveRecurring(PRODUCTION_RECURRING, userId);
      return PRODUCTION_RECURRING;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return userId ? [] : PRODUCTION_RECURRING;
    }
  }

  public static saveRecurring(recurring: RecurringPayment[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.RECURRING, userId);
    localStorage.setItem(key, JSON.stringify(recurring));
    if (userId) {
      IndexedDBService.saveStoreItems(STORES.RECURRING, recurring, userId);
    }
  }

  // --- NOTIFICATIONS ---
  public static loadNotifications(userId?: string): NotificationItem[] {
    const key = this.getKey(BASE_KEYS.NOTIFICATIONS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (userId) return [];
      this.saveNotifications(PRODUCTION_NOTIFICATIONS, userId);
      return PRODUCTION_NOTIFICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return userId ? [] : PRODUCTION_NOTIFICATIONS;
    }
  }

  public static saveNotifications(notifications: NotificationItem[], userId?: string): void {
    const key = this.getKey(BASE_KEYS.NOTIFICATIONS, userId);
    localStorage.setItem(key, JSON.stringify(notifications));
    if (userId) {
      IndexedDBService.saveStoreItems(STORES.NOTIFICATIONS, notifications, userId);
    }
  }

  // --- SETTINGS ---
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
    if (userId) {
      IndexedDBService.saveSettings(settings, userId);
    }
  }

  // --- DEMO DATA ---
  public static loadDemoData(userId?: string): void {
    this.saveAccounts(DEMO_ACCOUNTS, userId);
    this.saveTransactions(DEMO_TRANSACTIONS, userId);
    this.saveBudgets(DEMO_BUDGETS, userId);
    this.saveRecurring(DEMO_RECURRING, userId);
    this.saveNotifications(DEMO_NOTIFICATIONS, userId);
    const settings = this.loadSettings(userId);
    this.saveSettings({ ...settings, demoModeLoaded: true }, userId);
  }

  // --- BACKUP IMPORT / EXPORT ---
  public static exportFullBackup(userId?: string): BackupData {
    return {
      version: APP_VERSION,
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

  // --- RESET LOCAL DATA ---
  public static resetToEmptyProduction(userId?: string): void {
    const keyAcc = this.getKey(BASE_KEYS.ACCOUNTS, userId);
    const keyCat = this.getKey(BASE_KEYS.CATEGORIES, userId);
    const keyTx = this.getKey(BASE_KEYS.TRANSACTIONS, userId);
    const keyB = this.getKey(BASE_KEYS.BUDGETS, userId);
    const keyRec = this.getKey(BASE_KEYS.RECURRING, userId);
    const keyNotif = this.getKey(BASE_KEYS.NOTIFICATIONS, userId);
    const keySet = this.getKey(BASE_KEYS.SETTINGS, userId);

    localStorage.removeItem(keyAcc);
    localStorage.removeItem(keyCat);
    localStorage.removeItem(keyTx);
    localStorage.removeItem(keyB);
    localStorage.removeItem(keyRec);
    localStorage.removeItem(keyNotif);
    localStorage.removeItem(keySet);

    if (userId) {
      IndexedDBService.clearUserData(userId);
    }
  }
}
