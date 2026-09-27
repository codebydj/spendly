import React from 'react';
import type { Transaction, Account, Category } from '../../types/finance';
import { BottomSheet } from '../ui/BottomSheet';
import { formatINRMasked } from '../../utils/currency';
import { formatDisplayTime } from '../../utils/dateUtils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ArrowLeftRight, Calendar, MapPin, Pencil, Copy, Trash2, Tag, Wallet, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TransactionDetailProps {
  transaction: Transaction | null;
  account?: Account;
  toAccount?: Account;
  category?: Category;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailContent: React.FC<{
  transaction: Transaction;
  account?: Account;
  toAccount?: Account;
  category?: Category;
  hideBalances: boolean;
  onEdit: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}> = ({ transaction, account, toAccount, category, hideBalances, onEdit, onDuplicate, onDelete, onClose }) => {
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  let amountColor = 'var(--status-danger)';
  let sign = '-';
  let badgeText = 'Expense';

  if (isIncome) {
    amountColor = 'var(--accent-cyan)';
    sign = '+';
    badgeText = 'Income';
  } else if (isTransfer) {
    amountColor = 'var(--accent-blue)';
    sign = '';
    badgeText = 'Transfer';
  }

  const title = transaction.merchant || transaction.note || category?.name || (isTransfer ? 'Account Transfer' : 'Transaction');
  const accountInfo = isTransfer
    ? `${account?.name || 'Source Account'} → ${toAccount?.name || 'Destination Account'}`
    : account?.name || 'Account';

  let formattedDate = transaction.date;
  try {
    const d = new Date(transaction.date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    formattedDate = transaction.date;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero Amount & Category Card */}
      <div
        className="card-level-2"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '24px 20px',
          gap: '12px',
          backgroundColor: 'rgba(15, 21, 42, 0.75)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: isIncome ? 'rgba(32, 196, 232, 0.12)' : isTransfer ? 'rgba(86, 133, 255, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${isIncome ? 'rgba(32, 196, 232, 0.25)' : isTransfer ? 'rgba(86, 133, 255, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: amountColor,
          }}
        >
          {isTransfer ? (
            <ArrowLeftRight size={26} color="var(--accent-blue)" />
          ) : (
            <CategoryIcon categoryName={category?.name || title} iconName={(category as any)?.icon} size={26} color={amountColor} />
          )}
        </div>

        <div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</span>
          <div style={{ marginTop: '4px' }}>
            <span
              className={`badge ${isIncome ? 'badge-cyan' : isTransfer ? 'badge-blue' : 'badge-danger'}`}
              style={{ fontSize: '0.74rem', padding: '2px 8px' }}
            >
              {badgeText}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: amountColor, marginTop: '4px' }} className="tabular-nums">
          {sign}{formatINRMasked(transaction.amount, hideBalances)}
        </div>
      </div>

      {/* Detail Fields List */}
      <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
        {/* Category */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.86rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Tag size={16} color="var(--accent-violet)" />
            <span>Category</span>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{category?.name || 'Uncategorized'}</span>
        </div>

        {/* Account */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.86rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Wallet size={16} color="var(--accent-cyan)" />
            <span>Account</span>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '200px' }}>{accountInfo}</span>
        </div>

        {/* Date & Time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.86rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Calendar size={16} color="var(--accent-blue)" />
            <span>Date & Time</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {formattedDate} {transaction.time ? `• ${formatDisplayTime(transaction.time)}` : ''}
          </span>
        </div>

        {/* Location if present */}
        {transaction.locationName && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <MapPin size={16} color="var(--accent-cyan)" />
              <span>Location</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', textAlign: 'right', maxWidth: '200px' }}>
              {transaction.locationName}
            </span>
          </div>
        )}

        {/* Description / Notes if present */}
        {transaction.description && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
              <FileText size={15} />
              <span>Notes</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
              {transaction.description}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            onEdit(transaction);
          }}
          className="btn btn-secondary"
          style={{ padding: '10px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Pencil size={15} /> Edit
        </button>

        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            onDuplicate(transaction);
          }}
          className="btn btn-secondary"
          style={{ padding: '10px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Copy size={15} /> Duplicate
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (confirm('Delete this transaction?')) {
            onDelete(transaction.id);
            if (onClose) onClose();
          }
        }}
        className="btn"
        style={{
          padding: '10px',
          fontSize: '0.84rem',
          color: 'var(--status-expense)',
          backgroundColor: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <Trash2 size={15} /> Delete Transaction
      </button>
    </div>
  );
};

export const TransactionDetailBottomSheet: React.FC<TransactionDetailProps> = ({
  transaction,
  account,
  toAccount,
  category,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const { settings } = useApp();

  return (
    <BottomSheet isOpen={isOpen && !!transaction} onClose={onClose} title="Transaction Details">
      {transaction && (
        <TransactionDetailContent
          transaction={transaction}
          account={account}
          toAccount={toAccount}
          category={category}
          hideBalances={settings.hideBalances}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onClose={onClose}
        />
      )}
    </BottomSheet>
  );
};
