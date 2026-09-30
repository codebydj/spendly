import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { Account } from '../../types/finance';
import { Activity } from 'lucide-react';

interface AccountAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

interface ActivityEvent {
  id: string;
  title: string;
  type: string;
  timestamp: string;
  details?: string;
}

export const AccountAuditLogModal: React.FC<AccountAuditLogModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { transactions } = useApp();
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (account && isOpen) {
      // Synthesize activity history from account metadata, audit entries, and transactions
      const eventList: ActivityEvent[] = [];

      if (account.createdAt) {
        eventList.push({
          id: `created_${account.id}`,
          title: `Account Created`,
          type: 'CREATE',
          timestamp: account.createdAt,
          details: `Initial account created with type ${account.type} and opening balance ₹${account.openingBalance}`,
        });
      }

      if (account.updatedAt) {
        eventList.push({
          id: `updated_${account.id}`,
          title: `Account Settings Updated`,
          type: 'UPDATE',
          timestamp: account.updatedAt,
          details: `Name: ${account.name} • Institution: ${account.institution || 'N/A'}`,
        });
      }

      if (account.lastReconciledAt) {
        eventList.push({
          id: `reconciled_${account.id}`,
          title: `Account Statement Reconciled`,
          type: 'RECONCILE',
          timestamp: account.lastReconciledAt,
          details: `Reconciled statement balance: ₹${account.lastReconciledBalance || 0}`,
        });
      }

      if (account.isArchived) {
        eventList.push({
          id: `archived_${account.id}`,
          title: `Account Archived`,
          type: 'ARCHIVE',
          timestamp: account.updatedAt,
          details: `Account placed in archived storage`,
        });
      }

      // Add balance adjustment transactions
      const accAdjustments = transactions.filter(
        (t) => (t.accountId === account.id || t.toAccountId === account.id) && t.note.toLowerCase().includes('balance adjustment')
      );

      accAdjustments.forEach((adj) => {
        eventList.push({
          id: adj.id,
          title: `Balance Adjusted`,
          type: 'ADJUSTMENT',
          timestamp: adj.createdAt || adj.date,
          details: `${adj.note} (₹${adj.amount})`,
        });
      });

      // Sort by newest timestamp first
      eventList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(eventList);
    }
  }, [account, isOpen, transactions]);

  if (!account) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Audit History"
      subtitle={`Complete lifecycle event trail and change history for ${account.name}.`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {events.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No audit events recorded for this account.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
            {events.map((evt) => (
              <div
                key={evt.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent-blue-subtle)',
                    color: 'var(--accent-cyan)',
                    flexShrink: 0,
                  }}
                >
                  <Activity size={16} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{evt.title}</h5>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {evt.details && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{evt.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-primary">
            Close Audit Trail
          </button>
        </div>
      </div>
    </Modal>
  );
};
