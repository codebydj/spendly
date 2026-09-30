import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { Account, Transaction } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { FileSpreadsheet, Upload, CheckCircle2, Download } from 'lucide-react';
import { parseCSV } from '../../utils/csv';
import { detectDuplicateTransaction } from '../../utils/calculations';

interface AccountStatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

interface ParsedStatementRow {
  date: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  categoryId: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  isValid: boolean;
  errorMessage?: string;
}

export const AccountStatementImportModal: React.FC<AccountStatementImportModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { categories, transactions, addTransaction, showToast } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview & Map, 3: Summary
  const [parsedRows, setParsedRows] = useState<ParsedStatementRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedDuplicateCount, setSkippedDuplicateCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!account) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length < 2) {
          showToast('CSV file must contain a header row and at least one data row', 'warning');
          return;
        }

        // Process statement rows
        const defaultCategory = categories.find((c) => c.name === 'Other') || categories[0];
        const processed: ParsedStatementRow[] = [];

        // Assume standard bank CSV headers or auto-detect columns
        const headers = rows[0].map((h) => h.toLowerCase().trim());
        const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time'));
        const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('payee') || h.includes('particular') || h.includes('narration') || h.includes('merchant'));
        const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('sum') || h.includes('total'));
        const debitIdx = headers.findIndex((h) => h.includes('debit') || h.includes('dr') || h.includes('out'));
        const creditIdx = headers.findIndex((h) => h.includes('credit') || h.includes('cr') || h.includes('in'));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || row.every((cell) => !cell.trim())) continue;

          let rawDate = dateIdx >= 0 && row[dateIdx] ? row[dateIdx].trim() : new Date().toISOString().slice(0, 10);
          let rawDesc = descIdx >= 0 && row[descIdx] ? row[descIdx].trim() : `Statement Import #${i}`;

          let amount = 0;
          let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';

          if (amountIdx >= 0 && row[amountIdx]) {
            const parsedVal = parseFloat(row[amountIdx].replace(/[^0-9.-]/g, ''));
            if (!isNaN(parsedVal)) {
              amount = Math.abs(parsedVal);
              type = parsedVal < 0 ? 'EXPENSE' : 'INCOME';
            }
          } else if (debitIdx >= 0 && row[debitIdx] && parseFloat(row[debitIdx].replace(/[^0-9.-]/g, '')) > 0) {
            amount = Math.abs(parseFloat(row[debitIdx].replace(/[^0-9.-]/g, '')));
            type = 'EXPENSE';
          } else if (creditIdx >= 0 && row[creditIdx] && parseFloat(row[creditIdx].replace(/[^0-9.-]/g, '')) > 0) {
            amount = Math.abs(parseFloat(row[creditIdx].replace(/[^0-9.-]/g, '')));
            type = 'INCOME';
          }

          // Format Date to YYYY-MM-DD
          let formattedDate = rawDate;
          if (rawDate.includes('/')) {
            const dParts = rawDate.split('/');
            if (dParts.length === 3) {
              const y = dParts[2].length === 4 ? dParts[2] : `20${dParts[2]}`;
              const m = dParts[0].padStart(2, '0');
              const d = dParts[1].padStart(2, '0');
              formattedDate = `${y}-${m}-${d}`;
            }
          }

          const isValid = amount > 0 && !isNaN(amount);
          const candidateTx: Partial<Transaction> = {
            amount,
            type,
            date: formattedDate,
            accountId: account.id,
            note: rawDesc,
          };

          const matchingTx = detectDuplicateTransaction(candidateTx as any, transactions);

          processed.push({
            date: formattedDate,
            amount,
            type,
            description: rawDesc,
            categoryId: defaultCategory?.id || '',
            isDuplicate: !!matchingTx,
            duplicateReason: matchingTx ? `Matches txn on ${matchingTx.date}` : undefined,
            isValid,
            errorMessage: !isValid ? 'Invalid amount or parse error' : undefined,
          });
        }

        setParsedRows(processed);
        setStep(2);
      } catch (err: any) {
        showToast('Failed to parse statement CSV file', 'danger');
      }
    };

    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    setIsProcessing(true);
    let impCount = 0;
    let dupCount = 0;
    let failCount = 0;
    const logs: string[] = [];

    const currentTime = new Date().toTimeString().slice(0, 5);

    parsedRows.forEach((row, idx) => {
      if (!row.isValid) {
        failCount++;
        logs.push(`Row ${idx + 1}: Failed - ${row.errorMessage || 'Invalid row data'}`);
        return;
      }

      if (row.isDuplicate) {
        dupCount++;
        logs.push(`Row ${idx + 1}: Skipped - Duplicate detected (${row.description} - ${formatINR(row.amount)})`);
        return;
      }

      addTransaction({
        type: row.type,
        amount: row.amount,
        accountId: account.id,
        categoryId: row.categoryId || categories[0]?.id || '',
        date: row.date,
        time: currentTime,
        note: row.description,
        paymentMethod: 'Bank Transfer',
      });

      impCount++;
      logs.push(`Row ${idx + 1}: Imported ${row.type} ${formatINR(row.amount)} - ${row.description}`);
    });

    setImportedCount(impCount);
    setSkippedDuplicateCount(dupCount);
    setFailedCount(failCount);
    setImportLogs(logs);
    setIsProcessing(false);
    setStep(3);
    showToast(`Successfully imported ${impCount} statement transactions!`, 'success');
  };

  const handleDownloadLog = () => {
    const logContent = [
      `Spendly Bank Statement Import Report`,
      `Account: ${account.institution || ''} - ${account.name}`,
      `Import Date: ${new Date().toLocaleString()}`,
      `Imported: ${importedCount}`,
      `Skipped Duplicates: ${skippedDuplicateCount}`,
      `Failed Rows: ${failedCount}`,
      `----------------------------------------`,
      ...importLogs,
    ].join('\n');

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statement_import_${account.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Bank Statement (CSV)"
      subtitle={`Import transactions into ${account.name} from bank CSV export with duplicate detection.`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Step 1: Upload */}
        {step === 1 && (
          <div
            style={{
              padding: '32px 20px',
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              backgroundColor: 'var(--bg-main)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <FileSpreadsheet size={36} color="var(--accent-cyan)" />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Upload CSV Bank Statement</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports standard bank exports with Date, Amount, Particulars/Description columns.
              </p>
            </div>

            <label className="btn btn-primary" style={{ cursor: 'pointer', padding: '10px 20px' }}>
              <Upload size={16} /> Choose CSV File
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* Step 2: Preview & Category Mapping */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Parsed {parsedRows.length} Rows from Statement
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {parsedRows.filter((r) => r.isDuplicate).length} Duplicates Detected
              </span>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px' }}>Date</th>
                    <th style={{ padding: '8px' }}>Description</th>
                    <th style={{ padding: '8px' }}>Amount</th>
                    <th style={{ padding: '8px' }}>Category</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)', opacity: row.isDuplicate ? 0.6 : 1 }}>
                      <td style={{ padding: '8px' }}>{row.date}</td>
                      <td style={{ padding: '8px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.description}
                      </td>
                      <td style={{ padding: '8px', color: row.type === 'INCOME' ? 'var(--accent-cyan)' : 'var(--status-expense)', fontWeight: 700 }}>
                        {row.type === 'INCOME' ? '+' : '-'}{formatINR(row.amount)}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.categoryId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRows((prev) => prev.map((r, i) => (i === idx ? { ...r, categoryId: val } : r)));
                          }}
                          style={{ fontSize: '0.75rem', padding: '2px 4px' }}
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        {row.isDuplicate ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                            DUPLICATE
                          </span>
                        ) : row.isValid ? (
                          <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                            READY
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                            INVALID
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                Back
              </button>
              <button type="button" onClick={handleExecuteImport} className="btn btn-primary" disabled={isProcessing}>
                Confirm & Import {parsedRows.filter((r) => r.isValid && !r.isDuplicate).length} Transactions
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Summary Report */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--accent-cyan)',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Import Complete!</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Statement records processed and synchronized with account transactions.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>IMPORTED</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'block' }}>{importedCount}</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>DUPLICATES SKIPPED</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-warning)', display: 'block' }}>{skippedDuplicateCount}</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>FAILED ROWS</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-expense)', display: 'block' }}>{failedCount}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={handleDownloadLog} className="btn btn-secondary">
                <Download size={15} /> Download Import Log
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
