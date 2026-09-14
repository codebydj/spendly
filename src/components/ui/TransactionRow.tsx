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
  let amountColor = 'var(--text-primary)';
  let sign = '-';

  if (isIncome) {
    icon = <ArrowDownLeft size={16} color="var(--accent-emerald)" />;
    amountColor = 'var(--accent-emerald)';
    sign = '+';
  } else if (isTransfer) {
    icon = <ArrowLeftRight size={16} color="var(--accent-blue)" />;
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
        padding: '12px 14px',
        backgroundColor: 'rgba(15, 20, 30, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: onEdit ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
      className="glass-surface-interactive"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(10, 14, 22, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-strong)',
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
