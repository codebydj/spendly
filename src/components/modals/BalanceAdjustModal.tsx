import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { Account } from '../../types/finance';
import { formatINR } from '../../utils/currency';
interface BalanceAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

export const BalanceAdjustModal: React.FC<BalanceAdjustModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { adjustAccountBalance, showToast } = useApp();

  const [actualBalanceStr, setActualBalanceStr] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account && isOpen) {
      setActualBalanceStr(String(account.balance));
      setReason('');
    }
  }, [account, isOpen]);

  if (!account) return null;

  const currentCalculatedBalance = account.balance;
  const parsedActual = parseFloat(actualBalanceStr);
  const isValidNumber = !isNaN(parsedActual) && isFinite(parsedActual);
  const difference = isValidNumber ? parsedActual - currentCalculatedBalance : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNumber) {
      showToast('Please enter a valid actual balance', 'warning');
      return;
    }

    if (Math.abs(difference) < 0.01) {
      showToast('Actual balance is already equal to calculated balance', 'info');
      onClose();
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      showToast('Please provide a reason/note for this balance adjustment (min 3 characters)', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      adjustAccountBalance(account.id, parsedActual, reason.trim());
      showToast(
        `Adjusted balance for "${account.name}" by ${difference >= 0 ? '+' : ''}${formatINR(difference)}`,
        'success'
      );
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust balance', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Account Balance"
      subtitle={`Reconcile difference between Spendly calculated balance and bank statement for ${account.name}.`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Step 1: Current Calculated Balance */}
        <div style={{ padding: '14px 18px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Current Calculated Balance
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }} className="tabular-nums">
            {formatINR(currentCalculatedBalance)}
          </div>
        </div>

        {/* Step 2: Actual Real Balance Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Actual Bank / Statement Balance (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            required
            value={actualBalanceStr}
            onChange={(e) => setActualBalanceStr(e.target.value)}
            placeholder="0.00"
            style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
            className="tabular-nums"
          />
        </div>

        {/* Step 3: Adjustment Preview */}
        {isValidNumber && Math.abs(difference) >= 0.01 && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: difference >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: difference >= 0 ? '1px solid var(--accent-cyan)' : '1px solid var(--status-expense)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: difference >= 0 ? 'var(--accent-cyan)' : 'var(--status-expense)' }}>
                {difference >= 0 ? 'INCOME ADJUSTMENT' : 'EXPENSE ADJUSTMENT'}
              </span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Adjustment amount to post to account transactions:
              </div>
            </div>

            <span
              style={{ fontSize: '1.2rem', fontWeight: 800, color: difference >= 0 ? 'var(--accent-cyan)' : 'var(--status-expense)' }}
              className="tabular-nums"
            >
              {difference >= 0 ? '+' : ''}{formatINR(difference)}
            </span>
          </div>
        )}

        {/* Step 4: Required Reason / Note */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Reason / Note for Adjustment *
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Bank charge correction, Unrecorded interest, Statement sync offset"
            style={{ width: '100%' }}
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isValidNumber}>
            Post Balance Adjustment
          </button>
        </div>
      </form>
    </Modal>
  );
};
