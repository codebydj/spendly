import type { Transaction, Account, Category } from '../types/finance';

/**
 * Clean, robust, offline-first CSV and File Export engine for Spendly V3.1.3.
 * Uses local IndexedDB / React state data without requiring Supabase cloud connectivity.
 */

export interface ExportResult {
  success: boolean;
  count?: number;
  fileName?: string;
  message?: string;
}

/**
 * Escapes CSV field values strictly according to RFC 4180 standard.
 * Handles double quotes, commas, and line breaks in notes, descriptions, or merchants.
 */
function escapeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  // Double internal quotes and enclose whole field in double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Export active user transactions to UTF-8 CSV file with UTF-8 BOM (\uFEFF)
 * so Microsoft Excel and other spreadsheet applications parse encoding and special characters cleanly.
 */
export function exportTransactionsCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): ExportResult {
  if (!transactions || transactions.length === 0) {
    return { success: false, message: 'No transactions available to export' };
  }

  // 18 required CSV Headers as specified by requirement
  const headers = [
    'Transaction ID',
    'Date',
    'Time',
    'Type',
    'Amount',
    'Account',
    'Destination Account',
    'Category',
    'Merchant',
    'Description',
    'Note',
    'Payment Method',
    'Location Name',
    'Location Address',
    'Latitude',
    'Longitude',
    'Created Date',
    'Updated Date',
  ];

  const rows = transactions.map((tx) => {
    const categoryName = categories.find((c) => c.id === tx.categoryId)?.name || '';
    const accountName = accounts.find((a) => a.id === tx.accountId)?.name || '';
    const toAccountName = tx.toAccountId
      ? accounts.find((a) => a.id === tx.toAccountId)?.name || ''
      : '';

    return [
      escapeCSVField(tx.id),
      escapeCSVField(tx.date),
      escapeCSVField(tx.time || ''),
      escapeCSVField(tx.type),
      escapeCSVField(tx.amount),
      escapeCSVField(accountName),
      escapeCSVField(toAccountName),
      escapeCSVField(categoryName),
      escapeCSVField(tx.merchant || ''),
      escapeCSVField(tx.description || ''),
      escapeCSVField(tx.note || ''),
      escapeCSVField(tx.paymentMethod || ''),
      escapeCSVField(tx.locationName || ''),
      escapeCSVField(tx.locationAddress || ''),
      escapeCSVField(tx.latitude !== undefined && tx.latitude !== null ? tx.latitude : ''),
      escapeCSVField(tx.longitude !== undefined && tx.longitude !== null ? tx.longitude : ''),
      escapeCSVField(tx.createdAt || ''),
      escapeCSVField(tx.updatedAt || ''),
    ].join(',');
  });

  // Include UTF-8 BOM (\uFEFF) for Excel character set recognition
  const csvContent = '\uFEFF' + headers.map(h => `"${h}"`).join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const fileName = `spendly_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { success: true, count: transactions.length, fileName };
}
