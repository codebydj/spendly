import React, { useState } from 'react';
import type { Transaction, Account, Category } from '../../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { formatINRMasked, formatINR } from '../../utils/currency';
import { ArrowLeftRight, MapPin, MoreVertical, Pencil, Copy, Trash2, Map } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface TransactionRowProps {
  transaction: Transaction;
  account?: Account;
  toAccount?: Account;
  category?: Category;
  hideBalances?: boolean;
  onEdit?: (tx: Transaction) => void;
  onDuplicate?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  onViewLocationOnMap?: (tx: Transaction) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  account,
  toAccount,
  category,
  hideBalances = false,
  onEdit,
  onDuplicate,
  onDelete,
  onViewLocationOnMap,
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  let amountColor = 'var(--status-danger)';
  let sign = '-';
  let badgeColor = 'rgba(244, 63, 94, 0.12)';
  let badgeBorder = 'rgba(244, 63, 94, 0.25)';

  if (isIncome) {
    amountColor = 'var(--accent-cyan)';
    sign = '+';
    badgeColor = 'rgba(32, 196, 232, 0.12)';
    badgeBorder = 'rgba(32, 196, 232, 0.25)';
  } else if (isTransfer) {
    amountColor = 'var(--accent-blue)';
    sign = '';
    badgeColor = 'rgba(86, 133, 255, 0.12)';
    badgeBorder = 'rgba(86, 133, 255, 0.25)';
  }

  const title = transaction.merchant || transaction.note || category?.name || (isTransfer ? 'Account Transfer' : 'Transaction');
  const accountInfo = isTransfer
    ? `${account?.name || 'Source'} → ${toAccount?.name || 'Destination'}`
    : account?.name || 'Account';

  const locationDisplay = transaction.locationName
    ? (transaction.locationAddress ? `${transaction.locationName}, ${transaction.locationAddress.split(',')[0]}` : transaction.locationName)
    : undefined;

  const handleRowClick = () => {
    if (onEdit) onEdit(transaction);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActionSheetOpen(true);
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        aria-label={`Transaction ${title}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-solid-dark)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          gap: '12px',
          position: 'relative',
        }}
        className="card-interactive btn-micro"
      >
        {/* Category Vector Icon in Circle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: badgeColor,
              border: `1px solid ${badgeBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: amountColor,
            }}
          >
            {isTransfer ? (
              <ArrowLeftRight size={20} color="var(--accent-blue)" />
            ) : (
              <CategoryIcon categoryName={category?.name || title} iconName={(category as any)?.icon} size={20} color={amountColor} />
            )}
          </div>

          {/* Primary & Secondary Information */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: '0.94rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{category?.name || 'General'}</span>
              <span>•</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {accountInfo}
              </span>
            </div>
            {locationDisplay && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.73rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                <MapPin size={13} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                  {locationDisplay}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Amount & Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.98rem', fontWeight: 800, color: amountColor }} className="tabular-nums">
              {hideBalances ? '₹•••••' : `${sign}${formatINRMasked(transaction.amount)}`}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              {transaction.time || transaction.date}
            </span>
          </div>

          <button
            type="button"
            onClick={handleMenuClick}
            aria-label="Transaction options menu"
            className="btn-icon"
            style={{
              padding: '6px',
              color: 'var(--text-muted)',
              minHeight: '32px',
              minWidth: '32px',
            }}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Transaction Actions Bottom Sheet */}
      <BottomSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title={title}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Amount</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: amountColor }} className="tabular-nums">
              {sign}{formatINR(transaction.amount)}
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              {category?.name || 'General'} • {accountInfo}
            </span>
          </div>

          {onEdit && (
            <button
              onClick={() => {
                setIsActionSheetOpen(false);
                onEdit(transaction);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-solid-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left',
              }}
            >
              <Pencil size={18} color="var(--accent-cyan)" />
              <span>Edit Transaction</span>
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => {
                setIsActionSheetOpen(false);
                onDuplicate(transaction);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-solid-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left',
              }}
            >
              <Copy size={18} color="var(--accent-blue)" />
              <span>Duplicate Transaction</span>
            </button>
          )}

          {transaction.latitude !== undefined && transaction.longitude !== undefined && onViewLocationOnMap && (
            <button
              onClick={() => {
                setIsActionSheetOpen(false);
                onViewLocationOnMap(transaction);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-solid-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left',
              }}
            >
              <Map size={18} color="var(--accent-violet)" />
              <span>View Location on Map</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                setIsActionSheetOpen(false);
                if (confirm(`Delete transaction "${title}"?`)) {
                  onDelete(transaction.id);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--status-danger-subtle)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: 'var(--status-danger)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left',
                marginTop: '4px',
              }}
            >
              <Trash2 size={18} />
              <span>Delete Transaction</span>
            </button>
          )}
        </div>
      </BottomSheet>
    </>
  );
};
