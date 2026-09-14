import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BudgetProgress } from '../components/ui/BudgetProgress';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, PiggyBank, X } from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    setIsAddBudgetOpen,
    deleteBudget,
    settings,
  } = useApp();

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  // Compute category spending for current month
  const categorySpentMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === 'EXPENSE' && t.date.startsWith(currentMonthPrefix))
    .forEach((t) => {
      categorySpentMap[t.categoryId] = (categorySpentMap[t.categoryId] || 0) + t.amount;
    });

  const totalMonthlyBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalMonthlySpentInBudgets = budgets.reduce(
    (sum, b) => sum + (categorySpentMap[b.categoryId] || 0),
    0
  );
  const remainingMonthlyBudget = totalMonthlyBudgetLimit - totalMonthlySpentInBudgets;

  const filteredBudgets = selectedCatId
    ? budgets.filter((b) => b.categoryId === selectedCatId)
    : budgets;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Overview Banner */}
      <div className="card-level-3 hero-emerald-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '22px 26px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            MONTHLY BUDGET OVERVIEW
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }} className="tabular-nums">
            {settings.hideBalances ? '₹•••••' : `₹${totalMonthlySpentInBudgets.toLocaleString()} / ₹${totalMonthlyBudgetLimit.toLocaleString()}`}
          </div>
          <span style={{ fontSize: '0.84rem', color: remainingMonthlyBudget >= 0 ? 'var(--accent-emerald)' : 'var(--status-expense)', marginTop: '4px', display: 'block', fontWeight: 600 }}>
            {settings.hideBalances
              ? 'Remaining: ₹•••••'
              : remainingMonthlyBudget >= 0
              ? `₹${remainingMonthlyBudget.toLocaleString()} remaining for current month`
              : `Over total budget limit by ₹${Math.abs(remainingMonthlyBudget).toLocaleString()}`}
          </span>
        </div>

        <button onClick={() => setIsAddBudgetOpen(true)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Create Budget Limit</span>
        </button>
      </div>

      {/* Category Budget Tabs & Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Category Limits</h3>

          {/* Unified Compact Budget Tabs */}
          {budgets.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '4px' }}>
              <button
                onClick={() => setSelectedCatId(null)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedCatId === null ? 'var(--accent-emerald-subtle)' : 'var(--bg-surface)',
                  border: selectedCatId === null ? '1px solid var(--accent-emerald-border)' : '1px solid var(--border-color)',
                  color: selectedCatId === null ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                All ({budgets.length})
              </button>

              {budgets.map((b) => {
                const cat = categories.find((c) => c.id === b.categoryId);
                const isSelected = selectedCatId === b.categoryId;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedCatId(isSelected ? null : b.categoryId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--accent-emerald-subtle)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--accent-emerald-border)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: cat?.color || 'var(--accent-emerald)' }} />
                    <span>{cat?.name || 'Category'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBudget(b.id);
                        if (selectedCatId === b.categoryId) setSelectedCatId(null);
                      }}
                      aria-label={`Remove ${cat?.name || 'Category'} budget limit`}
                      title={`Remove ${cat?.name || 'Category'} budget`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '3px',
                        marginLeft: '2px',
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-expense)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {budgets.length === 0 ? (
          <EmptyState
            icon={<PiggyBank size={24} />}
            title="No Budget Limits Created"
            description="Set monthly spending limits for categories like Food, Shopping, or Bills to receive warning alerts when you approach your budget limit."
            actionText="Create Budget Limit"
            onAction={() => setIsAddBudgetOpen(true)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredBudgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              const spent = categorySpentMap[b.categoryId] || 0;

              return (
                <div key={b.id} className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
                  <BudgetProgress
                    categoryName={cat?.name || 'Category'}
                    categoryColor={cat?.color || 'var(--accent-violet)'}
                    spent={spent}
                    limit={b.monthlyLimit}
                    hideBalances={settings.hideBalances}
                    onDelete={() => deleteBudget(b.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
