import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { TransactionType } from '../../types/finance';
import { ArrowLeftRight, Check, Sparkles, CheckCircle2 } from 'lucide-react';

export const AddTransactionModal: React.FC = () => {
  const {
    isAddTransactionOpen,
    setIsAddTransactionOpen,
    accounts,
    categories,
    addTransaction,
    showToast,
  } = useApp();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [suggestedCatId, setSuggestedCatId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Set initial default account & category
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
      if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      }
    }
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [accounts, categories, accountId, categoryId]);

  // Smart Category Suggestion algorithm
  useEffect(() => {
    if (!note.trim() || type === 'TRANSFER') {
      setSuggestedCatId(null);
      return;
    }
    const text = note.toLowerCase();
    let suggested: string | null = null;

    if (text.includes('swiggy') || text.includes('zomato') || text.includes('lunch') || text.includes('dinner') || text.includes('cafe') || text.includes('food')) {
      suggested = categories.find((c) => c.name === 'Food')?.id || null;
    } else if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || text.includes('clothes') || text.includes('shopping')) {
      suggested = categories.find((c) => c.name === 'Shopping')?.id || null;
    } else if (text.includes('uber') || text.includes('rapido') || text.includes('ola') || text.includes('petrol') || text.includes('cab')) {
      suggested = categories.find((c) => c.name === 'Transport')?.id || null;
    } else if (text.includes('electricity') || text.includes('wifi') || text.includes('bill') || text.includes('recharge')) {
      suggested = categories.find((c) => c.name === 'Bills')?.id || null;
    } else if (text.includes('salary') || text.includes('stipend')) {
      suggested = categories.find((c) => c.name === 'Salary')?.id || null;
    }

    if (suggested && suggested !== categoryId) {
      setSuggestedCatId(suggested);
    } else {
      setSuggestedCatId(null);
    }
  }, [note, type, categories, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    if (!accountId) return;

    if (type === 'TRANSFER' && accountId === toAccountId) {
      showToast('Source and Destination accounts must be different for transfers', 'warning');
      return;
    }

    let finalCategoryId = categoryId;
    if (type === 'TRANSFER') {
      const transferCat = categories.find((c) => c.name === 'Transfer');
      finalCategoryId = transferCat ? transferCat.id : categories[0].id;
    }

    addTransaction({
      type,
      amount: parsedAmount,
      accountId,
      toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
      categoryId: finalCategoryId,
      date,
      time,
      note: note.trim() || (type === 'TRANSFER' ? 'Internal Account Transfer' : 'Quick Entry'),
      paymentMethod,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setAmount('');
      setNote('');
      setSuggestedCatId(null);
      setIsAddTransactionOpen(false);
    }, 450);
  };

  const suggestedCategoryObj = categories.find((c) => c.id === suggestedCatId);

  return (
    <Modal
      isOpen={isAddTransactionOpen}
      onClose={() => setIsAddTransactionOpen(false)}
      title="Add Transaction"
      subtitle="Fast transaction entry for your accounts."
    >
      {isSuccess ? (
        <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Transaction Saved</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {type === 'EXPENSE' ? '-' : type === 'INCOME' ? '+' : ''}₹{parseFloat(amount || '0').toLocaleString()}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Transaction Type Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              backgroundColor: 'rgba(10, 14, 22, 0.9)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => {
              const isActive = type === t;
              let activeBg = 'var(--bg-surface-elevated)';
              let activeColor = 'var(--accent-emerald)';
              if (t === 'EXPENSE' && isActive) activeColor = 'var(--status-expense)';
              if (t === 'TRANSFER' && isActive) activeColor = 'var(--accent-blue)';

              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    if (t === 'INCOME') {
                      const sal = categories.find((c) => c.type === 'INCOME');
                      if (sal) setCategoryId(sal.id);
                    } else if (t === 'EXPENSE') {
                      const exp = categories.find((c) => c.type === 'EXPENSE');
                      if (exp) setCategoryId(exp.id);
                    }
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? activeBg : 'transparent',
                    color: isActive ? activeColor : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.84rem',
                    border: isActive ? '1px solid var(--border-strong)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Amount Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Amount (₹)
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: type === 'EXPENSE' ? 'var(--status-expense)' : type === 'INCOME' ? 'var(--accent-emerald)' : 'var(--accent-blue)',
                }}
              >
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  height: '56px',
                  backgroundColor: 'rgba(18, 23, 34, 0.95)',
                }}
                className="tabular-nums"
                autoFocus
              />
            </div>
          </div>

          {/* Note / Merchant Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Note / Merchant Name
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy, Amazon, Salary, Rent..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%' }}
            />

            {/* Smart Category Suggestion Badge */}
            {suggestedCategoryObj && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-emerald-subtle)',
                  border: '1px solid var(--accent-emerald-border)',
                  fontSize: '0.8rem',
                  color: 'var(--accent-emerald)',
                }}
              >
                <Sparkles size={14} />
                <span>Suggested category: <strong>{suggestedCategoryObj.name}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId(suggestedCategoryObj.id);
                    setSuggestedCatId(null);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    backgroundColor: 'var(--accent-emerald)',
                    color: '#042f2e',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    marginLeft: '4px',
                  }}
                >
                  <Check size={12} /> Apply
                </button>
              </div>
            )}
          </div>

          {/* Account Pickers */}
          {type === 'TRANSFER' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  From Account
                </label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ width: '100%' }}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  To Account
                </label>
                <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} style={{ width: '100%' }}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Account
                </label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ width: '100%' }}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Category
                </label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%' }}>
                  {categories
                    .filter((c) => (type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Date, Time & Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Date
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Time
              </label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Payment Method
              </label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }}>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Save Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsAddTransactionOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', minHeight: '44px' }}>
              {type === 'TRANSFER' ? (
                <>
                  <ArrowLeftRight size={16} /> Save Transfer
                </>
              ) : (
                `Save ${type.charAt(0) + type.slice(1).toLowerCase()}`
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
