import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { AccountType } from '../../types/finance';
import { validateAccountFields, type AccountFieldErrors } from '../../utils/accountUtils';

export const AddAccountModal: React.FC = () => {
  const { isAddAccountOpen, setIsAddAccountOpen, addAccount, showToast } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [institution, setInstitution] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingCode, setRoutingCode] = useState('');
  const [currency] = useState('₹');
  const [openingBalance, setOpeningBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [color, setColor] = useState('#059669');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);
  const [includeInAnalytics, setIncludeInAnalytics] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<AccountFieldErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedBalance = parseFloat(openingBalance || '0');
    const parsedCreditLimit = creditLimit ? parseFloat(creditLimit) : undefined;

    const validation = validateAccountFields({
      name: name.trim(),
      lastFourDigits: lastFourDigits.trim() || undefined,
      routingCode: routingCode.trim() || undefined,
      openingBalance: isNaN(parsedBalance) ? 0 : parsedBalance,
      creditLimit: parsedCreditLimit,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('Please fix the validation errors before saving', 'warning');
      return;
    }

    addAccount({
      name: name.trim(),
      type,
      institution: institution.trim() || undefined,
      lastFourDigits: lastFourDigits.trim() || undefined,
      branchName: branchName.trim() || undefined,
      routingCode: routingCode.trim() || undefined,
      currency,
      openingBalance: isNaN(parsedBalance) ? 0 : parsedBalance,
      creditLimit: parsedCreditLimit !== undefined && !isNaN(parsedCreditLimit) ? parsedCreditLimit : undefined,
      color,
      includeInNetWorth,
      includeInAnalytics,
      isDefault,
    });

    setName('');
    setInstitution('');
    setLastFourDigits('');
    setBranchName('');
    setRoutingCode('');
    setOpeningBalance('');
    setCreditLimit('');
    setErrors({});
    setIsAddAccountOpen(false);
  };

  return (
    <Modal
      isOpen={isAddAccountOpen}
      onClose={() => setIsAddAccountOpen(false)}
      title="Add Financial Account"
      subtitle="Track your money across bank accounts, cash, wallets, or credit cards."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Account Name / Nickname *
          </label>
          <input
            type="text"
            placeholder="e.g. Salary Savings, HDFC Primary, Daily Cash"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            style={{ width: '100%', borderColor: errors.name ? 'var(--status-danger)' : undefined }}
          />
          {errors.name && <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Account Type *
            </label>
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)} style={{ width: '100%' }}>
              <option value="BANK">Bank Account</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="WALLET">Wallet (UPI)</option>
              <option value="INVESTMENT">Investment</option>
              <option value="LOAN">Loan</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Opening Balance (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              required
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              style={{ width: '100%' }}
              className="tabular-nums"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Institution / Bank Name
            </label>
            <input
              type="text"
              placeholder="e.g. State Bank of India, HDFC"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Last 4 Digits
            </label>
            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 1234"
              value={lastFourDigits}
              onChange={(e) => {
                setLastFourDigits(e.target.value);
                if (errors.lastFourDigits) setErrors((prev) => ({ ...prev, lastFourDigits: undefined }));
              }}
              style={{ width: '100%', borderColor: errors.lastFourDigits ? 'var(--status-danger)' : undefined }}
            />
            {errors.lastFourDigits && (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px', display: 'block' }}>{errors.lastFourDigits}</span>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Account Accent Color
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['#059669', '#2563EB', '#D97706', '#7C3AED', '#EC4899', '#4B5563', '#10B981'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: c,
                  border: color === c ? '2px solid var(--text-primary)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={includeInNetWorth} onChange={(e) => setIncludeInNetWorth(e.target.checked)} />
            <span>Include in Total Net Worth</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={includeInAnalytics} onChange={(e) => setIncludeInAnalytics(e.target.checked)} />
            <span>Include in Spending Analytics</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            <span>Set as Default Account</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" onClick={() => setIsAddAccountOpen(false)} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Account
          </button>
        </div>
      </form>
    </Modal>
  );
};
