import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { AccountType } from '../../types/finance';

export const AddAccountModal: React.FC = () => {
  const { isAddAccountOpen, setIsAddAccountOpen, addAccount } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [institution, setInstitution] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [color, setColor] = useState('#059669');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedBalance = parseFloat(openingBalance) || 0;

    addAccount({
      name: name.trim(),
      type,
      institution: institution.trim() || undefined,
      openingBalance: parsedBalance,
      currency: '₹',
      color,
    });

    setName('');
    setInstitution('');
    setOpeningBalance('');
    setIsAddAccountOpen(false);
  };

  return (
    <Modal
      isOpen={isAddAccountOpen}
      onClose={() => setIsAddAccountOpen(false)}
      title="Add Financial Account"
      subtitle="Track your money across bank accounts, cash, wallets, or credit cards."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Account Name
          </label>
          <input
            type="text"
            placeholder="e.g. SBI Savings, HDFC Savings, Cash"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Account Type
            </label>
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)} style={{ width: '100%' }}>
              <option value="BANK">Bank Account</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="WALLET">Wallet (UPI)</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Opening Balance (₹)
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              required
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              style={{ width: '100%' }}
              className="tabular-nums"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Institution Name (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. State Bank of India, ICICI Bank, Paytm"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Account Accent Color
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['#059669', '#2563EB', '#D97706', '#7C3AED', '#EC4899', '#4B5563'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: c,
                  border: color === c ? '2px solid var(--text-primary)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
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
