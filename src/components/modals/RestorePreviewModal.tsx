import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Upload, AlertTriangle, X, FileText } from 'lucide-react';
import type { BackupData } from '../../types/finance';
import { validateJSONBackup } from '../../utils/exportUtils';
import { useApp } from '../../context/AppContext';

interface RestorePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestore: (backupData: BackupData) => Promise<boolean>;
}

export const RestorePreviewModal: React.FC<RestorePreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmRestore,
}) => {
  const { accounts: currentAccounts, transactions: currentTransactions } = useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateCounts, setDuplicateCounts] = useState<{ accounts: number; transactions: number }>({ accounts: 0, transactions: 0 });
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationError(null);
    setBackupData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const val = validateJSONBackup(parsed);

        if (!val.isValid) {
          setValidationError(val.error || 'Invalid backup file schema.');
          return;
        }

        // Perform Dry-run & Duplicate Detection
        const parsedAccs = Array.isArray(parsed.accounts) ? parsed.accounts : [];
        const parsedTxs = Array.isArray(parsed.transactions) ? parsed.transactions : [];

        const currentAccIds = new Set(currentAccounts.map((a) => a.id));
        const currentTxIds = new Set(currentTransactions.map((t) => t.id));

        const dupAccs = parsedAccs.filter((a: any) => currentAccIds.has(a.id)).length;
        const dupTxs = parsedTxs.filter((t: any) => currentTxIds.has(t.id)).length;

        setDuplicateCounts({ accounts: dupAccs, transactions: dupTxs });
        setBackupData(parsed as BackupData);
      } catch (err: any) {
        setValidationError(`File parsing failed: ${err.message || 'Malformed JSON content'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    if (!backupData || isRestoring) return;
    setIsRestoring(true);

    try {
      const ok = await onConfirmRestore(backupData);
      if (ok) {
        onClose();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-preview-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRestoring) onClose();
      }}
    >
      <div style={{ width: '100%', maxWidth: '540px' }}>
        <GlassCard elevated style={{ padding: '24px', position: 'relative' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Upload size={22} color="var(--accent-blue)" />
              <div>
                <h3 id="restore-preview-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Restore Backup & Dry-Run Preview
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Inspect data counts and duplicate detection before applying
                </span>
              </div>
            </div>

            <button onClick={onClose} disabled={isRestoring} className="btn-icon btn-ghost" aria-label="Close Restore Preview">
              <X size={18} />
            </button>
          </div>

          {/* File Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="backup-file-input"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(10, 14, 30, 0.4)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <FileText size={28} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedFile ? selectedFile.name : 'Choose Spendly Backup JSON File'}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports .json backup files'}
              </span>
              <input
                id="backup-file-input"
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--status-expense)',
                fontSize: '0.84rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Backup Preview Card */}
          {backupData && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-solid-dark)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent-cyan-border)',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Schema Version:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>V{backupData.version || '3.2.4'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Export Timestamp:</span>
                <span style={{ color: 'var(--text-primary)' }}>{new Date(backupData.exportedAt).toLocaleString()}</span>
              </div>

              {/* Record Counts Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: 'rgba(10, 14, 30, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  textAlign: 'center',
                  marginTop: '4px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Accounts</span>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{backupData.accounts?.length || 0}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Transactions</span>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{backupData.transactions?.length || 0}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Budgets</span>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{backupData.budgets?.length || 0}</strong>
                </div>
              </div>

              {/* Duplicate Detection Notice */}
              {(duplicateCounts.accounts > 0 || duplicateCounts.transactions > 0) && (
                <div style={{ fontSize: '0.78rem', color: 'var(--status-warning)', marginTop: '4px' }}>
                  Notice: Detected {duplicateCounts.accounts} existing accounts and {duplicateCounts.transactions} existing transactions. Records will be safely merged without creating duplicate IDs.
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={onClose} disabled={isRestoring} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!backupData || isRestoring}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '0.84rem',
                opacity: !backupData || isRestoring ? 0.45 : 1,
                cursor: !backupData || isRestoring ? 'not-allowed' : 'pointer',
              }}
            >
              {isRestoring ? 'Applying Restoration...' : 'Apply Restoration'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
