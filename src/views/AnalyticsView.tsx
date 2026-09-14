import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DonutChart, IncomeExpenseBarChart } from '../components/ui/Charts';
import type { CategoryData } from '../components/ui/Charts';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Filter, PieChart as PieChartIcon, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { transactions, accounts, categories, settings, setIsAddTransactionOpen } = useApp();

  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  // Filter transactions by Account and Period
  const activeTransactions = transactions.filter((tx) => {
    if (tx.type === 'TRANSFER') return false;
    if (selectedAccountId !== 'ALL' && tx.accountId !== selectedAccountId) {
      return false;
    }
    return true;
  });

  const totalIncome = activeTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = activeTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  // Category Donut Breakdown
  const categoryTotals: { [key: string]: number } = {};
  activeTransactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
    });

  const richPalette = ['#8B5CF6', '#22D3EE', '#60A5FA', '#F472B6', '#C4B5FD', '#F59E0B'];

  const donutData: CategoryData[] = Object.keys(categoryTotals).map((catId, index) => {
    const cat = categories.find((c) => c.id === catId);
    const amount = categoryTotals[catId];
    const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
    const fallbackColor = richPalette[index % richPalette.length];
    return {
      categoryId: catId,
      name: cat?.name || 'Other',
      amount,
      color: cat?.color || fallbackColor,
      percentage,
    };
  });
  donutData.sort((a, b) => b.amount - a.amount);

  // Calculate actual Monthly Breakdown for Bar Chart
  const monthsList = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (4 - i));
    const prefix = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleString('default', { month: 'short' });

    const monthTxs = activeTransactions.filter((t) => t.date.startsWith(prefix));
    const monthInc = monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const monthExp = monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    return { label: monthLabel, income: monthInc, expense: monthExp };
  });

  if (activeTransactions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <EmptyState
          icon={<PieChartIcon size={24} />}
          title="No Spending Data Yet"
          description="Log income and expense transactions to view category distribution, savings rate, and monthly spending trends."
          actionText="Add First Transaction"
          onAction={() => setIsAddTransactionOpen(true)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Filter Toolbar */}
      <div className="card-level-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(10, 14, 22, 0.8)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {(['WEEK', 'MONTH', 'YEAR'] as const).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  border: isActive ? '1px solid var(--border-strong)' : 'none',
                }}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* Account Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Account:</span>
          <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            <option value="ALL">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Income"
          amount={totalIncome}
          accentColor="var(--accent-emerald)"
          hideBalances={settings.hideBalances}
          icon={<TrendingDown size={18} color="var(--accent-emerald)" />}
        />
        <StatCard
          label="Total Expenses"
          amount={totalExpenses}
          accentColor="var(--status-expense)"
          hideBalances={settings.hideBalances}
          icon={<TrendingUp size={18} color="var(--status-expense)" />}
        />
        <StatCard
          label="Net Savings"
          amount={totalSavings}
          accentColor="var(--text-primary)"
          hideBalances={settings.hideBalances}
          icon={<Wallet size={18} color="var(--accent-blue)" />}
        />
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            SAVINGS RATE
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', lineHeight: 1.2 }} className="tabular-nums">
            {savingsRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of monthly income</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Income vs Expense Bar Chart */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', transition: 'all 0.45s ease-out' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Income vs Expenses Comparison</h3>
          <IncomeExpenseBarChart items={monthsList} hideBalances={settings.hideBalances} />
        </div>

        {/* Category Breakdown Donut */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', transition: 'all 0.45s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChartIcon size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Expense Category Distribution</h3>
          </div>
          <DonutChart data={donutData} totalAmount={totalExpenses} hideBalances={settings.hideBalances} />
        </div>
      </div>
    </div>
  );
};
