import React from 'react';
import type { Transaction, Account, Category } from '../../types/finance';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, MapPin, Pencil } from 'lucide-react';

interface TransactionRowProps {
  transaction: Transaction;
  account?: Account;
  toAccount?: Account;
  category?: Category;
  hideBalances?: boolean;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  account,
  toAccount,
  category,
  hideBalances = false,
  onEdit,
}) => {
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  let icon = <ArrowUpRight size={20} color="var(--status-expense)" />;
  let iconBg = 'rgba(244, 63, 94, 0.12)';
  let iconBorder = 'rgba(244, 63, 94, 0.25)';
  let amountColor = 'var(--text-primary)';
  let sign = '-';

  if (isIncome) {
    icon = <ArrowDownLeft size={20} color="var(--accent-cyan)" />;
    iconBg = 'rgba(34, 211, 238, 0.12)';
    iconBorder = 'rgba(34, 211, 238, 0.25)';
    amountColor = 'var(--accent-cyan)';
    sign = '+';
  } else if (isTransfer) {
    icon = <ArrowLeftRight size={20} color="var(--accent-blue)" />;
    iconBg = 'rgba(96, 165, 250, 0.12)';
    iconBorder = 'rgba(96, 165, 250, 0.25)';
    amountColor = 'var(--accent-blue)';
    sign = '';
  }

  const title = transaction.merchant || transaction.note || category?.name || 'Transaction';
  const accountInfo = isTransfer
    ? `${account?.name || 'Source'} → ${toAccount?.name || 'Destination'}`
    : account?.name || 'Account';

  const locationDisplay = transaction.locationName
    ? (transaction.locationAddress ? `${transaction.locationName}, ${transaction.locationAddress.split(',')[0]}` : transaction.locationName)
    : undefined;

  return (
    <div
      onClick={() => onEdit && onEdit(transaction)}
      aria-label="Edit transaction"
      title="Click to view/edit details"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        backgroundColor: 'rgba(22, 27, 58, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.12)',
        borderRadius: 'var(--radius-md)',
        cursor: onEdit ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
      }}
      className="glass-surface-interactive"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${iconBorder}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div style={{ overflow: 'hidden' }}>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>{category?.name || 'General'}</span>
            <span>•</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
              {accountInfo}
            </span>
          </div>
          {locationDisplay && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
              <MapPin size={14} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                {locationDisplay}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.98rem', fontWeight: 700, color: amountColor }} className="tabular-nums">
            {hideBalances ? '₹•••••' : `${sign}₹${transaction.amount.toLocaleString()}`}
          </span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
            {transaction.time || transaction.date}
          </span>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction);
            }}
            aria-label="Edit transaction"
            className="btn-icon"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Pencil size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
