import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IndexedDBService, type TrashSnapshot } from '../../db/indexedDB';
import { StorageEngine } from '../../db/storage';

interface TrashRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrashRecoveryModal: React.FC<TrashRecoveryModalProps> = ({ isOpen, onClose }) => {
  const { user, triggerManualSync, showToast } = useApp();
  const [snapshots, setSnapshots] = useState<TrashSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadSnapshots();
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const loadSnapshots = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const items = await IndexedDBService.getTrashSnapshots(user.id);
      setSnapshots(items);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (snapshot: TrashSnapshot) => {
    if (!user?.id || restoringId) return;
    setRestoringId(snapshot.id);

    try {
      const success = StorageEngine.importFullBackup(snapshot.data, user.id);
      if (success) {
        await IndexedDBService.addAuditLog(
          user.id,
          'RESTORE_TRASH',
          {
            accounts: snapshot.summary.accountsCount,
            transactions: snapshot.summary.transactionsCount,
            budgets: snapshot.summary.budgetsCount,
          },
          'SUCCESS',
          `Restored workspace from trash snapshot deleted on ${snapshot.deleted_at}`
        );

        showToast('Workspace successfully restored from Trash Snapshot!', 'success');
        await triggerManualSync();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showToast('Could not parse snapshot data.', 'danger');
      }
    } catch (err: any) {
      showToast(`Restore failed: ${err?.message || String(err)}`, 'danger');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trash-recovery-title"
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
      <div style={{ width: '100%', maxWidth: '580px' }}>
        <GlassCard elevated style={{ padding: '24px', position: 'relative' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RotateCcw size={22} color="var(--accent-cyan)" />
              <div>
                <h3 id="trash-recovery-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Trash & Recovery Center
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Deleted workspace snapshots are safely retained for 7 days
                </span>
              </div>
            </div>

            <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close Trash Recovery Center">
              <X size={18} />
            </button>
          </div>

          {/* List of Trash Snapshots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                Loading trash snapshots...
              </div>
            ) : snapshots.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  backgroundColor: 'rgba(10, 14, 30, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)',
                  fontSize: '0.86rem',
                }}
              >
                <Trash2 size={32} color="var(--text-muted)" style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>No deleted workspace snapshots found in trash recovery storage.</p>
              </div>
            ) : (
              snapshots.map((snap) => {
                const deletedDate = new Date(snap.deleted_at).toLocaleString();
                const expiresDate = new Date(snap.expires_at).toLocaleDateString();

                return (
                  <div
                    key={snap.id}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-solid-dark)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          Deleted Workspace Snapshot
                        </strong>
                        <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                          Recoverable
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Deleted: {deletedDate} • Retained until: {expiresDate}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-lavender)', marginTop: '6px' }}>
                        {snap.summary.accountsCount} accounts • {snap.summary.transactionsCount} transactions • {snap.summary.budgetsCount} budgets
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestore(snap)}
                      disabled={restoringId === snap.id}
                      className="btn btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      <RotateCcw size={14} />
                      <span>{restoringId === snap.id ? 'Restoring...' : 'Restore Workspace'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
