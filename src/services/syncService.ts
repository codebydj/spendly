import { supabase } from './supabase.ts';
import type { Account, Transaction, Budget, RecurringPayment, NotificationItem, AppSettings, BackupData } from '../types/finance.ts';
import { IndexedDBService } from '../db/indexedDB.ts';

export interface UserCloudData {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  recurringPayments: RecurringPayment[];
  notifications: NotificationItem[];
  settings: AppSettings | null;
  profile: { fullName?: string; email?: string } | null;
  hasCloudData: boolean;
}

export interface EntitySyncResult {
  entity: 'accounts' | 'transactions' | 'budgets' | 'categories' | 'recurring_payments' | 'settings' | 'notifications';
  attempted: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    recordId?: string;
    code?: string;
    message: string;
  }>;
}

export interface WorkspaceSyncResult {
  status: 'synced' | 'partial' | 'failed';
  results: EntitySyncResult[];
  pendingChanges: number;
  startedAt: string;
  completedAt: string;
}

const MAX_SYNC_RETRIES = 5;

export class SyncService {
  /** Validate recurring payment payload before writing to Supabase */
  public static validateRecurringPayment(payload: any): { valid: boolean; reason?: string } {
    if (!payload) return { valid: false, reason: 'Payload is null or undefined' };
    if (!payload.title || typeof payload.title !== 'string' || !payload.title.trim()) {
      return { valid: false, reason: 'Recurring payment title is required' };
    }
    if (typeof payload.amount !== 'number' || isNaN(payload.amount) || payload.amount <= 0) {
      return { valid: false, reason: 'Recurring payment amount must be greater than 0' };
    }
    if (!payload.account_id || typeof payload.account_id !== 'string') {
      return { valid: false, reason: 'Valid Account ID is required' };
    }
    if (!payload.category_id || typeof payload.category_id !== 'string') {
      return { valid: false, reason: 'Valid Category ID is required' };
    }
    if (!payload.next_due_date || typeof payload.next_due_date !== 'string') {
      return { valid: false, reason: 'Valid next due date is required' };
    }
    return { valid: true };
  }

