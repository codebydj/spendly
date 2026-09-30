import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { Budget, BudgetPeriod } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { Sparkles, Trash2, Bell } from 'lucide-react';

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  isOpen,
  onClose,
  budget,
}) => {
  const { categories, transactions, addBudget, deleteBudget, showToast } = useApp();

  const [limitStr, setLimitStr] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('MONTHLY');
  const [rolloverEnabled, setRolloverEnabled] = useState(false);
  const [notifyOn75, setNotifyOn75] = useState(true);
  const [notifyOn90, setNotifyOn90] = useState(true);
  const [notifyOn100, setNotifyOn100] = useState(true);
  const [recommendedLimit, setRecommendedLimit] = useState<number | null>(null);

  const category = categories.find((c) => c.id === budget?.categoryId);

  useEffect(() => {
    if (budget && isOpen) {
      setLimitStr(String(budget.monthlyLimit));
      setPeriod(budget.period || 'MONTHLY');
      setRolloverEnabled(Boolean(budget.rolloverEnabled));
      setNotifyOn75(budget.notifyOn75 !== false);
      setNotifyOn90(budget.notifyOn90 !== false);
      setNotifyOn100(budget.notifyOn100 !== false);

      // Calculate recommended limit from last 3 months average spending
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const threeMonthsAgoStr = threeMonthsAgo.toISOString().slice(0, 10);

      const catExpenses = transactions.filter(
        (t) => t.categoryId === budget.categoryId && t.type === 'EXPENSE' && t.date >= threeMonthsAgoStr
      );

      const totalSpent = catExpenses.reduce((sum, t) => sum + t.amount, 0);
      const avgMonthly = Math.round(totalSpent / 3);
      if (avgMonthly > 0) {
        setRecommendedLimit(Math.round(avgMonthly * 1.1)); // 10% buffer recommendation
      } else {
        setRecommendedLimit(null);
      }
    }
  }, [budget, isOpen, transactions]);

  if (!budget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitStr);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      showToast('Please enter a valid positive budget limit', 'warning');
      return;
    }

    addBudget({
      categoryId: budget.categoryId,
      monthlyLimit: parsedLimit,
      period,
      rolloverEnabled,
      notifyOn75,
      notifyOn90,
      notifyOn100,
    });

    showToast(`Updated budget limit for "${category?.name || 'Category'}"`, 'success');
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Remove budget limit for "${category?.name || 'Category'}"?`)) {
      deleteBudget(budget.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${category?.name || 'Category'} Budget`}
      subtitle="Adjust spending limits, budget periods, and notification alert preferences."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Budget Limit Amount (₹) *
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            value={limitStr}
            onChange={(e) => setLimitStr(e.target.value)}
            placeholder="e.g. 5000"
            style={{ width: '100%', fontSize: '1.2rem', fontWeight: 700 }}
            className="tabular-nums"
          />

          {recommendedLimit !== null && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
              <Sparkles size={14} />
              <span>Recommended limit based on 3-month spending history: {formatINR(recommendedLimit)}</span>
              <button
                type="button"
                onClick={() => setLimitStr(String(recommendedLimit))}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.78rem' }}
              >
                Apply
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Budget Cycle Period
            </label>
            <select value={period} onChange={(e) => setPeriod(e.target.value as BudgetPeriod)} style={{ width: '100%' }}>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="CUSTOM">Custom Cycle</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" checked={rolloverEnabled} onChange={(e) => setRolloverEnabled(e.target.checked)} />
              <span>Enable Unused Balance Rollover</span>
            </label>
          </div>
        </div>

        {/* Notification Preferences */}
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={14} /> Notification Alert Thresholds
          </span>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={notifyOn75} onChange={(e) => setNotifyOn75(e.target.checked)} />
            <span>Notify when spending reaches 75% limit</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={notifyOn90} onChange={(e) => setNotifyOn90(e.target.checked)} />
            <span>Notify when spending reaches 90% critical threshold</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={notifyOn100} onChange={(e) => setNotifyOn100(e.target.checked)} />
            <span>Notify immediately when budget is exceeded (100%+)</span>
          </label>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <button type="button" onClick={handleDelete} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <Trash2 size={14} /> Delete Budget
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Budget
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
