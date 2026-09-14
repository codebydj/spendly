import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';

export const AddBudgetModal: React.FC = () => {
  const { isAddBudgetOpen, setIsAddBudgetOpen, categories, addBudget } = useApp();

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || '');
  const [limit, setLimit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limit);
    if (!categoryId || isNaN(parsedLimit) || parsedLimit <= 0) return;

    addBudget({
      categoryId,
      monthlyLimit: parsedLimit,
    });

    setLimit('');
    setIsAddBudgetOpen(false);
  };

  return (
    <Modal
      isOpen={isAddBudgetOpen}
      onClose={() => setIsAddBudgetOpen(false)}
      title="Set Category Monthly Budget"
      subtitle="Define monthly spending thresholds to receive warning alerts."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Expense Category
          </label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%' }}>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Monthly Budget Limit (₹)
          </label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 5000"
            required
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            style={{ width: '100%' }}
            className="tabular-nums"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button type="button" onClick={() => setIsAddBudgetOpen(false)} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Budget Limit
          </button>
        </div>
      </form>
    </Modal>
  );
};