  // 1. Fetch All User Data From Supabase Cloud
  public static async fetchUserData(userId: string): Promise<UserCloudData> {
    try {
      const [accRes, txRes, bRes, rRes, nRes, sRes, pRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('recurring_payments').select('*').eq('user_id', userId),
        supabase.from('notifications').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      ]);

      if (accRes.error) {
        console.error('SUPABASE ERROR [accounts.select]:', {
          message: accRes.error.message,
          code: accRes.error.code,
        });
      }
      if (txRes.error) {
        console.error('SUPABASE ERROR [transactions.select]:', {
          message: txRes.error.message,
          code: txRes.error.code,
        });
      }
      if (bRes.error) {
        console.error('SUPABASE ERROR [budgets.select]:', {
          message: bRes.error.message,
          code: bRes.error.code,
        });
      }
      if (rRes.error) {
        console.error('SUPABASE ERROR [recurring_payments.select]:', {
          message: rRes.error.message,
          code: rRes.error.code,
        });
      }
      if (nRes.error) {
        console.error('SUPABASE ERROR [notifications.select]:', {
          message: nRes.error.message,
          code: nRes.error.code,
        });
      }
      if (sRes.error) {
        console.error('SUPABASE ERROR [user_settings.select]:', {
          message: sRes.error.message,
          code: sRes.error.code,
        });
      }
      if (pRes.error) {
        console.error('SUPABASE ERROR [profiles.select]:', {
          message: pRes.error.message,
          code: pRes.error.code,
        });
      }

      const accounts = (accRes.data || []).map((row) => this.mapAccountFromDb(row));
      const transactions = (txRes.data || []).map((row) => this.mapTransactionFromDb(row));
      const budgets = (bRes.data || []).map((row) => this.mapBudgetFromDb(row));
      const recurringPayments = (rRes.data || []).map((row) => this.mapRecurringFromDb(row));
      const notifications = (nRes.data || []).map((row) => this.mapNotificationFromDb(row));
      const settings = sRes.data ? this.mapSettingsFromDb(sRes.data) : null;
      const profile = pRes.data ? { fullName: pRes.data.full_name, email: pRes.data.email } : null;

      const hasCloudData =
        accounts.length > 0 ||
        transactions.length > 0 ||
        budgets.length > 0 ||
        recurringPayments.length > 0 ||
        settings !== null;

      return {
        accounts,
        transactions,
        budgets,
        recurringPayments,
        notifications,
        settings,
        profile,
        hasCloudData,
      };
    } catch (err) {
      console.error('Failed to fetch user data from Supabase:', err);
      return {
        accounts: [],
        transactions: [],
        budgets: [],
        recurringPayments: [],
        notifications: [],
        settings: null,
        profile: null,
        hasCloudData: false,
      };
    }
  }

  // 2. Flush Pending Sync Queue to Supabase Cloud with Result Aggregation
  public static async flushPendingOperations(
    userId: string
  ): Promise<WorkspaceSyncResult> {
    const startedAt = new Date().toISOString();
    const ops = await IndexedDBService.getPendingOperations(userId);

    const entityMap: Record<EntitySyncResult['entity'], EntitySyncResult> = {
      accounts: { entity: 'accounts', attempted: 0, succeeded: 0, failed: 0, errors: [] },
      transactions: { entity: 'transactions', attempted: 0, succeeded: 0, failed: 0, errors: [] },
      budgets: { entity: 'budgets', attempted: 0, succeeded: 0, failed: 0, errors: [] },
      categories: { entity: 'categories', attempted: 0, succeeded: 0, failed: 0, errors: [] },
      recurring_payments: { entity: 'recurring_payments', attempted: 0, succeeded: 0, failed: 0, errors: [] },
      settings: { entity: 'settings', attempted: 0, succeeded: 0, failed: 0, errors: [] },
      notifications: { entity: 'notifications', attempted: 0, succeeded: 0, failed: 0, errors: [] },
    };

    if (ops.length === 0) {
      return {
        status: 'synced',
        results: Object.values(entityMap),
        pendingChanges: 0,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    }

    console.log(`[Spendly Sync Engine] Flushing ${ops.length} pending operations for user ${userId}...`);

    for (const op of ops) {
      // Map pending_ops entity name to entity type
      let entityType: EntitySyncResult['entity'] = 'transactions';
      if (op.entity === 'accounts') entityType = 'accounts';
      else if (op.entity === 'budgets') entityType = 'budgets';
      else if (op.entity === 'recurring_payments') entityType = 'recurring_payments';
      else if (op.entity === 'notifications') entityType = 'notifications';
      else if (op.entity === 'user_settings') entityType = 'settings';
      else if (op.entity === 'categories') entityType = 'categories';

      const res = entityMap[entityType];
      res.attempted++;

      // Dead-letter check for max retries
      if ((op.retry_count || 0) >= MAX_SYNC_RETRIES) {
        op.status = 'failed';
        op.error = `Exceeded max retry attempts (${MAX_SYNC_RETRIES}). Moved to Dead-Letter Queue.`;
        await IndexedDBService.updatePendingOperation(op);
        res.failed++;
        res.errors.push({
          recordId: op.entity_id,
          code: 'DEAD_LETTER_MAX_RETRIES',
          message: op.error,
        });
        continue;
      }

      try {
        let opSuccess = false;
        let errorMessage = '';
        let errorCode = '';

        if (op.operation === 'upsert') {
          if (op.entity === 'transactions' && op.payload) {
            opSuccess = await this.upsertTransaction(op.payload, userId);
          } else if (op.entity === 'accounts' && op.payload) {
            opSuccess = await this.upsertAccount(op.payload, userId);
          } else if (op.entity === 'budgets' && op.payload) {
            opSuccess = await this.upsertBudget(op.payload, userId);
          } else if (op.entity === 'recurring_payments' && op.payload) {
            const val = this.validateRecurringPayment(this.mapRecurringToDb(op.payload, userId));
            if (!val.valid) {
              opSuccess = false;
              errorMessage = val.reason || 'Invalid recurring payment payload';
              errorCode = 'PAYLOAD_VALIDATION_ERROR';
            } else {
              opSuccess = await this.upsertRecurring(op.payload, userId);
            }
          } else if (op.entity === 'notifications' && op.payload) {
            opSuccess = await this.upsertNotification(op.payload, userId);
          } else if (op.entity === 'user_settings' && op.payload) {
            opSuccess = await this.upsertSettings(op.payload, userId);
          }
        } else if (op.operation === 'delete') {
          if (op.entity === 'transactions') {
            opSuccess = await this.deleteTransaction(op.entity_id, userId);
          } else if (op.entity === 'accounts') {
            opSuccess = await this.deleteAccount(op.entity_id, userId);
          } else if (op.entity === 'budgets') {
            opSuccess = await this.deleteBudget(op.entity_id, userId);
          } else if (op.entity === 'recurring_payments') {
            opSuccess = await this.deleteRecurring(op.entity_id, userId);
          }
        }

        if (opSuccess) {
          await IndexedDBService.removePendingOperation(op.id);
          res.succeeded++;
        } else {
          op.retry_count = (op.retry_count || 0) + 1;
          op.status = 'failed';
          op.error = errorMessage || 'Cloud write returned failure status';
          await IndexedDBService.updatePendingOperation(op);
          res.failed++;
          res.errors.push({
            recordId: op.entity_id,
            code: errorCode || 'CLOUD_WRITE_FAILURE',
            message: op.error,
          });

          // Exponential backoff pause before next record
          const delayMs = Math.min(1000 * Math.pow(2, op.retry_count - 1), 8000);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      } catch (err: any) {
        op.retry_count = (op.retry_count || 0) + 1;
        op.status = 'failed';
        op.error = err?.message || String(err);
        await IndexedDBService.updatePendingOperation(op);
        res.failed++;
        res.errors.push({
          recordId: op.entity_id,
          code: 'EXCEPTION',
          message: op.error || 'Exception occurred',
        });
      }
    }

    const remainingOps = await IndexedDBService.getPendingOperations(userId);
    const results = Object.values(entityMap);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const totalSucceeded = results.reduce((sum, r) => sum + r.succeeded, 0);

    let status: WorkspaceSyncResult['status'] = 'synced';
    if (totalFailed > 0 && totalSucceeded > 0) {
      status = 'partial';
    } else if (totalFailed > 0 && totalSucceeded === 0) {
      status = 'failed';
    }

    return {
      status,
      results,
      pendingChanges: remainingOps.length,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  // 3. Upload Local Data to Supabase (Migration Helper)
  public static async uploadLocalDataToCloud(data: BackupData, userId: string): Promise<boolean> {
    try {
      if (data.accounts.length > 0) {
        const accRows = data.accounts.map((a) => this.mapAccountToDb(a, userId));
        const { error } = await supabase.from('accounts').upsert(accRows);
        if (error) {
          console.error('SUPABASE ERROR [accounts.upsert]:', {
            message: error.message,
            code: error.code,
          });
          throw new Error(`Accounts upload failed: ${error.message} (${error.code})`);
        }
      }

      if (data.transactions.length > 0) {
        const txRows = data.transactions.map((t) => this.mapTransactionToDb(t, userId));
        const { error } = await supabase.from('transactions').upsert(txRows);
        if (error) {
          console.error('SUPABASE ERROR [transactions.upsert]:', {
            message: error.message,
            code: error.code,
          });
          throw new Error(`Transactions upload failed: ${error.message} (${error.code})`);
        }
      }

      if (data.budgets.length > 0) {
        const bRows = data.budgets.map((b) => this.mapBudgetToDb(b, userId));
        const { error } = await supabase.from('budgets').upsert(bRows);
        if (error) {
          console.error('SUPABASE ERROR [budgets.upsert]:', {
            message: error.message,
            code: error.code,
          });
          throw new Error(`Budgets upload failed: ${error.message} (${error.code})`);
        }
      }

      if (data.recurringPayments.length > 0) {
        const rRows = data.recurringPayments.map((r) => this.mapRecurringToDb(r, userId));
        // Validate each recurring payment before upsert
        for (const row of rRows) {
          const val = this.validateRecurringPayment(row);
          if (!val.valid) {
            console.warn(`[SyncService] Skipping invalid recurring payment "${row.title}": ${val.reason}`);
          }
        }
        const validRows = rRows.filter((row) => this.validateRecurringPayment(row).valid);

        if (validRows.length > 0) {
          let { error } = await supabase.from('recurring_payments').upsert(validRows);
          if (error && (error.code === 'PGRST204' || error.message?.includes('due_time'))) {
            const fallbackRows = validRows.map(({ due_time, ...rest }: any) => rest);
            const fallbackRes = await supabase.from('recurring_payments').upsert(fallbackRows);
            error = fallbackRes.error;
          }
          if (error) {
            console.error('SUPABASE ERROR [recurring_payments.upsert]:', {
              message: error.message,
              code: error.code,
            });
            throw new Error(`Recurring payments upload failed: ${error.message} (${error.code})`);
          }
        }
      }

      if (data.notifications.length > 0) {
        const nRows = data.notifications.map((n) => this.mapNotificationToDb(n, userId));
        const { error } = await supabase.from('notifications').upsert(nRows);
        if (error) {
          console.error('SUPABASE ERROR [notifications.upsert]:', {
            message: error.message,
            code: error.code,
          });
          throw new Error(`Notifications upload failed: ${error.message} (${error.code})`);
        }
      }

      if (data.settings) {
        const { error } = await supabase.from('user_settings').upsert(this.mapSettingsToDb(data.settings, userId));
        if (error) {
          console.error('SUPABASE ERROR [user_settings.upsert]:', {
            message: error.message,
            code: error.code,
          });
          throw new Error(`Settings upload failed: ${error.message} (${error.code})`);
        }
      }

      return true;
    } catch (err: any) {
      console.error('Failed to upload local data to Supabase:', err);
      throw err;
    }
  }

  // Diagnostic Test Method
  public static async runSyncDiagnostic(_userId?: string): Promise<{ success: boolean; message: string; details?: any }> {
    console.group('SPENDLY SYNC DIAGNOSTIC');
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        console.groupEnd();
        return { success: false, message: `Auth error: ${authErr?.message || 'No active user session'}` };
      }

      const testId = `acc_diag_${Date.now()}`;
      const testRow = {
        id: testId,
        user_id: user.id,
        name: 'Sync Test Bank',
        type: 'BANK',
        opening_balance: 10000,
        credit_limit: 0,
        currency: '₹',
        is_archived: false,
        updated_at: new Date().toISOString(),
      };

      const { error: insErr } = await supabase.from('accounts').insert(testRow).select();
      if (insErr) {
        console.groupEnd();
        return { success: false, message: `Accounts INSERT failed: ${insErr.message} (Code: ${insErr.code})`, details: insErr };
      }

      const { data: selData, error: selErr } = await supabase.from('accounts').select('*').eq('user_id', user.id);
      if (selErr) {
        console.groupEnd();
        return { success: false, message: `Accounts SELECT failed: ${selErr.message} (Code: ${selErr.code})`, details: selErr };
      }

      await supabase.from('accounts').delete().eq('id', testId).eq('user_id', user.id);
      console.groupEnd();

      const foundCount = selData ? selData.length : 0;
      return { success: true, message: `Accounts INSERT & SELECT passed! Total cloud accounts: ${foundCount}` };
    } catch (err: any) {
      console.groupEnd();
      return { success: false, message: `Diagnostic exception: ${err.message || String(err)}` };
    }
  }

  // 4. Account Cloud Operations
  public static async upsertAccount(account: Account, userId: string): Promise<boolean> {
    try {
      const row = this.mapAccountToDb(account, userId);
      const { error } = await supabase.from('accounts').upsert(row);
      if (error) {
        console.error('Supabase upsertAccount error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('upsertAccount exception:', err);
      return false;
    }
  }

  public static async deleteAccount(accountId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', accountId).eq('user_id', userId);
      if (error) {
        console.error('Supabase deleteAccount error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('deleteAccount exception:', err);
      return false;
    }
  }

  // 5. Transaction Cloud Operations
  public static async upsertTransaction(tx: Transaction, userId: string): Promise<boolean> {
    try {
      const row = this.mapTransactionToDb(tx, userId);
      const { error } = await supabase.from('transactions').upsert(row);
      if (error) {
        console.error('Supabase upsertTransaction error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('upsertTransaction exception:', err);
      return false;
    }
  }

  public static async deleteTransaction(txId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', txId).eq('user_id', userId);
      if (error) {
        console.error('Supabase deleteTransaction error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('deleteTransaction exception:', err);
      return false;
    }
  }

  // 6. Budget Cloud Operations
  public static async upsertBudget(budget: Budget, userId: string): Promise<boolean> {
    try {
      const row = this.mapBudgetToDb(budget, userId);
      const { error } = await supabase.from('budgets').upsert(row);
      if (error) {
        console.error('Supabase upsertBudget error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('upsertBudget exception:', err);
      return false;
    }
  }

  public static async deleteBudget(budgetId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', budgetId).eq('user_id', userId);
      if (error) {
        console.error('Supabase deleteBudget error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('deleteBudget exception:', err);
      return false;
    }
  }

  // 7. Recurring Payment Cloud Operations
  public static async upsertRecurring(recurring: RecurringPayment, userId: string): Promise<boolean> {
    try {
      const row = this.mapRecurringToDb(recurring, userId);
      const val = this.validateRecurringPayment(row);
      if (!val.valid) {
        console.error('upsertRecurring payload validation failed:', val.reason);
        return false;
      }
      const { error } = await supabase.from('recurring_payments').upsert(row);
      if (error) {
        console.error('Supabase upsertRecurring error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('upsertRecurring exception:', err);
      return false;
    }
  }

  public static async deleteRecurring(recurringId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recurring_payments')
        .delete()
        .eq('id', recurringId)
        .eq('user_id', userId);
      if (error) {
        console.error('Supabase deleteRecurring error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('deleteRecurring exception:', err);
      return false;
    }
  }

  // 8. Notification Cloud Operations
  public static async upsertNotification(notification: NotificationItem, userId: string): Promise<boolean> {
    try {
      const row = this.mapNotificationToDb(notification, userId);
      const { error } = await supabase.from('notifications').upsert(row);
      if (error) {
        console.error('Supabase upsertNotification error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('upsertNotification exception:', err);
      return false;
    }
  }

  public static async clearNotifications(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
      if (error) {
        console.error('Supabase clearNotifications error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('clearNotifications exception:', err);
      return false;
    }
  }

  // 9. User Settings & Profile Cloud Operations
  public static async upsertSettings(settings: AppSettings, userId: string): Promise<boolean> {
    try {
      const row = this.mapSettingsToDb(settings, userId);
      const { error } = await supabase.from('user_settings').upsert(row);
      if (error) {
        console.error('Supabase upsertSettings error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (err) {
      console.error('upsertSettings exception:', err);
      return false;
    }
  }

  public static async updateUserProfile(userId: string, email: string, fullName: string): Promise<boolean> {
    try {
      const { error: dbError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (dbError) {
        console.error('Profile update failed:', dbError.message);
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (authError) {
        console.error('Profile update failed:', authError.message);
      }

      if (dbError && authError) {
        return false;
      }
      return true;
    } catch (err) {
      console.error('Profile update failed:', err);
      return false;
    }
  }

  public static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password' };
    }
  }

  // 10. Delete All User Cloud Data
  public static async deleteAllUserData(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [txRes, accRes, bRes, rRes, nRes] = await Promise.all([
        supabase.from('transactions').delete().eq('user_id', userId),
        supabase.from('accounts').delete().eq('user_id', userId),
        supabase.from('budgets').delete().eq('user_id', userId),
        supabase.from('recurring_payments').delete().eq('user_id', userId),
        supabase.from('notifications').delete().eq('user_id', userId),
      ]);

      const err = txRes.error || accRes.error || bRes.error || rRes.error || nRes.error;
      if (err) {
        console.error('SUPABASE ERROR [deleteAllUserData]:', err.message);
        return { success: false, error: err.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete cloud records' };
    }
  }

  // Data Mappers
  public static mapAccountFromDb(row: any): Account {
    return {
      id: row.id,
      userId: row.user_id || undefined,
      name: row.name,
      institution: row.institution || undefined,
      type: row.type || 'BANK',
      lastFourDigits: row.last_four_digits || row.last_four || undefined,
      branchName: row.branch_name || undefined,
      routingCode: row.routing_code || row.ifsc_code || undefined,
      currency: row.currency || '₹',
      color: row.color || undefined,
      iconName: row.icon_name || undefined,
      description: row.description || undefined,
      balance: Number(row.opening_balance || 0),
      openingBalance: Number(row.opening_balance || 0),
      creditLimit: row.credit_limit !== null && row.credit_limit !== undefined ? Number(row.credit_limit) : undefined,
      includeInNetWorth: row.include_in_net_worth !== false,
      includeInAnalytics: row.include_in_analytics !== false,
      isDefault: row.is_default || false,
      isArchived: row.is_archived || false,
      lastReconciledAt: row.last_reconciled_at || undefined,
      lastReconciledBalance: row.last_reconciled_balance !== null && row.last_reconciled_balance !== undefined ? Number(row.last_reconciled_balance) : undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  public static mapAccountToDb(acc: Account, userId: string) {
    return {
      id: acc.id,
      user_id: userId,
      name: acc.name,
      institution: acc.institution || null,
      type: acc.type,
      last_four_digits: acc.lastFourDigits || null,
      branch_name: acc.branchName || null,
      routing_code: acc.routingCode || null,
      currency: acc.currency || '₹',
      color: acc.color || null,
      icon_name: acc.iconName || null,
      description: acc.description || null,
      opening_balance: acc.openingBalance,
      credit_limit: acc.creditLimit || 0,
      include_in_net_worth: acc.includeInNetWorth !== false,
      include_in_analytics: acc.includeInAnalytics !== false,
      is_default: acc.isDefault || false,
      is_archived: acc.isArchived || false,
      last_reconciled_at: acc.lastReconciledAt || null,
      last_reconciled_balance: acc.lastReconciledBalance !== undefined ? acc.lastReconciledBalance : null,
      updated_at: acc.updatedAt || new Date().toISOString(),
    };
  }

  public static mapTransactionFromDb(row: any): Transaction {
    return {
      id: row.id,
      type: row.type,
      amount: Number(row.amount || 0),
      accountId: row.account_id,
      toAccountId: row.to_account_id || undefined,
      categoryId: row.category_id,
      date: row.date,
      time: row.time,
      merchant: row.merchant || undefined,
      description: row.description || undefined,
      note: row.note || '',
      paymentMethod: row.payment_method || undefined,
      locationName: row.location_name || undefined,
      locationAddress: row.location_address || undefined,
      latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : undefined,
      longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : undefined,
      locationPlaceId: row.location_place_id || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  public static mapTransactionToDb(tx: Transaction, userId: string) {
    return {
      id: tx.id,
      user_id: userId,
      type: tx.type,
      amount: tx.amount,
      account_id: tx.accountId,
      to_account_id: tx.toAccountId || null,
      category_id: tx.categoryId,
      date: tx.date,
      time: tx.time,
      merchant: tx.merchant || null,
      description: tx.description || null,
      note: tx.note || '',
      payment_method: tx.paymentMethod || null,
      location_name: tx.locationName || null,
      location_address: tx.locationAddress || null,
      latitude: tx.latitude !== undefined && tx.latitude !== null ? tx.latitude : null,
      longitude: tx.longitude !== undefined && tx.longitude !== null ? tx.longitude : null,
      location_place_id: tx.locationPlaceId || null,
      created_at: tx.createdAt || new Date().toISOString(),
      updated_at: tx.updatedAt || new Date().toISOString(),
    };
  }

  public static mapBudgetFromDb(row: any): Budget {
    return {
      id: row.id,
      categoryId: row.category_id,
      monthlyLimit: Number(row.monthly_limit || 0),
    };
  }

  public static mapBudgetToDb(b: Budget, userId: string) {
    return {
      id: b.id,
      user_id: userId,
      category_id: b.categoryId,
      monthly_limit: b.monthlyLimit,
    };
  }

  public static mapRecurringFromDb(row: any): RecurringPayment {
    return {
      id: row.id,
      title: row.title,
      amount: Number(row.amount || 0),
      frequency: row.frequency,
      nextDueDate: row.next_due_date,
      dueTime: row.due_time || undefined,
      accountId: row.account_id,
      categoryId: row.category_id,
      isPaused: row.is_paused || false,
      reminderDaysBefore: row.reminder_days_before || 1,
      note: row.note || undefined,
    };
  }

  public static mapRecurringToDb(r: RecurringPayment, userId: string) {
    return {
      id: r.id,
      user_id: userId,
      title: r.title,
      amount: r.amount,
      frequency: r.frequency,
      next_due_date: r.nextDueDate,
      due_time: r.dueTime || null,
      account_id: r.accountId,
      category_id: r.categoryId,
      is_paused: r.isPaused || false,
      reminder_days_before: r.reminderDaysBefore || 1,
      note: r.note || null,
    };
  }

  public static mapNotificationFromDb(row: any): NotificationItem {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      date: row.date,
      isRead: row.is_read || false,
    };
  }

  public static mapNotificationToDb(n: NotificationItem, userId: string) {
    return {
      id: n.id,
      user_id: userId,
      type: n.type,
      title: n.title,
      message: n.message,
      date: n.date,
      is_read: n.isRead || false,
    };
  }

  public static mapSettingsFromDb(row: any): AppSettings {
    return {
      hideBalances: row?.hide_balances || false,
      pinEnabled: row?.pin_enabled || false,
      hashedPin: row?.hashed_pin || '',
      currency: row?.currency || '₹',
      lastSyncedAt: row?.last_synced_at || new Date().toISOString(),
      demoModeLoaded: row?.demo_mode_loaded || false,
    };
  }

  public static mapSettingsToDb(s: AppSettings, userId: string) {
    return {
      user_id: userId,
      hide_balances: s.hideBalances,
      pin_enabled: s.pinEnabled,
      hashed_pin: s.hashedPin,
      currency: s.currency || '₹',
      last_synced_at: new Date().toISOString(),
      demo_mode_loaded: s.demoModeLoaded || false,
    };
  }
}
