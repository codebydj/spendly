import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { Account } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface AccountReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

export const AccountReconciliationModal: React.FC<AccountReconciliationModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { transactions, reconcileAccount, showToast } = useApp();

  const [statementBalanceStr, setStatementBalanceStr] = useState('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account && isOpen) {
      setStatementBalanceStr(String(account.balance));
      setStatementDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [account, isOpen]);

  if (!account) return null;

  // Compute breakdown of account transactions
  const accTxs = transactions.filter((t) => t.accountId === account.id || t.toAccountId === account.id);

  let totalIncome = 0;
  let totalExpenses = 0;
  let transfersIn = 0;
  let transfersOut = 0;
  let adjustments = 0;

  accTxs.forEach((t) => {
    if (t.note.toLowerCase().includes('balance adjustment')) {
      adjustments += t.amount;
    } else if (t.type === 'INCOME' && t.accountId === account.id) {
      totalIncome += t.amount;
    } else if (t.type === 'EXPENSE' && t.accountId === account.id) {
      totalExpenses += t.amount;
    } else if (t.type === 'TRANSFER') {
      if (t.toAccountId === account.id) transfersIn += t.amount;
      if (t.accountId === account.id) transfersOut += t.amount;
    }
  });

  const calculatedBalance = account.balance;
  const statementBalance = parseFloat(statementBalanceStr);
  const isValidNumber = !isNaN(statementBalance) && isFinite(statementBalance);
  const difference = isValidNumber ? statementBalance - calculatedBalance : 0;
  const isReconciled = isValidNumber && Math.abs(difference) < 0.01;

  const handleReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNumber) {
      showToast('Please enter a valid statement balance', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      reconcileAccount(account.id, statementBalance, notes.trim() || undefined);
      showToast(
        isReconciled
          ? `Account "${account.name}" reconciled successfully!`
          : `Reconciled "${account.name}" with variance ${formatINR(difference)}`,
        isReconciled ? 'success' : 'info'
      );
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete reconciliation', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Reconciliation"
      subtitle={`Verify transactions and reconcile statement balances for ${account.name}.`}
    >
      <form onSubmit={handleReconcile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Account Financial Breakdown Matrix */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            padding: '16px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Opening Balance
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, display: 'block', marginTop: '2px' }} className="tabular-nums">
              {formatINR(account.openingBalance)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Income
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'block', marginTop: '2px' }} className="tabular-nums">
              +{formatINR(totalIncome)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--status-expense)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Expenses
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--status-expense)', display: 'block', marginTop: '2px' }} className="tabular-nums">
              -{formatINR(totalExpenses)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', textTransform: 'uppercase', fontWeight: 700 }}>
              Transfers In / Out
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} className="tabular-nums">
              +{formatINR(transfersIn)} / -{formatINR(transfersOut)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-violet)', textTransform: 'uppercase', fontWeight: 700 }}>
              Calculated Balance
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginTop: '2px' }} className="tabular-nums">
              {formatINR(calculatedBalance)}
            </span>
          </div>
        </div>

        {/* Statement Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Bank Statement Ending Balance (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              required
              value={statementBalanceStr}
              onChange={(e) => setStatementBalanceStr(e.target.value)}
              placeholder="0.00"
              style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
              className="tabular-nums"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Statement Ending Date
            </label>
            <input
              type="date"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Status Badge */}
        {isValidNumber && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isReconciled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: isReconciled ? '1px solid var(--accent-cyan)' : '1px solid var(--status-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isReconciled ? <CheckCircle2 color="var(--accent-cyan)" size={20} /> : <AlertTriangle color="var(--status-warning)" size={20} />}
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isReconciled ? 'var(--accent-cyan)' : 'var(--status-warning)' }}>
                  {isReconciled ? 'PERFECT RECONCILIATION MATCH' : 'VARIANCE DETECTED'}
                </span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {isReconciled
                    ? 'Calculated balance matches statement balance exactly.'
                    : `Difference of ${formatINR(Math.abs(difference))} between statement & app.`}
                </div>
              </div>
            </div>

            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isReconciled ? 'var(--accent-cyan)' : 'var(--status-warning)' }} className="tabular-nums">
              {formatINR(difference)}
            </span>
          </div>
        )}

        {account.lastReconciledAt && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Last reconciled on: <strong>{new Date(account.lastReconciledAt).toLocaleDateString()}</strong>
            {account.lastReconciledBalance !== undefined && ` (${formatINR(account.lastReconciledBalance)})`}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Reconciliation Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Verified September statement against PDF statement"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isValidNumber}>
            Mark Account Reconciled
          </button>
        </div>
      </form>
    </Modal>
  );
};
