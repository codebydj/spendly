import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { RefreshCw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SyncService, type UserCloudData, type WorkspaceSyncResult } from '../../services/syncService';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({ isOpen, onClose }) => {
  const {
    accounts,
    transactions,
    budgets,
    recurringPayments,
    user,
    syncStatus,
    pendingOpsCount,
    triggerManualSync,
    runSyncDiagnostic,
  } = useApp();

  const [cloudCounts, setCloudCounts] = useState<UserCloudData | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<WorkspaceSyncResult | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadCloudCounts();
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const loadCloudCounts = async () => {
    if (!user?.id) return;
    setIsLoadingCloud(true);
    try {
      const data = await SyncService.fetchUserData(user.id);
      setCloudCounts(data);
    } catch {
      // Handle error gracefully
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleRunRetry = async () => {
    if (!user?.id || isRetrying) return;
    setIsRetrying(true);
    try {
      const result = await SyncService.flushPendingOperations(user.id);
      setLastSyncResult(result);
      await triggerManualSync();
      await loadCloudCounts();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRunDiag = async () => {
    const res = await runSyncDiagnostic();
    setDiagnosticResult(res);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-center-title"
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <GlassCard elevated style={{ padding: '24px', position: 'relative' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw size={22} color="var(--accent-blue)" />
              <div>
                <h3 id="sync-center-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Sync Center & Data Integrity
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Status: <strong style={{ color: syncStatus === 'SYNCED' ? 'var(--accent-cyan)' : 'var(--status-warning)' }}>{syncStatus}</strong> • {pendingOpsCount} pending local ops
                </span>
              </div>
            </div>

            <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close Sync Center">
              <X size={18} />
            </button>
          </div>

          {/* Counts Comparison Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                backgroundColor: 'rgba(10, 14, 30, 0.6)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accounts</span>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                  Local: {accounts.length} | Cloud: {isLoadingCloud ? '...' : cloudCounts?.accounts.length ?? 0}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transactions</span>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                  Local: {transactions.length} | Cloud: {isLoadingCloud ? '...' : cloudCounts?.transactions.length ?? 0}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Budgets</span>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                  Local: {budgets.length} | Cloud: {isLoadingCloud ? '...' : cloudCounts?.budgets.length ?? 0}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reminders</span>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                  Local: {recurringPayments.length} | Cloud: {isLoadingCloud ? '...' : cloudCounts?.recurringPayments.length ?? 0}
                </div>
              </div>
            </div>

            {/* Detailed Entity Sync Breakdown */}
            {lastSyncResult && (
              <div style={{ backgroundColor: 'var(--bg-solid-dark)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-lavender)', textTransform: 'uppercase' }}>
                  Last Synchronization Operation Log ({lastSyncResult.status.toUpperCase()})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', fontSize: '0.8rem' }}>
                  {lastSyncResult.results.map((res) => (
                    <div key={res.entity} style={{ display: 'flex', justifyContent: 'space-between', color: res.failed > 0 ? 'var(--status-expense)' : 'var(--text-secondary)' }}>
                      <span>{res.entity}:</span>
                      <span>
                        Attempted: {res.attempted} | Succeeded: {res.succeeded} | Failed: {res.failed}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic Message */}
            {diagnosticResult && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: diagnosticResult.success ? 'rgba(32, 196, 232, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: diagnosticResult.success ? '1px solid rgba(32, 196, 232, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: diagnosticResult.success ? 'var(--accent-cyan)' : 'var(--status-expense)',
                  fontSize: '0.82rem',
                }}
              >
                <strong>Diagnostic Test:</strong> {diagnosticResult.message}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={handleRunDiag}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              Run Diagnostic Test
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleRunRetry}
                disabled={isRetrying}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              >
                <RefreshCw size={14} className={isRetrying ? 'spin' : ''} />
                <span>{isRetrying ? 'Retrying Sync...' : 'Flush & Retry Pending Sync'}</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
