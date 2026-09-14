import React from 'react';
import type { Transaction, Account, Category } from '../../types/finance';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';

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

  let icon = <ArrowUpRight size={16} color="var(--status-expense)" />;
  let iconBg = 'rgba(244, 63, 94, 0.12)';
  let iconBorder = 'rgba(244, 63, 94, 0.25)';
  let amountColor = 'var(--text-primary)';
  let sign = '-';

  if (isIncome) {
    icon = <ArrowDownLeft size={16} color="var(--accent-cyan)" />;
    iconBg = 'rgba(34, 211, 238, 0.12)';
    iconBorder = 'rgba(34, 211, 238, 0.25)';
    amountColor = 'var(--accent-cyan)';
    sign = '+';
  } else if (isTransfer) {
    icon = <ArrowLeftRight size={16} color="var(--accent-blue)" />;
    iconBg = 'rgba(96, 165, 250, 0.12)';
    iconBorder = 'rgba(96, 165, 250, 0.25)';
    amountColor = 'var(--accent-blue)';
    sign = '';
  }

  const title = transaction.merchant || transaction.note || category?.name || 'Transaction';
  const accountInfo = isTransfer
    ? `${account?.name || 'Source'} → ${toAccount?.name || 'Destination'}`
    : account?.name || 'Account';

  return (
    <div
      onClick={() => onEdit && onEdit(transaction)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
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
              fontSize: '0.9rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <span>{category?.name || 'General'}</span>
            <span>•</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
              {accountInfo}
            </span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: amountColor }} className="tabular-nums">
          {hideBalances ? '₹•••••' : `${sign}₹${transaction.amount.toLocaleString()}`}
        </span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
          {transaction.time || transaction.date}
        </span>
      </div>
    </div>
  );
};
