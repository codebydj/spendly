import { supabase } from './supabase';
import type { Account, Transaction, Budget, RecurringPayment, NotificationItem, AppSettings, BackupData } from '../types/finance';
import { IndexedDBService } from '../db/indexedDB';

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

export class SyncService {
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
          details: accRes.error.details,
          hint: accRes.error.hint,
          code: accRes.error.code,
        });
      }
      if (txRes.error) {
        console.error('SUPABASE ERROR [transactions.select]:', {
          message: txRes.error.message,
          details: txRes.error.details,
          hint: txRes.error.hint,
          code: txRes.error.code,
        });
      }
      if (bRes.error) {
        console.error('SUPABASE ERROR [budgets.select]:', {
          message: bRes.error.message,
          details: bRes.error.details,
          hint: bRes.error.hint,
          code: bRes.error.code,
        });
      }
      if (rRes.error) {
        console.error('SUPABASE ERROR [recurring_payments.select]:', {
          message: rRes.error.message,
          details: rRes.error.details,
          hint: rRes.error.hint,
          code: rRes.error.code,
        });
      }
      if (nRes.error) {
        console.error('SUPABASE ERROR [notifications.select]:', {
          message: nRes.error.message,
          details: nRes.error.details,
          hint: nRes.error.hint,
          code: nRes.error.code,
        });
      }
      if (sRes.error) {
        console.error('SUPABASE ERROR [user_settings.select]:', {
          message: sRes.error.message,
          details: sRes.error.details,
          hint: sRes.error.hint,
          code: sRes.error.code,
        });
      }
      if (pRes.error) {
        console.error('SUPABASE ERROR [profiles.select]:', {
          message: pRes.error.message,
          details: pRes.error.details,
          hint: pRes.error.hint,
          code: pRes.error.code,
        });
      }

      const accounts = (accRes.data || []).map(this.mapAccountFromDb);
      const transactions = (txRes.data || []).map(this.mapTransactionFromDb);
      const budgets = (bRes.data || []).map(this.mapBudgetFromDb);
      const recurringPayments = (rRes.data || []).map(this.mapRecurringFromDb);
      const notifications = (nRes.data || []).map(this.mapNotificationFromDb);
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

  // 2. Flush Pending Sync Queue to Supabase Cloud
  public static async flushPendingOperations(
    userId: string
  ): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
    const ops = await IndexedDBService.getPendingOperations(userId);
    if (ops.length === 0) {
      return { success: true, processedCount: 0, errors: [] };
    }

    console.log(`[Spendly Sync Engine] Flushing ${ops.length} pending operations for user ${userId}...`);
    let processedCount = 0;
    const errors: string[] = [];

    for (const op of ops) {
      try {
        let opSuccess = false;

        if (op.operation === 'upsert') {
          if (op.entity === 'transactions' && op.payload) {
            opSuccess = await this.upsertTransaction(op.payload, userId);
          } else if (op.entity === 'accounts' && op.payload) {
            opSuccess = await this.upsertAccount(op.payload, userId);
          } else if (op.entity === 'budgets' && op.payload) {
            opSuccess = await this.upsertBudget(op.payload, userId);
          } else if (op.entity === 'recurring_payments' && op.payload) {
            opSuccess = await this.upsertRecurring(op.payload, userId);
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
          processedCount++;
        } else {
          op.retry_count = (op.retry_count || 0) + 1;
          op.status = 'failed';
          op.error = 'Cloud sync operation failed';
          await IndexedDBService.updatePendingOperation(op);
          errors.push(`Failed operation ${op.operation} on ${op.entity}:${op.entity_id}`);
          break; // Preserve exact operational sequence
        }
      } catch (err: any) {
        op.retry_count = (op.retry_count || 0) + 1;
        op.status = 'failed';
        op.error = err?.message || String(err);
        await IndexedDBService.updatePendingOperation(op);
        errors.push(`Exception in ${op.operation} on ${op.entity}:${op.entity_id}: ${err.message}`);
        break;
      }
    }

    return {
      success: errors.length === 0,
      processedCount,
      errors,
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
            details: error.details,
            hint: error.hint,
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
            details: error.details,
            hint: error.hint,
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
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Budgets upload failed: ${error.message} (${error.code})`);
        }
      }

      if (data.recurringPayments.length > 0) {
        const rRows = data.recurringPayments.map((r) => this.mapRecurringToDb(r, userId));
        let { error } = await supabase.from('recurring_payments').upsert(rRows);
        if (error && (error.code === 'PGRST204' || error.message?.includes('due_time'))) {
          // Safe fallback for legacy Supabase schema cache
          const fallbackRows = rRows.map(({ due_time, ...rest }: any) => rest);
          const fallbackRes = await supabase.from('recurring_payments').upsert(fallbackRows);
          error = fallbackRes.error;
        }
        if (error) {
          console.error('SUPABASE ERROR [recurring_payments.upsert]:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Recurring payments upload failed: ${error.message} (${error.code})`);
        }
      }

      if (data.notifications.length > 0) {
        const nRows = data.notifications.map((n) => this.mapNotificationToDb(n, userId));
        const { error } = await supabase.from('notifications').upsert(nRows);
        if (error) {
          console.error('SUPABASE ERROR [notifications.upsert]:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
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
            details: error.details,
            hint: error.hint,
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
        console.error('Supabase upsertAccount error:', error);
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
        console.error('Supabase deleteAccount error:', error);
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
        console.error('Supabase upsertTransaction error:', error);
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
        console.error('Supabase deleteTransaction error:', error);
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
        console.error('Supabase upsertBudget error:', error);
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
        console.error('Supabase deleteBudget error:', error);
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
      const { error } = await supabase.from('recurring_payments').upsert(row);
      if (error) {
        console.error('Supabase upsertRecurring error:', error);
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
        console.error('Supabase deleteRecurring error:', error);
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
        console.error('Supabase upsertNotification error:', error);
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
        console.error('Supabase clearNotifications error:', error);
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
        console.error('Supabase upsertSettings error:', error);
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
        console.error('Profile update failed:', dbError);
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (authError) {
        console.error('Profile update failed:', authError);
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
        console.error('SUPABASE ERROR [deleteAllUserData]:', err);
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
      name: row.name,
      type: row.type,
      balance: Number(row.opening_balance || 0),
      openingBalance: Number(row.opening_balance || 0),
      creditLimit: row.credit_limit ? Number(row.credit_limit) : undefined,
      institution: row.institution || undefined,
      color: row.color || undefined,
      currency: row.currency || '₹',
      isArchived: row.is_archived || false,
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  public static mapAccountToDb(acc: Account, userId: string) {
    return {
      id: acc.id,
      user_id: userId,
      name: acc.name,
      type: acc.type,
      opening_balance: acc.openingBalance,
      credit_limit: acc.creditLimit || 0,
      institution: acc.institution || null,
      color: acc.color || null,
      currency: acc.currency || '₹',
      is_archived: acc.isArchived || false,
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
