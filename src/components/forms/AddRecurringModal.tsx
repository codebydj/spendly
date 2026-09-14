import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';

export const AddRecurringModal: React.FC = () => {
  const { isAddRecurringOpen, setIsAddRecurringOpen, accounts, categories, addRecurring } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'MONTHLY' | 'WEEKLY' | 'YEARLY'>('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    addRecurring({
      title: title.trim(),
      amount: parsedAmount,
      frequency,
      nextDueDate,
      accountId: accountId || accounts[0]?.id || '',
      categoryId: categoryId || categories[0]?.id || '',
      isPaused: false,
      note: note.trim() || undefined,
    });

    setTitle('');
    setAmount('');
    setNote('');
    setIsAddRecurringOpen(false);
  };

  return (
    <Modal
      isOpen={isAddRecurringOpen}
      onClose={() => setIsAddRecurringOpen(false)}
      title="Add Recurring Payment / Subscription"
      subtitle="Track monthly rent, subscriptions, or scheduled utility payments."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Title / Service Name
          </label>
          <input
            type="text"
            placeholder="e.g. Rent, Netflix, Health Insurance"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Amount (₹)
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%' }}
              className="tabular-nums"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Frequency
            </label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} style={{ width: '100%' }}>
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Next Due Date
            </label>
            <input
              type="date"
              required
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Deduct Account
            </label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ width: '100%' }}>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Category
          </label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%' }}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button type="button" onClick={() => setIsAddRecurringOpen(false)} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Recurring Payment
          </button>
        </div>
      </form>
    </Modal>
  );
};
