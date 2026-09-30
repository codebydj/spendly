import type { AppSettings, PendingSyncOperation, BackupData } from '../types/finance';

const DB_NAME = 'SpendlyDB';
const DB_VERSION = 2;

export const STORES = {
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  RECURRING: 'recurring_payments',
  NOTIFICATIONS: 'notifications',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  PENDING_OPS: 'pending_sync_operations',
  TRASH_SNAPSHOTS: 'trash_snapshots',
  AUDIT_LOGS: 'audit_logs',
} as const;

export interface TrashSnapshot {
  id: string;
  user_id: string;
  deleted_at: string;
  expires_at: string; // 7 days from deletion
  data: BackupData;
  summary: {
    accountsCount: number;
    transactionsCount: number;
    budgetsCount: number;
    recurringCount: number;
  };
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  operation_id: string;
  action: 'RESET_LOCAL' | 'DELETE_WORKSPACE' | 'RESTORE_TRASH' | 'EXPORT_DATA' | 'SYNC_FLUSH';
  timestamp: string;
  affectedCounts: Record<string, number>;
  result: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  details?: string;
}

export class IndexedDBService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create Stores if not exist
        if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
          const accStore = db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
          accStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          txStore.createIndex('user_id', 'user_id', { unique: false });
          txStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
          const bStore = db.createObjectStore(STORES.BUDGETS, { keyPath: 'id' });
          bStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.RECURRING)) {
          const rStore = db.createObjectStore(STORES.RECURRING, { keyPath: 'id' });
          rStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
          const nStore = db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id' });
          nStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          const cStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
          cStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'user_id' });
        }

        if (!db.objectStoreNames.contains(STORES.PENDING_OPS)) {
          const pStore = db.createObjectStore(STORES.PENDING_OPS, { keyPath: 'id' });
          pStore.createIndex('user_id', 'user_id', { unique: false });
          pStore.createIndex('status', 'status', { unique: false });
          pStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.TRASH_SNAPSHOTS)) {
          const tStore = db.createObjectStore(STORES.TRASH_SNAPSHOTS, { keyPath: 'id' });
          tStore.createIndex('user_id', 'user_id', { unique: false });
          tStore.createIndex('expires_at', 'expires_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
          const aStore = db.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'id' });
          aStore.createIndex('user_id', 'user_id', { unique: false });
          aStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event) => {
        const err = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB open error:', err);
        reject(err);
      };
    });

    return this.dbPromise;
  }

  // General Get Items for User
  public static async getStoreItems<T>(storeName: string, userId: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise<T[]>((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        if (store.indexNames.contains('user_id')) {
          const index = store.index('user_id');
          const request = index.getAll(userId);
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
        } else {
          const request = store.getAll();
          request.onsuccess = () => {
            const all = request.result || [];
            resolve(all.filter((item: any) => item.user_id === userId || !item.user_id));
          };
          request.onerror = () => resolve([]);
        }
      });
    } catch (err) {
      console.warn(`IndexedDB getStoreItems [${storeName}] failed:`, err);
      return [];
    }
  }

  // Save/Replace List of Items for User
  public static async saveStoreItems<T extends { id: string }>(storeName: string, items: T[], userId: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        items.forEach((item) => {
          const withUser = { ...item, user_id: userId };
          store.put(withUser);
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`IndexedDB saveStoreItems [${storeName}] error:`, err);
    }
  }

  // Save/Upsert Single Item
  public static async saveItem<T extends { id: string }>(storeName: string, item: T, userId: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const withUser = { ...item, user_id: userId };
        store.put(withUser);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`IndexedDB saveItem [${storeName}] error:`, err);
    }
  }

  // Delete Single Item by ID
  public static async deleteItem(storeName: string, itemId: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(itemId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`IndexedDB deleteItem [${storeName}] error:`, err);
    }
  }

  // Settings Store (keyed by user_id)
  public static async loadSettings(userId: string): Promise<AppSettings | null> {
    try {
      const db = await this.getDB();
      return new Promise<AppSettings | null>((resolve) => {
        const tx = db.transaction(STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.get(userId);
        req.onsuccess = () => {
          if (req.result) {
            const { user_id, ...settings } = req.result;
            resolve(settings as AppSettings);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public static async saveSettings(settings: AppSettings, userId: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        store.put({ ...settings, user_id: userId });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('IndexedDB saveSettings error:', err);
    }
  }

  // TRASH SNAPSHOTS (7-Day Soft-Delete Storage)
  public static async saveTrashSnapshot(userId: string, data: BackupData): Promise<TrashSnapshot> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const snapshot: TrashSnapshot = {
      id: `trash_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id: userId,
      deleted_at: now.toISOString(),
      expires_at: expiresAt,
      data,
      summary: {
        accountsCount: data.accounts?.length || 0,
        transactionsCount: data.transactions?.length || 0,
        budgetsCount: data.budgets?.length || 0,
        recurringCount: data.recurringPayments?.length || 0,
      },
    };

    await this.saveItem(STORES.TRASH_SNAPSHOTS, snapshot, userId);
    return snapshot;
  }

  public static async getTrashSnapshots(userId: string): Promise<TrashSnapshot[]> {
    try {
      const now = new Date().toISOString();
      const items = await this.getStoreItems<TrashSnapshot>(STORES.TRASH_SNAPSHOTS, userId);
      // Filter non-expired snapshots (within 7 days)
      return items
        .filter((item) => item.expires_at >= now)
        .sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
    } catch {
      return [];
    }
  }

  // AUDIT LOGS
  public static async addAuditLog(
    userId: string,
    action: AuditLogEntry['action'],
    affectedCounts: Record<string, number>,
    result: AuditLogEntry['result'],
    details?: string
  ): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id: userId,
      operation_id: `op_${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      affectedCounts,
      result,
      details,
    };
    await this.saveItem(STORES.AUDIT_LOGS, entry, userId);
    return entry;
  }

  public static async getAuditLogs(userId: string): Promise<AuditLogEntry[]> {
    try {
      const items = await this.getStoreItems<AuditLogEntry>(STORES.AUDIT_LOGS, userId);
      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  // PENDING SYNC QUEUE MANAGEMENT
  public static async addPendingOperation(
    userId: string,
    entity: PendingSyncOperation['entity'],
    entityId: string,
    operation: 'upsert' | 'delete',
    payload?: any
  ): Promise<PendingSyncOperation> {
    const db = await this.getDB();
    return new Promise<PendingSyncOperation>((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_OPS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_OPS);

      const index = store.index('user_id');
      const req = index.getAll(userId);

      req.onsuccess = () => {
        const existingOps: PendingSyncOperation[] = req.result || [];
        const existing = existingOps.find((op) => op.entity === entity && op.entity_id === entityId);

        let opId = existing ? existing.id : `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        const op: PendingSyncOperation = {
          id: opId,
          user_id: userId,
          entity,
          entity_id: entityId,
          operation,
          payload,
          created_at: existing ? existing.created_at : new Date().toISOString(),
          retry_count: existing ? existing.retry_count : 0,
          status: 'pending',
        };

        store.put(op);
        tx.oncomplete = () => {
          console.log(`[Spendly Sync Queue] Added operation ${op.operation} on ${entity}:${entityId} (opId: ${op.id})`);
          resolve(op);
        };
        tx.onerror = () => reject(tx.error);
      };

      req.onerror = () => reject(req.error);
    });
  }

  public static async getPendingOperations(userId: string): Promise<PendingSyncOperation[]> {
    try {
      const ops = await this.getStoreItems<PendingSyncOperation>(STORES.PENDING_OPS, userId);
      return ops.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } catch {
      return [];
    }
  }

  public static async removePendingOperation(opId: string): Promise<void> {
    await this.deleteItem(STORES.PENDING_OPS, opId);
    console.log(`[Spendly Sync Queue] Removed operation opId: ${opId}`);
  }

  public static async updatePendingOperation(op: PendingSyncOperation): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_OPS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_OPS);
      store.put(op);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Clear user stores (for Reset Local Data)
  public static async clearUserData(userId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const storeNames = [
        STORES.ACCOUNTS,
        STORES.TRANSACTIONS,
        STORES.BUDGETS,
        STORES.RECURRING,
        STORES.NOTIFICATIONS,
        STORES.CATEGORIES,
        STORES.SETTINGS,
        STORES.PENDING_OPS,
      ];

      for (const name of storeNames) {
        const tx = db.transaction(name, 'readwrite');
        const store = tx.objectStore(name);
        if (name === STORES.SETTINGS) {
          store.delete(userId);
        } else if (store.indexNames.contains('user_id')) {
          const index = store.index('user_id');
          const request = index.getAllKeys(userId);
          request.onsuccess = () => {
            const keys = request.result || [];
            keys.forEach((k) => store.delete(k));
          };
        }
      }
    } catch (err) {
      console.warn('IndexedDB clearUserData error:', err);
    }
  }
}
