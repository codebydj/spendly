import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Account, Transaction, Budget, RecurringPayment, NotificationItem, AppSettings, Category, BackupData } from '../types/finance';
import { StorageEngine } from '../db/storage';
import { supabase } from '../services/supabase';
import { SyncService } from '../services/syncService';
import { soundService } from '../services/soundService';
import { hashPin, verifyPin } from '../utils/crypto';
import {
  calculateAccountBalance,
  calculateNetWorth,
  calculateIncome,
  calculateExpenses,
  calculateBudgetStatus,
} from '../utils/calculations';

export type ViewType =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'analytics'
  | 'recurring'
  | 'calendar'
  | 'maps'
  | 'notifications'
  | 'settings'
  | 'login'
  | 'signup';

export type SyncStatus = 'OFFLINE' | 'LOCAL_CHANGES' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  message: string;
}

interface AppContextType {
  // Navigation & View
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedAccountIdForDetail: string | null;
  setSelectedAccountIdForDetail: (id: string | null) => void;

  // Auth & Sync State
  user: any;
  userProfile: { fullName?: string; email?: string } | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  lastSyncError: string | null;
  lastSyncTime: string | null;
  runSyncDiagnostic: () => Promise<{ success: boolean; message: string; details?: any }>;
  soundEnabled: boolean;
  toggleSoundEnabled: () => void;
  logout: () => Promise<void>;
  triggerCloudSync: () => Promise<void>;
  triggerManualSync: () => Promise<boolean>;

  // Data
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurringPayments: RecurringPayment[];
  notifications: NotificationItem[];
  settings: AppSettings;
  isOffline: boolean;
  isPinLocked: boolean;
  setIsPinLocked: (locked: boolean) => void;

  // Modals state
  isAddTransactionOpen: boolean;
  setIsAddTransactionOpen: (open: boolean) => void;
  isAddAccountOpen: boolean;
  setIsAddAccountOpen: (open: boolean) => void;
  isAddBudgetOpen: boolean;
  setIsAddBudgetOpen: (open: boolean) => void;
  isAddRecurringOpen: boolean;
  setIsAddRecurringOpen: (open: boolean) => void;

  // Search & Global Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // CRUD Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editTransaction: (id: string, tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (acc: Omit<Account, 'id' | 'updatedAt' | 'balance'>) => void;
  archiveAccount: (id: string) => void;
  addBudget: (b: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;
  addRecurring: (r: Omit<RecurringPayment, 'id'>) => void;
  togglePauseRecurring: (id: string) => void;
  deleteRecurring: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Settings & Profile Actions
  toggleHideBalances: () => void;
  setPinCode: (pin: string) => Promise<void>;
  validatePin: (pin: string) => Promise<boolean>;
  updateProfileName: (fullName: string) => Promise<boolean>;
  updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  importBackupData: (data: BackupData) => boolean;
  resetLocalData: () => void;
  resetAllData: () => Promise<void>;
  loadDemoData: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'danger') => void;
  removeToast: (id: string) => void;

  // Derived Calculations
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  unreadNotificationCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [selectedAccountIdForDetail, setSelectedAccountIdForDetail] = useState<string | null>(null);

