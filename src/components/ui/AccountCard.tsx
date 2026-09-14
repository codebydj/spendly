import React from 'react';
import type { Account } from '../../types/finance';
import { CreditCard, Landmark, Wallet, Banknote } from 'lucide-react';

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
  const getAccountIcon = (type: string, name: string) => {
    const text = name.toLowerCase();
    if (text.includes('sbi') || text.includes('bank')) {
      return <Landmark size={18} color="var(--accent-blue)" />;
    }
    if (text.includes('hdfc') || type === 'CREDIT_CARD') {
      return <CreditCard size={18} color="var(--status-expense)" />;
    }
    if (type === 'CASH') {
      return <Banknote size={18} color="#F59E0B" />;
    }
    if (type === 'WALLET' || text.includes('upi') || text.includes('paytm')) {
      return <Wallet size={18} color="var(--accent-cyan)" />;
    }
    return <Landmark size={18} color="var(--accent-violet)" />;
  };

  const getAccountTintClass = (type: string, name: string) => {
    const text = name.toLowerCase();
    if (text.includes('sbi')) return 'account-tint-sbi';
    if (text.includes('hdfc') || type === 'CREDIT_CARD') return 'account-tint-hdfc';
    if (type === 'CASH') return 'account-tint-cash';
    return 'account-tint-upi';
  };

  const isCreditCard = account.type === 'CREDIT_CARD';
  const outstanding = account.balance;
  const creditLimit = account.creditLimit || 0;
  const availableCredit = Math.max(0, creditLimit - outstanding);
  const usedPercentage = creditLimit > 0 ? Math.min(100, Math.round((outstanding / creditLimit) * 100)) : 0;
  const tintClass = getAccountTintClass(account.type, account.name);

  return (
    <div
      onClick={onClick}
      className={`card-level-2 ${tintClass}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: onClick ? 'pointer' : 'default',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2)',
            }}
          >
            {getAccountIcon(account.type, account.name)}
          </div>
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
                  {hideBalances ? '₹•••••' : `₹${outstanding.toLocaleString()}`}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Available</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }} className="tabular-nums">
                  {hideBalances ? '₹•••••' : `₹${availableCredit.toLocaleString()}`}
                </div>
              </div>
            </div>

            {creditLimit > 0 && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${usedPercentage}%`, height: '100%', backgroundColor: usedPercentage > 80 ? 'var(--status-expense)' : 'var(--status-warning)', borderRadius: '2px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Limit: ₹{creditLimit.toLocaleString()}</span>
                  <span>{usedPercentage}% Used</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Available Balance</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }} className="tabular-nums">
              {hideBalances ? '₹•••••' : `₹${account.balance.toLocaleString()}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
