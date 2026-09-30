import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { AlertTriangle, RefreshCw, Trash2, X, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface DestructiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'RESET_LOCAL' | 'DELETE_WORKSPACE';
  onConfirmLocalReset?: () => Promise<{ recoveredCount: number }>;
  onConfirmWorkspaceDelete?: (password?: string) => Promise<{ success: boolean; error?: string }>;
}

export const DestructiveConfirmModal: React.FC<DestructiveModalProps> = ({
  isOpen,
  onClose,
  mode,
  onConfirmLocalReset,
  onConfirmWorkspaceDelete,
}) => {
  const { accounts, transactions, budgets, recurringPayments, categories, user } = useApp();
  const [inputText, setInputText] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const targetPhrase = mode === 'RESET_LOCAL' ? 'RESET LOCAL' : 'DELETE MY WORKSPACE';
  const isPhraseMatching = inputText.trim() === targetPhrase;
  const isDeleteMode = mode === 'DELETE_WORKSPACE';

  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setAuthPassword('');
      setIsExecuting(false);
      setResultMessage(null);
    }
  }, [isOpen, mode]);

  // Handle ESC key listener to safely dismiss without mutation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecuting) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExecuting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isPhraseMatching || isExecuting) return;

    setIsExecuting(true);
    setResultMessage(null);

    try {
      if (mode === 'RESET_LOCAL' && onConfirmLocalReset) {
        const result = await onConfirmLocalReset();
        setResultMessage({
          type: 'success',
          text: `Local device data cleared safely. Automatically recovered ${result.recoveredCount} records from Supabase cloud!`,
        });
        setTimeout(() => {
          onClose();
        }, 2200);
      } else if (mode === 'DELETE_WORKSPACE' && onConfirmWorkspaceDelete) {
        const res = await onConfirmWorkspaceDelete(authPassword);
        if (res.success) {
          setResultMessage({
            type: 'success',
            text: 'Workspace data backed up to Trash Recovery Center and wiped successfully.',
          });
          setTimeout(() => {
            onClose();
          }, 2200);
        } else {
          setResultMessage({
            type: 'error',
            text: res.error || 'Failed to complete workspace deletion. No data was modified.',
          });
        }
      }
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        text: err?.message || 'An error occurred during operation execution.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="destructive-modal-title"
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
        // Dismiss on backdrop click without mutation
        if (e.target === e.currentTarget && !isExecuting) {
          onClose();
        }
      }}
    >
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <GlassCard elevated style={{ padding: '24px', position: 'relative', border: '1px solid var(--status-danger)' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: isDeleteMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: isDeleteMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDeleteMode ? 'var(--status-expense)' : 'var(--status-warning)',
                }}
              >
                {isDeleteMode ? <Trash2 size={22} /> : <RefreshCw size={22} />}
              </div>
              <div>
                <h3 id="destructive-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isDeleteMode ? 'Delete All Workspace Data' : 'Reset Local Device Data'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isDeleteMode ? 'DANGER: Destructive Cloud & Local Wipe' : 'Device Storage Maintenance'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isExecuting}
              className="btn-icon btn-ghost"
              aria-label="Close dialog"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {mode === 'RESET_LOCAL' ? (
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <p style={{ fontWeight: 600, color: 'var(--status-warning)', marginBottom: '6px' }}>
                  What will happen:
                </p>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', lineHeight: '1.5' }}>
                  <li>Local IndexedDB and localStorage data on this device will be cleared.</li>
                  <li><strong>Your cloud data in Supabase will NOT be changed.</strong></li>
                  <li>After reset, Spendly will automatically attempt to restore your data from your active Supabase cloud session.</li>
                </ul>
              </div>
            ) : (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <p style={{ fontWeight: 700, color: 'var(--status-expense)', marginBottom: '8px' }}>
                  Warning: You are about to wipe your entire workspace dataset.
                </p>

                {/* Counts Summary */}
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
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Accounts</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{accounts.length}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Transactions</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{transactions.length}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Budgets</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{budgets.length}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Reminders</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{recurringPayments.length}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Categories</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{categories.length}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>User ID</span>
                    <strong style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{user?.id ? `${user.id.slice(0, 6)}...` : 'Guest'}</strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                  A server-side encrypted recovery snapshot will be retained in your Trash Recovery Center for 7 days before permanent deletion.
                </p>
              </div>
            )}

            {/* Confirmation Phrase Verification Input */}
            <div>
              <label htmlFor="confirm-phrase-input" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                To confirm, type <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', userSelect: 'all' }}>{targetPhrase}</span> below:
              </label>
              <input
                id="confirm-phrase-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type "${targetPhrase}"`}
                disabled={isExecuting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-solid-dark)',
                  border: isPhraseMatching ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                }}
                autoComplete="off"
              />
            </div>

            {/* Feedback Alert */}
            {resultMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: resultMessage.type === 'success' ? 'rgba(32, 196, 232, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: resultMessage.type === 'success' ? '1px solid rgba(32, 196, 232, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: resultMessage.type === 'success' ? 'var(--accent-cyan)' : 'var(--status-expense)',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {resultMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{resultMessage.text}</span>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isPhraseMatching || isExecuting}
              className={isDeleteMode ? 'btn btn-danger' : 'btn btn-primary'}
              style={{
                padding: '8px 20px',
                fontSize: '0.84rem',
                opacity: !isPhraseMatching || isExecuting ? 0.45 : 1,
                cursor: !isPhraseMatching || isExecuting ? 'not-allowed' : 'pointer',
              }}
            >
              {isExecuting ? (
                <span>Executing...</span>
              ) : isDeleteMode ? (
                <span>Confirm Workspace Deletion</span>
              ) : (
                <span>Confirm Local Reset</span>
              )}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
