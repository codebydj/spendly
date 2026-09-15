import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Account, Transaction, Budget, RecurringPayment, NotificationItem, AppSettings, Category, BackupData, AppVersionManifest } from '../types/finance';
import { StorageEngine } from '../db/storage';
import { IndexedDBService, STORES } from '../db/indexedDB';
import { INITIAL_SETTINGS } from '../db/initialData';
import { supabase } from '../services/supabase';
import { SyncService } from '../services/syncService';
import { soundService } from '../services/soundService';
import { hashPin, verifyPin } from '../utils/crypto';
import { scheduleReminderNotification, cancelReminderNotification, scheduleUpdateNotification } from '../services/nativeNotifications';
import {
  fetchLatestAppVersion,
  shouldShowUpdateNotification,
  markVersionNotified,
  postponeUpdateNotification,
  CURRENT_APP_VERSION,
} from '../utils/versionCheck';
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
  actionText?: string;
  onAction?: () => void;
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
  pendingOpsCount: number;
  lastSyncError: string | null;
  lastSyncTime: string | null;
  runSyncDiagnostic: () => Promise<{ success: boolean; message: string; details?: any }>;
  soundEnabled: boolean;
  toggleSoundEnabled: () => void;
  logout: () => Promise<void>;
  triggerCloudSync: () => Promise<void>;
  triggerManualSync: () => Promise<boolean>;

  // App Update Notification
  latestManifest: AppVersionManifest | null;
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (open: boolean) => void;
  checkAppUpdates: () => Promise<void>;
  postponeUpdate: () => void;

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
  addCategory: (cat: Omit<Category, 'id'>) => void;
  editCategory: (id: string, name: string) => void;
  reorderCategories: (cats: Category[]) => void;
  deleteCategory: (id: string, reassignCategoryId?: string) => void;
  addRecurring: (r: Omit<RecurringPayment, 'id'>) => void;
  editRecurring: (id: string, r: Omit<RecurringPayment, 'id'>) => void;
  togglePauseRecurring: (id: string) => void;
  deleteRecurring: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Settings & Profile Actions
  toggleHideBalances: () => void;
  toggleNotifyAppUpdates: () => void;
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
  showToast: (
    message: string,
    type?: 'success' | 'info' | 'warning' | 'danger',
    actionText?: string,
    onAction?: () => void
  ) => void;
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
  const [pendingOpsCount, setPendingOpsCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'SYNCED' : 'OFFLINE');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(soundService.getSoundEnabled());

  // App Update Modal State
  const [latestManifest, setLatestManifest] = useState<AppVersionManifest | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

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
  const [settings, setSettings] = useState<AppSettings>({
    ...StorageEngine.loadSettings(),
    notifyAppUpdates: true,
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Security & App UI
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'info' | 'warning' | 'danger' = 'success',
      actionText?: string,
      onAction?: () => void
    ) => {
      const id = Date.now().toString() + Math.random().toString().slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type, actionText, onAction }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

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

  // Refresh Pending Operations Count
  const refreshPendingOpsCount = useCallback(async (userId: string) => {
    if (!userId) return 0;
    const ops = await IndexedDBService.getPendingOperations(userId);
    setPendingOpsCount(ops.length);
    return ops.length;
  }, []);

  // Check App Updates
  const checkAppUpdates = useCallback(async () => {
    if (settingsRef.current.notifyAppUpdates === false) return;

    const manifest = await fetchLatestAppVersion();
    if (!manifest) return;

    if (shouldShowUpdateNotification(manifest.version)) {
      setLatestManifest(manifest);
      scheduleUpdateNotification(manifest);

      // Add to Notification Center if not already present
      setNotifications((prev) => {
        const exists = prev.some((n) => n.type === 'APP_UPDATE' && n.title.includes(manifest.version));
        if (exists) return prev;

        const updateNotif: NotificationItem = {
          id: `notif-update-${manifest.version}`,
          type: 'APP_UPDATE',
          title: manifest.title || `Spendly V${manifest.version} Available`,
          message: manifest.message || 'New improvements and features are now available.',
          date: new Date().toISOString(),
          isRead: false,
          versionManifest: manifest,
        };
        return [updateNotif, ...prev];
      });

      showToast(`Spendly V${manifest.version} is now available`, 'info', 'View Update', () => {
        setIsUpdateModalOpen(true);
      });

      markVersionNotified(manifest.version);
    }
  }, [showToast]);

  const postponeUpdate = () => {
    postponeUpdateNotification(7);
    setIsUpdateModalOpen(false);
    showToast('Update reminder postponed for 7 days', 'info');
  };

  // Hydrate User Data from IndexedDB & Supabase Cloud
  const isHydratingRef = useRef<boolean>(false);

  const loadUserData = useCallback(
    async (userId: string) => {
      isHydratingRef.current = true;
      setSyncStatus('SYNCING');

      try {
        // STEP 1: Load Local IndexedDB Data IN PARALLEL FIRST
        let [idbAccs, idbTxs, idbBudgets, idbRec, idbNotifs, idbSettings, idbCats] = await Promise.all([
          IndexedDBService.getStoreItems<Account>(STORES.ACCOUNTS, userId),
          IndexedDBService.getStoreItems<Transaction>(STORES.TRANSACTIONS, userId),
          IndexedDBService.getStoreItems<Budget>(STORES.BUDGETS, userId),
          IndexedDBService.getStoreItems<RecurringPayment>(STORES.RECURRING, userId),
          IndexedDBService.getStoreItems<NotificationItem>(STORES.NOTIFICATIONS, userId),
          IndexedDBService.loadSettings(userId),
          IndexedDBService.getStoreItems<Category>(STORES.CATEGORIES, userId),
        ]);

        // Migration Fallback: If IndexedDB is empty for userId, load from StorageEngine (localStorage)
        if (idbAccs.length === 0 && idbTxs.length === 0) {
          const lsAccs = StorageEngine.loadAccounts(userId);
          const lsTxs = StorageEngine.loadTransactions(userId);
          const lsBudgets = StorageEngine.loadBudgets(userId);
          const lsRec = StorageEngine.loadRecurring(userId);
          const lsNotifs = StorageEngine.loadNotifications(userId);
          const lsSettings = StorageEngine.loadSettings(userId);
          const lsCats = StorageEngine.loadCategories(userId);

          if (lsAccs.length > 0 || lsTxs.length > 0) {
            idbAccs = lsAccs;
            idbTxs = lsTxs;
            idbBudgets = lsBudgets;
            idbRec = lsRec;
            idbNotifs = lsNotifs;
            idbSettings = lsSettings;
            idbCats = lsCats;

            // Migrate to IndexedDB in parallel
            await Promise.all([
              IndexedDBService.saveStoreItems(STORES.ACCOUNTS, lsAccs, userId),
              IndexedDBService.saveStoreItems(STORES.TRANSACTIONS, lsTxs, userId),
              IndexedDBService.saveStoreItems(STORES.BUDGETS, lsBudgets, userId),
              IndexedDBService.saveStoreItems(STORES.RECURRING, lsRec, userId),
              IndexedDBService.saveStoreItems(STORES.NOTIFICATIONS, lsNotifs, userId),
              IndexedDBService.saveStoreItems(STORES.CATEGORIES, lsCats, userId),
              lsSettings ? IndexedDBService.saveSettings(lsSettings, userId) : Promise.resolve(),
            ]);
          }
        }

        // STEP 2: Load Pending Operations FIRST
        const currentPendingOps = await IndexedDBService.getPendingOperations(userId);
        const pendingCount = currentPendingOps.length;
        setPendingOpsCount(pendingCount);

        // STEP 3: Display Local IndexedDB Data Immediately & UNBLOCK UI INSTANTLY
        const recalculated = updateAccountBalances(idbAccs, idbTxs);
        setAccounts(recalculated);
        setTransactions(idbTxs);
        setBudgets(idbBudgets);
        setRecurringPayments(idbRec);
        setNotifications(idbNotifs);
        setCategories(idbCats.length > 0 ? idbCats : StorageEngine.loadCategories(userId));

        if (idbSettings) {
          setSettings(idbSettings);
          setIsPinLocked(idbSettings.pinEnabled);
        }

        // UNBLOCK APP RENDERING IMMEDIATELY
        setAuthLoading(false);

        // STEP 4: Determine Online Status
        if (!navigator.onLine) {
          setSyncStatus(pendingCount > 0 ? 'LOCAL_CHANGES' : 'OFFLINE');
          return;
        }

        // STEP 5: IF ONLINE -> Flush Pending Queue First & Fetch Cloud Data IN BACKGROUND
        if (pendingCount > 0) {
          await SyncService.flushPendingOperations(userId);
          await refreshPendingOpsCount(userId);
        }

        // STEP 6: Fetch Cloud Changes
        const cloudData = await SyncService.fetchUserData(userId);

        if (cloudData.hasCloudData) {
          // STEP 7: Merge Cloud Data with Local Data (Preserving unsynced pending items)
          const remainingPending = await IndexedDBService.getPendingOperations(userId);

          const mergedAccMap = new Map<string, Account>();
          cloudData.accounts.forEach((a) => mergedAccMap.set(a.id, a));
          idbAccs.forEach((a) => {
            const isPendingDelete = remainingPending.some(
              (op) => op.entity === 'accounts' && op.entity_id === a.id && op.operation === 'delete'
            );
            if (!isPendingDelete) {
              mergedAccMap.set(a.id, a);
            }
          });

          const mergedTxMap = new Map<string, Transaction>();
          cloudData.transactions.forEach((t) => mergedTxMap.set(t.id, t));
          idbTxs.forEach((t) => {
            const isPendingDelete = remainingPending.some(
              (op) => op.entity === 'transactions' && op.entity_id === t.id && op.operation === 'delete'
            );
            if (!isPendingDelete) {
              mergedTxMap.set(t.id, t);
            }
          });

          const mergedAccounts = Array.from(mergedAccMap.values());
          const mergedTransactions = Array.from(mergedTxMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          const recalculatedMerged = updateAccountBalances(mergedAccounts, mergedTransactions);

          // Update Local IndexedDB in parallel
          await Promise.all([
            IndexedDBService.saveStoreItems(STORES.ACCOUNTS, recalculatedMerged, userId),
            IndexedDBService.saveStoreItems(STORES.TRANSACTIONS, mergedTransactions, userId),
            IndexedDBService.saveStoreItems(STORES.BUDGETS, cloudData.budgets, userId),
            IndexedDBService.saveStoreItems(STORES.RECURRING, cloudData.recurringPayments, userId),
            IndexedDBService.saveStoreItems(STORES.NOTIFICATIONS, cloudData.notifications, userId),
            cloudData.settings ? IndexedDBService.saveSettings(cloudData.settings, userId) : Promise.resolve(),
          ]);

          // Update React State
          setAccounts(recalculatedMerged);
          setTransactions(mergedTransactions);
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
          setLastSyncTime(new Date().toLocaleTimeString());
        } else {
          // No cloud records exist yet on server for user
          const hasLocalRecords = idbAccs.length > 0 || idbTxs.length > 0;
          if (hasLocalRecords && navigator.onLine) {
            const backup: BackupData = {
              version: CURRENT_APP_VERSION,
              exportedAt: new Date().toISOString(),
              accounts: idbAccs,
              categories: idbCats,
              transactions: idbTxs,
              budgets: idbBudgets,
              recurringPayments: idbRec,
              notifications: idbNotifs,
              settings: idbSettings || INITIAL_SETTINGS,
            };
            await SyncService.uploadLocalDataToCloud(backup, userId);
            setSyncStatus('SYNCED');
          } else {
            setSyncStatus(navigator.onLine ? 'SYNCED' : 'OFFLINE');
          }
        }
      } catch (err) {
        console.error('loadUserData exception:', err);
        setSyncStatus(navigator.onLine ? 'SYNC_FAILED' : 'OFFLINE');
      } finally {
        setAuthLoading(false);
        setTimeout(() => {
          isHydratingRef.current = false;
        }, 300);
      }
    },
    [updateAccountBalances, refreshPendingOpsCount]
  );

  // Sync state back to local storage whenever in-memory data changes for active user
  const loadedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id && !isHydratingRef.current) {
      StorageEngine.saveAccounts(accounts, user.id);
    }
  }, [accounts, user?.id]);

  useEffect(() => {
    if (user?.id && !isHydratingRef.current) {
      StorageEngine.saveTransactions(transactions, user.id);
    }
  }, [transactions, user?.id]);

  useEffect(() => {
    if (user?.id && !isHydratingRef.current) {
      StorageEngine.saveBudgets(budgets, user.id);
    }
  }, [budgets, user?.id]);

  useEffect(() => {
    if (user?.id && !isHydratingRef.current) {
      StorageEngine.saveRecurring(recurringPayments, user.id);
    }
  }, [recurringPayments, user?.id]);

  useEffect(() => {
    if (user?.id && !isHydratingRef.current) {
      StorageEngine.saveNotifications(notifications, user.id);
    }
  }, [notifications, user?.id]);

  useEffect(() => {
    if (user?.id && !isHydratingRef.current) {
      StorageEngine.saveSettings(settings, user.id);
    }
  }, [settings, user?.id]);

  // Background Cloud Sync Trigger
  const triggerCloudSync = useCallback(async () => {
    if (!user?.id || !navigator.onLine) {
      setSyncStatus(navigator.onLine ? 'SYNCED' : 'OFFLINE');
      return;
    }

    setSyncStatus('SYNCING');
    try {
      const flushRes = await SyncService.flushPendingOperations(user.id);
      await refreshPendingOpsCount(user.id);

      if (flushRes.success) {
        setSyncStatus('SYNCED');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setSyncStatus('SYNC_FAILED');
      }
    } catch {
      setSyncStatus('SYNC_FAILED');
    }
  }, [user?.id, refreshPendingOpsCount]);

  // Explicit Manual Supabase Cloud Synchronization Control
  const triggerManualSync = async (): Promise<boolean> => {
    if (!user?.id) {
      showToast('Please sign in to synchronize cloud data', 'warning');
      return false;
    }
    if (!navigator.onLine) {
      const remainingOps = await IndexedDBService.getPendingOperations(user.id);
      setPendingOpsCount(remainingOps.length);
      setSyncStatus('OFFLINE');
      showToast(
        "You're offline. Changes are saved on this device and will sync when you're back online.",
        'info'
      );
      return false;
    }

    setSyncStatus('SYNCING');
    setLastSyncError(null);

    try {
      await SyncService.flushPendingOperations(user.id);
      await refreshPendingOpsCount(user.id);

      const backup: BackupData = {
        version: CURRENT_APP_VERSION,
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

      const cloudData = await SyncService.fetchUserData(user.id);

      if (cloudData.hasCloudData) {
        const recalculated = updateAccountBalances(cloudData.accounts, cloudData.transactions);
        setAccounts(recalculated);
        setTransactions(cloudData.transactions);
        setBudgets(cloudData.budgets);
        setRecurringPayments(cloudData.recurringPayments);
        setNotifications(cloudData.notifications);
        if (cloudData.settings) setSettings(cloudData.settings);
        if (cloudData.profile) setUserProfile(cloudData.profile);

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

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        if (session?.user) {
          setUser(session.user);
          if (loadedUserRef.current !== session.user.id) {
            loadedUserRef.current = session.user.id;
            loadUserData(session.user.id).then(() => {
              if (isMounted) setAuthLoading(false);
            });
          } else {
            setAuthLoading(false);
          }
          setCurrentView((prev) => (prev === 'login' || prev === 'signup' ? 'dashboard' : prev));
        } else {
          setUser(null);
          setUserProfile(null);
          loadedUserRef.current = null;
          setAccounts([]);
          setTransactions([]);
          setBudgets([]);
          setRecurringPayments([]);
          setNotifications([]);
          setAuthLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        if (loadedUserRef.current !== session.user.id) {
          loadedUserRef.current = session.user.id;
          loadUserData(session.user.id).then(() => {
            if (isMounted) setAuthLoading(false);
          });
        }
        setCurrentView((prev) => (prev === 'login' || prev === 'signup' ? 'dashboard' : prev));
      } else {
        setUser(null);
        setUserProfile(null);
        loadedUserRef.current = null;
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

  // --- AUTOMATIC BIDIRECTIONAL SUPABASE REALTIME SYNCHRONIZATION ---
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    console.log(`[Spendly Realtime] Subscribing to Supabase realtime channels for user ${userId}...`);

    const channel = supabase
      .channel(`spendly_user_realtime_${userId}`)
      // 1. TRANSACTIONS REALTIME
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        async (payload) => {
          console.log('[Realtime] Transaction event received:', payload.eventType, payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const tx = SyncService.mapTransactionFromDb(payload.new);
            await IndexedDBService.saveItem(STORES.TRANSACTIONS, tx, userId);
            setTransactions((prev) => {
              const idx = prev.findIndex((t) => t.id === tx.id);
              let updated;
              if (idx >= 0) {
                updated = [...prev];
                updated[idx] = tx;
              } else {
                updated = [tx, ...prev];
              }
              updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              setAccounts((accs) => updateAccountBalances(accs, updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            const deleteId = payload.old.id;
            await IndexedDBService.deleteItem(STORES.TRANSACTIONS, deleteId);
            setTransactions((prev) => {
              const updated = prev.filter((t) => t.id !== deleteId);
              setAccounts((accs) => updateAccountBalances(accs, updated));
              return updated;
            });
          }
          setSyncStatus('SYNCED');
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      )
      // 2. ACCOUNTS REALTIME
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        async (payload) => {
          console.log('[Realtime] Account event received:', payload.eventType, payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const acc = SyncService.mapAccountFromDb(payload.new);
            await IndexedDBService.saveItem(STORES.ACCOUNTS, acc, userId);
            setAccounts((prev) => {
              const idx = prev.findIndex((a) => a.id === acc.id);
              let updated;
              if (idx >= 0) {
                updated = [...prev];
                updated[idx] = acc;
              } else {
                updated = [...prev, acc];
              }
              return updateAccountBalances(updated, transactions);
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            const deleteId = payload.old.id;
            await IndexedDBService.deleteItem(STORES.ACCOUNTS, deleteId);
            setAccounts((prev) => prev.filter((a) => a.id !== deleteId));
          }
          setSyncStatus('SYNCED');
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      )
      // 3. BUDGETS REALTIME
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${userId}` },
        async (payload) => {
          console.log('[Realtime] Budget event received:', payload.eventType, payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const b = SyncService.mapBudgetFromDb(payload.new);
            await IndexedDBService.saveItem(STORES.BUDGETS, b, userId);
            setBudgets((prev) => {
              const idx = prev.findIndex((item) => item.id === b.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = b;
                return next;
              }
              return [...prev, b];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            await IndexedDBService.deleteItem(STORES.BUDGETS, payload.old.id);
            setBudgets((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
          setSyncStatus('SYNCED');
        }
      )
      // 4. RECURRING PAYMENTS REALTIME
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_payments', filter: `user_id=eq.${userId}` },
        async (payload) => {
          console.log('[Realtime] Recurring event received:', payload.eventType, payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const r = SyncService.mapRecurringFromDb(payload.new);
            await IndexedDBService.saveItem(STORES.RECURRING, r, userId);
            setRecurringPayments((prev) => {
              const idx = prev.findIndex((item) => item.id === r.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = r;
                return next;
              }
              return [...prev, r];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            await IndexedDBService.deleteItem(STORES.RECURRING, payload.old.id);
            setRecurringPayments((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
          setSyncStatus('SYNCED');
        }
      )
      // 5. NOTIFICATIONS REALTIME
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async (payload) => {
          console.log('[Realtime] Notification event received:', payload.eventType, payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const n = SyncService.mapNotificationFromDb(payload.new);
            await IndexedDBService.saveItem(STORES.NOTIFICATIONS, n, userId);
            setNotifications((prev) => {
              const idx = prev.findIndex((item) => item.id === n.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = n;
                return next;
              }
              return [n, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            await IndexedDBService.deleteItem(STORES.NOTIFICATIONS, payload.old.id);
            setNotifications((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      // 6. USER SETTINGS REALTIME
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${userId}` },
        async (payload) => {
          console.log('[Realtime] Settings event received:', payload.eventType, payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const s = SyncService.mapSettingsFromDb(payload.new);
            await IndexedDBService.saveSettings(s, userId);
            setSettings(s);
          }
        }
      )
      // 7. PROFILES REALTIME
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          console.log('[Realtime] Profile event received:', payload.eventType, payload);
          if (payload.new && typeof payload.new === 'object') {
            const profileData = payload.new as Record<string, any>;
            setUserProfile({ fullName: profileData.full_name, email: profileData.email });
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`[Spendly Realtime] Unsubscribing realtime channels for user ${userId}...`);
      supabase.removeChannel(channel);
    };
  }, [user?.id, updateAccountBalances, transactions]);

  // Network Status Monitor & Automatic Update Check
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Online connection restored', 'info');
      if (user?.id) triggerCloudSync();
      checkAppUpdates();
    };
    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('OFFLINE');
      showToast('Offline mode - local data saved', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      checkAppUpdates();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id, triggerCloudSync, showToast, checkAppUpdates]);

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Fallback
    } finally {
      setUser(null);
      setUserProfile(null);
      loadedUserRef.current = null;
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setRecurringPayments([]);
      setNotifications([]);
      showToast('Signed out successfully', 'info');
      setCurrentView('login');
    }
  };

  // --- CRUD ACTIONS WITH TRANSACTIONAL OFFLINE WRITES ---

  // Add Transaction
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    soundService.playTransactionChime();
    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
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
          if (user?.id) {
            IndexedDBService.saveItem(STORES.NOTIFICATIONS, newNotif, user.id);
            IndexedDBService.addPendingOperation(user.id, 'notifications', newNotif.id, 'upsert', newNotif);
          }
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

    if (user?.id) {
      await IndexedDBService.saveItem(STORES.TRANSACTIONS, newTx, user.id);
      await Promise.all(updatedAccs.map((a) => IndexedDBService.saveItem(STORES.ACCOUNTS, a, user.id)));

      await IndexedDBService.addPendingOperation(user.id, 'transactions', newTx.id, 'upsert', newTx);
      await Promise.all(
        updatedAccs.map((a) => IndexedDBService.addPendingOperation(user.id, 'accounts', a.id, 'upsert', a))
      );

      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
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

    if (user?.id && editedTx) {
      await IndexedDBService.saveItem(STORES.TRANSACTIONS, editedTx, user.id);
      await Promise.all(updatedAccs.map((a) => IndexedDBService.saveItem(STORES.ACCOUNTS, a, user.id)));

      await IndexedDBService.addPendingOperation(user.id, 'transactions', editedTx.id, 'upsert', editedTx);
      await Promise.all(
        updatedAccs.map((a) => IndexedDBService.addPendingOperation(user.id, 'accounts', a.id, 'upsert', a))
      );

      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id: string) => {
    const updatedTxs = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTxs);

    const updatedAccs = updateAccountBalances(accounts, updatedTxs);
    setAccounts(updatedAccs);

    showToast('Transaction deleted', 'info');

    if (user?.id) {
      await IndexedDBService.deleteItem(STORES.TRANSACTIONS, id);
      await Promise.all(updatedAccs.map((a) => IndexedDBService.saveItem(STORES.ACCOUNTS, a, user.id)));

      await IndexedDBService.addPendingOperation(user.id, 'transactions', id, 'delete');
      await Promise.all(
        updatedAccs.map((a) => IndexedDBService.addPendingOperation(user.id, 'accounts', a.id, 'upsert', a))
      );

      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  // Add Account
  const addAccount = async (accData: Omit<Account, 'id' | 'updatedAt' | 'balance'>) => {
    const newAcc: Account = {
      ...accData,
      id: 'acc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      balance: accData.openingBalance,
      currency: '₹',
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };
    const updatedAccs = [...accounts, newAcc];
    const recalculated = updateAccountBalances(updatedAccs, transactions);
    setAccounts(recalculated);

    showToast(`Account "${newAcc.name}" created`, 'success');

    if (user?.id) {
      await IndexedDBService.saveItem(STORES.ACCOUNTS, newAcc, user.id);
      await IndexedDBService.addPendingOperation(user.id, 'accounts', newAcc.id, 'upsert', newAcc);
      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  // Archive Account
  const archiveAccount = async (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    const updatedAcc: Account = { ...target, isArchived: true, updatedAt: new Date().toISOString() };

    setAccounts((prev) => prev.map((acc) => (acc.id === id ? updatedAcc : acc)));
    showToast('Account archived', 'info');

    if (user?.id) {
      await IndexedDBService.saveItem(STORES.ACCOUNTS, updatedAcc, user.id);
      await IndexedDBService.addPendingOperation(user.id, 'accounts', updatedAcc.id, 'upsert', updatedAcc);
      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
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
        id: 'b-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        ...bData,
      };
      setBudgets((prev) => [...prev, targetBudget]);
    }

    showToast('Budget limit saved', 'success');

    if (user?.id) {
      await IndexedDBService.saveItem(STORES.BUDGETS, targetBudget, user.id);
      await IndexedDBService.addPendingOperation(user.id, 'budgets', targetBudget.id, 'upsert', targetBudget);
      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  // Delete Budget
  const deleteBudget = async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    showToast('Budget removed', 'info');

    if (user?.id) {
      await IndexedDBService.deleteItem(STORES.BUDGETS, id);
      await IndexedDBService.addPendingOperation(user.id, 'budgets', id, 'delete');
      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  // Category Management
  const addCategory = async (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ...catData,
    };
    setCategories((prev) => {
      const updated = [...prev, newCat];
      StorageEngine.saveCategories(updated, user?.id);
      return updated;
    });
    showToast(`Category "${newCat.name}" added`, 'success');

    if (user?.id) {
      await IndexedDBService.saveItem(STORES.CATEGORIES, newCat, user.id);
    }
  };

  const editCategory = async (id: string, name: string) => {
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, name: name.trim() } : c));
      StorageEngine.saveCategories(updated, user?.id);
      return updated;
    });
    showToast('Category renamed', 'info');
  };

  const reorderCategories = (newCats: Category[]) => {
    setCategories(newCats);
    StorageEngine.saveCategories(newCats, user?.id);
  };

  const deleteCategory = (id: string, reassignCategoryId?: string) => {
    if (reassignCategoryId) {
      setTransactions((prev) =>
        prev.map((t) => (t.categoryId === id ? { ...t, categoryId: reassignCategoryId } : t))
      );
    }
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      StorageEngine.saveCategories(updated, user?.id);
      return updated;
    });
    showToast('Category deleted', 'info');
  };

  // Add / Edit / Pause / Delete Reminders
  const addRecurring = async (rData: Omit<RecurringPayment, 'id'>) => {
    const newR: RecurringPayment = {
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ...rData,
    };
    setRecurringPayments((prev) => [...prev, newR]);
    scheduleReminderNotification(newR);
    showToast(`Reminder "${newR.title}" saved`, 'success');

    if (user?.id) {
      await IndexedDBService.saveItem(STORES.RECURRING, newR, user.id);
      await IndexedDBService.addPendingOperation(user.id, 'recurring_payments', newR.id, 'upsert', newR);
      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  const editRecurring = async (id: string, rData: Omit<RecurringPayment, 'id'>) => {
    const updated: RecurringPayment = { id, ...rData };
    setRecurringPayments((prev) => prev.map((r) => (r.id === id ? updated : r)));
    scheduleReminderNotification(updated);
    showToast(`Reminder "${updated.title}" updated`, 'success');

    if (user?.id) {
      await IndexedDBService.saveItem(STORES.RECURRING, updated, user.id);
      await IndexedDBService.addPendingOperation(user.id, 'recurring_payments', updated.id, 'upsert', updated);
      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  const togglePauseRecurring = async (id: string) => {
    const target = recurringPayments.find((r) => r.id === id);
    if (!target) return;
    const updated = { ...target, isPaused: !target.isPaused };

    setRecurringPayments((prev) => prev.map((r) => (r.id === id ? updated : r)));
    if (updated.isPaused) {
      cancelReminderNotification(id);
      showToast(`Reminder "${updated.title}" paused`, 'info');
    } else {
      scheduleReminderNotification(updated);
      showToast(`Reminder "${updated.title}" resumed`, 'info');
    }

    if (user?.id) {
      await IndexedDBService.saveItem(STORES.RECURRING, updated, user.id);
      await IndexedDBService.addPendingOperation(user.id, 'recurring_payments', updated.id, 'upsert', updated);
      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  const deleteRecurring = async (id: string) => {
    setRecurringPayments((prev) => prev.filter((r) => r.id !== id));
    cancelReminderNotification(id);
    showToast('Reminder removed', 'info');

    if (user?.id) {
      await IndexedDBService.deleteItem(STORES.RECURRING, id);
      await IndexedDBService.addPendingOperation(user.id, 'recurring_payments', id, 'delete');
      await refreshPendingOpsCount(user.id);

      if (navigator.onLine) {
        triggerCloudSync();
      } else {
        setSyncStatus('LOCAL_CHANGES');
      }
    }
  };

  // Notifications
  const markNotificationRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;
    const updated = { ...target, isRead: true };

    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));

    if (user?.id) {
      IndexedDBService.saveItem(STORES.NOTIFICATIONS, updated, user.id);
      if (navigator.onLine) {
        SyncService.upsertNotification(updated, user.id);
      }
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    showToast('Notifications cleared', 'info');

    if (user?.id) {
      await IndexedDBService.saveStoreItems(STORES.NOTIFICATIONS, [], user.id);
      if (navigator.onLine) {
        SyncService.clearNotifications(user.id);
      }
    }
  };

  // Settings & Security
  const toggleHideBalances = () => {
    const updated = { ...settings, hideBalances: !settings.hideBalances };
    setSettings(updated);
    if (user?.id) {
      IndexedDBService.saveSettings(updated, user.id);
      if (navigator.onLine) {
        SyncService.upsertSettings(updated, user.id);
      }
    }
  };

  const toggleNotifyAppUpdates = () => {
    const updated = { ...settings, notifyAppUpdates: !(settings.notifyAppUpdates ?? true) };
    setSettings(updated);
    showToast(updated.notifyAppUpdates ? 'App update notifications enabled' : 'App update notifications disabled', 'info');
    if (user?.id) {
      IndexedDBService.saveSettings(updated, user.id);
      if (navigator.onLine) {
        SyncService.upsertSettings(updated, user.id);
      }
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

    if (user?.id) {
      IndexedDBService.saveSettings(updated, user.id);
      if (navigator.onLine) {
        SyncService.upsertSettings(updated, user.id);
      }
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

    if (user?.id) {
      await IndexedDBService.saveStoreItems(STORES.ACCOUNTS, demoAccs, user.id);
      await IndexedDBService.saveStoreItems(STORES.TRANSACTIONS, demoTxs, user.id);
      await IndexedDBService.saveStoreItems(STORES.BUDGETS, demoBudgets, user.id);
      await IndexedDBService.saveStoreItems(STORES.RECURRING, demoRec, user.id);
      await IndexedDBService.saveStoreItems(STORES.NOTIFICATIONS, demoNotifs, user.id);
      await IndexedDBService.saveSettings(demoSettings, user.id);

      if (navigator.onLine) {
        setSyncStatus('SYNCING');
        const backupData: BackupData = {
          version: CURRENT_APP_VERSION,
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
    setPendingOpsCount(0);
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
    setPendingOpsCount(0);
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
        pendingOpsCount,
        lastSyncError,
        lastSyncTime,
        runSyncDiagnostic,
        soundEnabled,
        toggleSoundEnabled,
        logout,
        triggerCloudSync,
        triggerManualSync,
        latestManifest,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        checkAppUpdates,
        postponeUpdate,
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
        addCategory,
        editCategory,
        reorderCategories,
        deleteCategory,
        addRecurring,
        editRecurring,
        togglePauseRecurring,
        deleteRecurring,
        markNotificationRead,
        clearNotifications,
        toggleHideBalances,
        toggleNotifyAppUpdates,
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
