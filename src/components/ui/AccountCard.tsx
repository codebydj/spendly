import React from 'react';
import type { Account } from '../../types/finance';
import { BankLogo } from './BankLogo';
import { formatINR, formatINRMasked } from '../../utils/currency';

interface AccountCardProps {
  account: Account;
  hideBalances?: boolean;
  onClick?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  hideBalances = false,
  onClick,
}) => {
  const isCreditCard = account.type === 'CREDIT_CARD';
  const outstanding = account.balance;
  const creditLimit = account.creditLimit || 0;
  const availableCredit = Math.max(0, creditLimit - outstanding);
  const usedPercentage = creditLimit > 0 ? Math.min(100, Math.round((outstanding / creditLimit) * 100)) : 0;

  return (
    <div
      onClick={onClick}
      className="card-level-2 card-interactive btn-micro"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: onClick ? 'pointer' : 'default',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BankLogo accountName={account.name} accountType={account.type} size={22} />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{account.name}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {account.institution || account.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
          {account.type.replace('_', ' ')}
        </span>
      </div>

      <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {isCreditCard ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Outstanding</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-expense)', marginTop: '2px' }} className="tabular-nums">
                  {formatINRMasked(outstanding, hideBalances)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Available</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }} className="tabular-nums">
                  {formatINRMasked(availableCredit, hideBalances)}
                </div>
              </div>
            </div>

            {creditLimit > 0 && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${usedPercentage}%`, height: '100%', backgroundColor: usedPercentage > 80 ? 'var(--status-expense)' : 'var(--status-warning)', borderRadius: '2px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Limit: {formatINR(creditLimit)}</span>
                  <span>{usedPercentage}% Used</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Available Balance</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }} className="tabular-nums">
              {formatINRMasked(account.balance, hideBalances)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