  // Auth & Sync
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ fullName?: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'SYNCED' : 'OFFLINE');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(soundService.getSoundEnabled());

  const toggleSoundEnabled = () => {
    const next = !soundEnabled;
    soundService.setSoundEnabled(next);
    setSoundEnabledState(next);
    showToast(next ? 'Sound effects enabled' : 'Sound effects muted', 'info');
  };

  // Memory Financial Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageEngine.loadSettings());

  // Security & App UI
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'danger' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Helper to re-calculate account balances dynamically based on transactions
  const updateAccountBalances = useCallback((accList: Account[], txList: Transaction[]): Account[] => {
    return accList.map((acc) => ({
      ...acc,
      balance: calculateAccountBalance(acc, txList),
      updatedAt: acc.updatedAt || new Date().toISOString(),
    }));
  }, []);

  // Hydrate User Data from Supabase Cloud on Login / App Startup
  const loadUserData = useCallback(
    async (userId: string) => {
      setSyncStatus('SYNCING');

      // 1. Immediately hydrate local storage cache for userId if present
      const cachedAccs = StorageEngine.loadAccounts(userId);
      const cachedTxs = StorageEngine.loadTransactions(userId);
      const cachedBudgets = StorageEngine.loadBudgets(userId);
      const cachedRec = StorageEngine.loadRecurring(userId);
      const cachedNotifs = StorageEngine.loadNotifications(userId);
      const cachedSettings = StorageEngine.loadSettings(userId);
      const localCats = StorageEngine.loadCategories(userId);

      if (cachedAccs.length > 0 || cachedTxs.length > 0) {
        const recalculated = updateAccountBalances(cachedAccs, cachedTxs);
        setAccounts(recalculated);
        setTransactions(cachedTxs);
        setBudgets(cachedBudgets);
        setRecurringPayments(cachedRec);
        setNotifications(cachedNotifs);
        setSettings(cachedSettings);
        setCategories(localCats);
      }

      // 2. Fetch Cloud Records from Supabase (Cloud Source of Truth)
      try {
        const cloudData = await SyncService.fetchUserData(userId);

        if (cloudData.hasCloudData) {
          // Cloud records exist! Hydrate state & local cache from Supabase
          const recalculatedAccounts = updateAccountBalances(cloudData.accounts, cloudData.transactions);

          // Update local storage cache
          StorageEngine.saveAccounts(recalculatedAccounts, userId);
          StorageEngine.saveTransactions(cloudData.transactions, userId);
          StorageEngine.saveBudgets(cloudData.budgets, userId);
          StorageEngine.saveRecurring(cloudData.recurringPayments, userId);
          StorageEngine.saveNotifications(cloudData.notifications, userId);
          if (cloudData.settings) {
            StorageEngine.saveSettings(cloudData.settings, userId);
          }

          // Update React State
          setAccounts(recalculatedAccounts);
          setCategories(localCats);
          setTransactions(cloudData.transactions);
          setBudgets(cloudData.budgets);
          setRecurringPayments(cloudData.recurringPayments);
          setNotifications(cloudData.notifications);
          if (cloudData.settings) {
            setSettings(cloudData.settings);
            setIsPinLocked(cloudData.settings.pinEnabled);
          }
          if (cloudData.profile) {
            setUserProfile(cloudData.profile);
          }
          setSyncStatus('SYNCED');
        } else {
          // No cloud records returned. Check if local storage contains an existing offline dataset
          const hasLocalRecords = cachedAccs.length > 0 || cachedTxs.length > 0 || cachedBudgets.length > 0 || cachedRec.length > 0;

          if (hasLocalRecords && navigator.onLine) {
            // Upload local dataset to Supabase for newly linked user
            const backup: BackupData = {
              version: '2.0.0',
              exportedAt: new Date().toISOString(),
              accounts: cachedAccs,
              categories: localCats,
              transactions: cachedTxs,
              budgets: cachedBudgets,
              recurringPayments: cachedRec,
              notifications: cachedNotifs,
              settings: cachedSettings,
            };
            await SyncService.uploadLocalDataToCloud(backup, userId);

            const recalculatedAccounts = updateAccountBalances(cachedAccs, cachedTxs);
            setAccounts(recalculatedAccounts);
            setCategories(localCats);
            setTransactions(cachedTxs);
            setBudgets(cachedBudgets);
            setRecurringPayments(cachedRec);
            setNotifications(cachedNotifs);
            setSettings(cachedSettings);
            setIsPinLocked(cachedSettings.pinEnabled);
            setSyncStatus('SYNCED');
          } else {
            // Clean New User with zero data anywhere
            setAccounts([]);
            setCategories(localCats);
            setTransactions([]);
            setBudgets([]);
            setRecurringPayments([]);
            setNotifications([]);
            setSettings(cachedSettings);
            setIsPinLocked(false);
            setSyncStatus(navigator.onLine ? 'SYNCED' : 'OFFLINE');
          }
        }
      } catch (err) {
        console.error('loadUserData exception:', err);
        setSyncStatus(navigator.onLine ? 'SYNC_FAILED' : 'OFFLINE');
      }
    },
    [updateAccountBalances]
  );

  // Sync state back to local storage whenever in-memory data changes for active user
  useEffect(() => {
    if (user?.id) {
      StorageEngine.saveAccounts(accounts, user.id);
    }
  }, [accounts, user?.id]);

  useEffect(() => {
    if (user?.id) {
      StorageEngine.saveTransactions(transactions, user.id);
    }
  }, [transactions, user?.id]);

  useEffect(() => {
    if (user?.id) {
      StorageEngine.saveBudgets(budgets, user.id);
    }
  }, [budgets, user?.id]);

  useEffect(() => {
    if (user?.id) {
      StorageEngine.saveRecurring(recurringPayments, user.id);
    }
  }, [recurringPayments, user?.id]);

  useEffect(() => {
    if (user?.id) {
      StorageEngine.saveNotifications(notifications, user.id);
    }
  }, [notifications, user?.id]);

  useEffect(() => {
    if (user?.id) {
      StorageEngine.saveSettings(settings, user.id);
    }
  }, [settings, user?.id]);

  // Full Cloud Sync trigger
  const triggerCloudSync = useCallback(async () => {
    if (!user?.id || !navigator.onLine) {
      setSyncStatus(navigator.onLine ? 'SYNCED' : 'OFFLINE');
      return;
    }

    setSyncStatus('SYNCING');
    try {
      const nowIso = new Date().toISOString();
      const updatedSettings = { ...settings, lastSyncedAt: nowIso };

      const backup: BackupData = {
        version: '2.0.0',
        exportedAt: nowIso,
        accounts,
        categories,
        transactions,
        budgets,
        recurringPayments,
        notifications,
        settings: updatedSettings,
      };

      const success = await SyncService.uploadLocalDataToCloud(backup, user.id);
      if (success) {
        setSettings(updatedSettings);
        setSyncStatus('SYNCED');
      } else {
        setSyncStatus('SYNC_FAILED');
      }
    } catch {
      setSyncStatus('SYNC_FAILED');
    }
  }, [user?.id, accounts, categories, transactions, budgets, recurringPayments, notifications, settings]);

  // Explicit Manual Supabase Cloud Synchronization Control
  const triggerManualSync = async (): Promise<boolean> => {
    if (!user?.id) {
      showToast('Please sign in to synchronize cloud data', 'warning');
      return false;
    }
    if (!navigator.onLine) {
      setSyncStatus('OFFLINE');
      showToast('Working offline. Local changes will sync when connected', 'warning');
      return false;
    }

    setSyncStatus('SYNCING');
    setLastSyncError(null);

    console.group('SPENDLY MANUAL SYNC');
    console.log('Authenticated user:', user);
    console.log('User ID:', user?.id);
    console.log('Local accounts:', accounts);
    console.log('Local transactions:', transactions);
    console.log('Local budgets:', budgets);
    console.log('Local recurring payments:', recurringPayments);
    console.log('Local notifications:', notifications);
    console.groupEnd();

    try {
      // 1. Upload local dataset to cloud FIRST
      const backup: BackupData = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        accounts,
        categories,
        transactions,
        budgets,
        recurringPayments,
        notifications,
        settings,
      };

      await SyncService.uploadLocalDataToCloud(backup, user.id);

      // 2. Fetch latest cloud records from Supabase
      const cloudData = await SyncService.fetchUserData(user.id);

      // 3. Hydrate state
      if (cloudData.hasCloudData) {
        const recalculated = updateAccountBalances(cloudData.accounts, cloudData.transactions);
        setAccounts(recalculated);
        setTransactions(cloudData.transactions);
        setBudgets(cloudData.budgets);
        setRecurringPayments(cloudData.recurringPayments);
        setNotifications(cloudData.notifications);
        if (cloudData.settings) setSettings(cloudData.settings);
        if (cloudData.profile) setUserProfile(cloudData.profile);

        // Update local storage cache
        StorageEngine.saveAccounts(recalculated, user.id);
        StorageEngine.saveTransactions(cloudData.transactions, user.id);
        StorageEngine.saveBudgets(cloudData.budgets, user.id);
        StorageEngine.saveRecurring(cloudData.recurringPayments, user.id);
        StorageEngine.saveNotifications(cloudData.notifications, user.id);
        if (cloudData.settings) StorageEngine.saveSettings(cloudData.settings, user.id);
      }

      setSyncStatus('SYNCED');
      setLastSyncTime(new Date().toLocaleTimeString());
      setLastSyncError(null);
      soundService.playSyncChime();
      showToast('Data synchronized with Supabase cloud', 'success');
      return true;
    } catch (err: any) {
      console.error('SPENDLY MANUAL SYNC ERROR:', err);
      const msg = err?.message || err?.details || String(err);
      setLastSyncError(msg);
      setSyncStatus('SYNC_FAILED');
      showToast(`Sync issue: ${msg}`, 'danger');
      return false;
    }
  };

  const runSyncDiagnostic = async () => {
    if (!user?.id) {
      return { success: false, message: 'User is not authenticated' };
    }
    return await SyncService.runSyncDiagnostic(user.id);
  };

  // Handle Auth Session Lifecycle
  useEffect(() => {
    let isMounted = true;

    // Get current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id).then(() => {
          if (isMounted) setAuthLoading(false);
        });
        setCurrentView((prev) => (prev === 'login' || prev === 'signup' ? 'dashboard' : prev));
      } else {
        setUser(null);
        setUserProfile(null);
        setAccounts([]);
        setTransactions([]);
        setBudgets([]);
        setRecurringPayments([]);
        setNotifications([]);
        setAuthLoading(false);
      }
    }).catch(() => {
      if (isMounted) setAuthLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id).then(() => {
          if (isMounted) setAuthLoading(false);
        });
        setCurrentView((prev) => (prev === 'login' || prev === 'signup' ? 'dashboard' : prev));
      } else {
        setUser(null);
        setUserProfile(null);
        setAccounts([]);
        setTransactions([]);
        setBudgets([]);
        setRecurringPayments([]);
        setNotifications([]);
        setCurrentView('login');
        setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Network Status Monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatus('SYNCED');
      showToast('Online connection restored', 'info');
      if (user?.id) triggerCloudSync();
    };
    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('OFFLINE');
      showToast('Offline mode - local data saved', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id, triggerCloudSync, showToast]);

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Fallback
    } finally {
      setUser(null);
      setUserProfile(null);
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setRecurringPayments([]);
      setNotifications([]);
      showToast('Signed out successfully', 'info');
      setCurrentView('login');
    }
  };

  // Add Transaction
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    soundService.playTransactionChime();
    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);

    const updatedAccs = updateAccountBalances(accounts, updatedTxs);
    setAccounts(updatedAccs);

    if (newTx.type === 'EXPENSE') {
      const categoryBudget = budgets.find((b) => b.categoryId === newTx.categoryId);
      if (categoryBudget) {
        const catObj = categories.find((c) => c.id === newTx.categoryId);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { spent, limit, status } = calculateBudgetStatus(categoryBudget, updatedTxs, currentMonth);

        if (status === 'OVER BUDGET' || status === '80% REACHED') {
          const newNotif: NotificationItem = {
            id: 'notif-' + Date.now(),
            type: 'BUDGET_ALERT',
            title: status === 'OVER BUDGET' ? 'Budget Exceeded' : 'Budget Warning',
            message: `Category ${catObj?.name || ''} spending is ₹${spent.toLocaleString()} / Limit ₹${limit.toLocaleString()} (${status}).`,
            date: new Date().toISOString(),
            isRead: false,
          };
          setNotifications((prev) => [newNotif, ...prev]);
          if (user?.id) SyncService.upsertNotification(newNotif, user.id);
          showToast(`Budget alert: ${catObj?.name || ''} is ${status}`, 'warning');
        }
      }
    }

    const catName = categories.find((c) => c.id === newTx.categoryId)?.name || '';
    showToast(
      newTx.type === 'TRANSFER'
        ? `Transferred ₹${newTx.amount.toLocaleString()} between accounts`
        : `Added ${newTx.type.toLowerCase()}: ₹${newTx.amount.toLocaleString()} (${catName})`,
      'success'
    );

    // Supabase Cloud Write
    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const txOk = await SyncService.upsertTransaction(newTx, user.id);
      // Also update account balances in cloud
      const accPromises = updatedAccs.map((a) => SyncService.upsertAccount(a, user.id));
      await Promise.all(accPromises);
      setSyncStatus(txOk ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  // Edit Transaction
  const editTransaction = async (id: string, txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const updatedTxs = transactions.map((t) =>
      t.id === id ? { ...t, ...txData, updatedAt: new Date().toISOString() } : t
    );
    const editedTx = updatedTxs.find((t) => t.id === id);
    setTransactions(updatedTxs);

    const updatedAccs = updateAccountBalances(accounts, updatedTxs);
    setAccounts(updatedAccs);

    showToast('Transaction updated', 'success');

    if (user?.id && editedTx && navigator.onLine) {
      setSyncStatus('SYNCING');
      const txOk = await SyncService.upsertTransaction(editedTx, user.id);
      const accPromises = updatedAccs.map((a) => SyncService.upsertAccount(a, user.id));
      await Promise.all(accPromises);
      setSyncStatus(txOk ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id: string) => {
    const updatedTxs = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTxs);

    const updatedAccs = updateAccountBalances(accounts, updatedTxs);
    setAccounts(updatedAccs);

    showToast('Transaction deleted', 'info');

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const delOk = await SyncService.deleteTransaction(id, user.id);
      const accPromises = updatedAccs.map((a) => SyncService.upsertAccount(a, user.id));
      await Promise.all(accPromises);
      setSyncStatus(delOk ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  // Add Account
  const addAccount = async (accData: Omit<Account, 'id' | 'updatedAt' | 'balance'>) => {
    const newAcc: Account = {
      ...accData,
      id: 'acc-' + Date.now(),
      balance: accData.openingBalance,
      currency: '₹',
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };
    const updatedAccs = [...accounts, newAcc];
    const recalculated = updateAccountBalances(updatedAccs, transactions);
    setAccounts(recalculated);

    showToast(`Account "${newAcc.name}" created`, 'success');

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const accOk = await SyncService.upsertAccount(newAcc, user.id);
      setSyncStatus(accOk ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  // Archive Account
  const archiveAccount = async (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    const updatedAcc: Account = { ...target, isArchived: true, updatedAt: new Date().toISOString() };

    setAccounts((prev) => prev.map((acc) => (acc.id === id ? updatedAcc : acc)));
    showToast('Account archived', 'info');

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const ok = await SyncService.upsertAccount(updatedAcc, user.id);
      setSyncStatus(ok ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  // Add Budget
  const addBudget = async (bData: Omit<Budget, 'id'>) => {
    const existing = budgets.find((b) => b.categoryId === bData.categoryId);
    let targetBudget: Budget;

    if (existing) {
      targetBudget = { ...existing, monthlyLimit: bData.monthlyLimit };
      setBudgets((prev) => prev.map((b) => (b.id === existing.id ? targetBudget : b)));
    } else {
      targetBudget = {
        id: 'b-' + Date.now(),
        ...bData,
      };
      setBudgets((prev) => [...prev, targetBudget]);
    }

    showToast('Budget limit saved', 'success');

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const ok = await SyncService.upsertBudget(targetBudget, user.id);
      setSyncStatus(ok ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  // Delete Budget
  const deleteBudget = async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    showToast('Budget removed', 'info');

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const ok = await SyncService.deleteBudget(id, user.id);
      setSyncStatus(ok ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  // Add Recurring
  const addRecurring = async (rData: Omit<RecurringPayment, 'id'>) => {
    const newR: RecurringPayment = {
      id: 'rec-' + Date.now(),
      ...rData,
    };
    setRecurringPayments((prev) => [...prev, newR]);
    showToast(`Recurring payment "${newR.title}" saved`, 'success');

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const ok = await SyncService.upsertRecurring(newR, user.id);
      setSyncStatus(ok ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  const togglePauseRecurring = async (id: string) => {
    const target = recurringPayments.find((r) => r.id === id);
    if (!target) return;
    const updated = { ...target, isPaused: !target.isPaused };

    setRecurringPayments((prev) => prev.map((r) => (r.id === id ? updated : r)));
    showToast('Recurring payment status updated', 'info');

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const ok = await SyncService.upsertRecurring(updated, user.id);
      setSyncStatus(ok ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  const deleteRecurring = async (id: string) => {
    setRecurringPayments((prev) => prev.filter((r) => r.id !== id));
    showToast('Recurring payment removed', 'info');

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const ok = await SyncService.deleteRecurring(id, user.id);
      setSyncStatus(ok ? 'SYNCED' : 'SYNC_FAILED');
    } else {
      setSyncStatus('LOCAL_CHANGES');
    }
  };

  // Notifications
  const markNotificationRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;
    const updated = { ...target, isRead: true };

    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));

    if (user?.id && navigator.onLine) {
      SyncService.upsertNotification(updated, user.id);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    showToast('Notifications cleared', 'info');

    if (user?.id && navigator.onLine) {
      SyncService.clearNotifications(user.id);
    }
  };

  // Settings & Security
  const toggleHideBalances = () => {
    const updated = { ...settings, hideBalances: !settings.hideBalances };
    setSettings(updated);
    if (user?.id && navigator.onLine) {
      SyncService.upsertSettings(updated, user.id);
    }
  };

  const setPinCode = async (pin: string) => {
    let updated: AppSettings;
    if (!pin) {
      updated = { ...settings, hashedPin: '', pinEnabled: false };
      setSettings(updated);
      showToast('PIN protection disabled', 'info');
    } else {
      const hashed = await hashPin(pin);
      updated = { ...settings, hashedPin: hashed, pinEnabled: true };
      setSettings(updated);
      showToast('4-digit PIN protection enabled', 'info');
    }

    if (user?.id && navigator.onLine) {
      SyncService.upsertSettings(updated, user.id);
    }
  };

  const validatePin = async (pin: string): Promise<boolean> => {
    if (!settings.hashedPin) return true;
    return await verifyPin(pin, settings.hashedPin);
  };

  const updateProfileName = async (fullName: string): Promise<boolean> => {
    if (!user?.id || !user?.email) return false;
    const success = await SyncService.updateUserProfile(user.id, user.email, fullName);
    if (success) {
      setUserProfile((prev) => ({ ...prev, fullName, email: user.email }));
      setUser((prevUser: any) => {
        if (!prevUser) return prevUser;
        return {
          ...prevUser,
          user_metadata: {
            ...prevUser.user_metadata,
            full_name: fullName,
          },
        };
      });
      showToast('Profile name updated successfully', 'success');
      return true;
    }
    showToast('Failed to update profile name', 'danger');
    return false;
  };

  const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const res = await SyncService.updatePassword(newPassword);
    if (res.success) {
      showToast('Password updated successfully', 'success');
    } else {
      showToast(res.error || 'Failed to update password', 'danger');
    }
    return res;
  };

  const importBackupData = (data: BackupData): boolean => {
    const success = StorageEngine.importFullBackup(data, user?.id);
    if (success) {
      if (user?.id) {
        loadUserData(user.id);
        triggerCloudSync();
      }
      showToast('Backup restored successfully!', 'success');
      return true;
    }
    showToast('Failed to import backup file', 'danger');
    return false;
  };

  const loadDemoData = async () => {
    // Check duplicate sample load
    const isAlreadyLoaded = accounts.some((a) => a.id === 'acc-sbi') || transactions.some((t) => t.id === 'tx-1');
    if (isAlreadyLoaded) {
      showToast('Sample dataset is already loaded in your workspace', 'info');
      return;
    }

    StorageEngine.loadDemoData(user?.id);
    const demoAccs = StorageEngine.loadAccounts(user?.id);
    const demoTxs = StorageEngine.loadTransactions(user?.id);
    const demoBudgets = StorageEngine.loadBudgets(user?.id);
    const demoRec = StorageEngine.loadRecurring(user?.id);
    const demoNotifs = StorageEngine.loadNotifications(user?.id);
    const demoSettings = StorageEngine.loadSettings(user?.id);

    setAccounts(demoAccs);
    setTransactions(demoTxs);
    setBudgets(demoBudgets);
    setRecurringPayments(demoRec);
    setNotifications(demoNotifs);
    setSettings(demoSettings);

    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const backupData: BackupData = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        accounts: demoAccs,
        categories: categories,
        transactions: demoTxs,
        budgets: demoBudgets,
        recurringPayments: demoRec,
        notifications: demoNotifs,
        settings: demoSettings,
      };
      await SyncService.uploadLocalDataToCloud(backupData, user.id);
      setSyncStatus('SYNCED');
    }

    showToast('Loaded sample dataset successfully!', 'success');
  };

  const resetLocalData = () => {
    StorageEngine.resetToEmptyProduction(user?.id);
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setRecurringPayments([]);
    setNotifications([]);
    showToast('Local device data cleared. Cloud data remains intact.', 'info');
  };

  const resetAllData = async () => {
    if (user?.id && navigator.onLine) {
      setSyncStatus('SYNCING');
      const res = await SyncService.deleteAllUserData(user.id);
      if (!res.success) {
        setSyncStatus('SYNC_FAILED');
        showToast(`Could not reset cloud data: ${res.error}`, 'danger');
        return;
      }
      setSyncStatus('SYNCED');
    }

    StorageEngine.resetToEmptyProduction(user?.id);
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setRecurringPayments([]);
    setNotifications([]);
    showToast('All cloud and local financial data reset successfully.', 'success');
  };

  // Derived Financial Calculations
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const totalBalance = calculateNetWorth(accounts, transactions);
  const monthlyIncome = calculateIncome(transactions, currentMonthPrefix);
  const monthlyExpenses = calculateExpenses(transactions, currentMonthPrefix);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedAccountIdForDetail,
        setSelectedAccountIdForDetail,
        user,
        userProfile,
        authLoading,
        syncStatus,
        lastSyncError,
        lastSyncTime,
        runSyncDiagnostic,
        soundEnabled,
        toggleSoundEnabled,
        logout,
        triggerCloudSync,
        triggerManualSync,
        accounts,
        categories,
        transactions,
        budgets,
        recurringPayments,
        notifications,
        settings,
        isOffline,
        isPinLocked,
        setIsPinLocked,
        isAddTransactionOpen,
        setIsAddTransactionOpen,
        isAddAccountOpen,
        setIsAddAccountOpen,
        isAddBudgetOpen,
        setIsAddBudgetOpen,
        isAddRecurringOpen,
        setIsAddRecurringOpen,
        searchQuery,
        setSearchQuery,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addAccount,
        archiveAccount,
        addBudget,
        deleteBudget,
        addRecurring,
        togglePauseRecurring,
        deleteRecurring,
        markNotificationRead,
        clearNotifications,
        toggleHideBalances,
        setPinCode,
        validatePin,
        updateProfileName,
        updateUserPassword,
        importBackupData,
        resetLocalData,
        resetAllData,
        loadDemoData,
        toasts,
        showToast,
        removeToast,
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        unreadNotificationCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};

