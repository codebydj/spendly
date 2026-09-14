import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { RecurringPayment } from '../../types/finance';

interface EditRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: RecurringPayment | null;
}

export const EditRecurringModal: React.FC<EditRecurringModalProps> = ({
  isOpen,
  onClose,
  reminder,
}) => {
  const { accounts, categories, editRecurring } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'MONTHLY' | 'WEEKLY' | 'YEARLY' | 'DAILY'>('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(1);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setAmount(String(reminder.amount));
      setFrequency(reminder.frequency || 'MONTHLY');
      setNextDueDate(reminder.nextDueDate);
      setDueTime(reminder.dueTime || '09:00');
      setReminderDaysBefore(reminder.reminderDaysBefore ?? 1);
      setAccountId(reminder.accountId || (accounts[0]?.id || ''));
      setCategoryId(reminder.categoryId || (categories[0]?.id || ''));
    }
  }, [reminder, accounts, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminder) return;
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    editRecurring(reminder.id, {
      title: title.trim(),
      amount: parsedAmount,
      frequency,
      nextDueDate,
      dueTime,
      reminderDaysBefore,
      accountId: accountId || accounts[0]?.id || '',
      categoryId: categoryId || categories[0]?.id || '',
      isPaused: reminder.isPaused,
      note: reminder.note,
    });

    onClose();
  };

  if (!reminder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Reminder / Bill"
      subtitle="Update reminder title, amount, due date & notification settings."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Reminder / Service Name
          </label>
          <input
            type="text"
            placeholder="e.g. Rent, Electricity, Netflix, EMI"
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
              <option value="DAILY">Daily</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Due Date
            </label>
            <input
              type="date"
              required
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Due Time
            </label>
            <input
              type="time"
              required
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Notify Days Before
            </label>
            <select
              value={reminderDaysBefore}
              onChange={(e) => setReminderDaysBefore(parseInt(e.target.value, 10))}
              style={{ width: '100%', fontSize: '0.82rem' }}
            >
              <option value={0}>On due date</option>
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
              <option value={7}>7 days before</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Account
            </label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ width: '100%' }}>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
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
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Reminder
          </button>
        </div>
      </form>
    </Modal>
  );
};
