import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DonutChart, IncomeExpenseBarChart, AccountDistributionBarChart, SavingsTrendChart } from '../components/ui/Charts';
import type { CategoryData } from '../components/ui/Charts';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Filter, PieChart as PieChartIcon, TrendingUp, TrendingDown, Wallet, BarChart3, PiggyBank, Layers } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { transactions, accounts, categories, settings, setIsAddTransactionOpen } = useApp();

  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | 'YEAR' | 'ALL'>('MONTH');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  // Filter transactions by Account and Time Period
  const activeTransactions = transactions.filter((tx) => {
    if (tx.type === 'TRANSFER') return false;
    if (selectedAccountId !== 'ALL' && tx.accountId !== selectedAccountId) {
      return false;
    }

    if (period === 'ALL') return true;

    const txDate = new Date(tx.date);
    const now = new Date();

    if (period === 'WEEK') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return txDate >= weekAgo;
    }
    if (period === 'MONTH') {
      const monthPrefix = now.toISOString().slice(0, 7);
      return tx.date.startsWith(monthPrefix);
    }
    if (period === '3_MONTHS') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return txDate >= threeMonthsAgo;
    }
    if (period === '6_MONTHS') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return txDate >= sixMonthsAgo;
    }
    if (period === 'YEAR') {
      return tx.date.startsWith(now.getFullYear().toString());
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

  // Monthly Comparison Bar Chart Data (Past 6 Months)
  const monthsList = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const prefix = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleString('default', { month: 'short' });

    const monthTxs = transactions.filter(
      (t) => t.type !== 'TRANSFER' && t.date.startsWith(prefix) && (selectedAccountId === 'ALL' || t.accountId === selectedAccountId)
    );
    const monthInc = monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const monthExp = monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const monthSavings = monthInc - monthExp;

    return { label: monthLabel, income: monthInc, expense: monthExp, savings: monthSavings };
  });

  // Active accounts for distribution
  const accountDistributionData = accounts
    .filter((a) => !a.isArchived)
    .map((a) => ({ name: a.name, balance: a.balance, type: a.type }));

  if (activeTransactions.length === 0 && transactions.length === 0) {
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
      <div className="card-level-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%', padding: '4px', backgroundColor: 'rgba(10, 14, 22, 0.8)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'WEEK', label: 'Week' },
            { id: 'MONTH', label: 'Month' },
            { id: '3_MONTHS', label: '3 Months' },
            { id: '6_MONTHS', label: '6 Months' },
            { id: 'YEAR', label: 'Year' },
            { id: 'ALL', label: 'All' },
          ].map((tab) => {
            const isActive = period === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.82rem',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.35)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Account Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="var(--accent-cyan)" />
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

      {/* Cash Flow Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Income"
          amount={totalIncome}
          accentColor="var(--accent-cyan)"
          hideBalances={settings.hideBalances}
          icon={<TrendingDown size={18} color="var(--accent-cyan)" />}
        />
        <StatCard
          label="Total Expenses"
          amount={totalExpenses}
          accentColor="var(--status-expense)"
          hideBalances={settings.hideBalances}
          icon={<TrendingUp size={18} color="var(--status-expense)" />}
        />
        <StatCard
          label="Net Cash Flow"
          amount={totalSavings}
          accentColor="var(--text-primary)"
          hideBalances={settings.hideBalances}
          icon={<Wallet size={18} color="var(--accent-violet)" />}
        />
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            SAVINGS RATE
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1.2 }} className="tabular-nums">
            {savingsRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of total period income</span>
        </div>
      </div>

      {/* Charts Grid Row 1: Income vs Expense & Category Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Income vs Expense Bar Chart */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Income vs Expenses (Past 6 Months)</h3>
          </div>
          <IncomeExpenseBarChart items={monthsList} hideBalances={settings.hideBalances} />
        </div>

        {/* Category Breakdown Donut */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChartIcon size={18} color="var(--accent-violet)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Expense Category Distribution</h3>
          </div>
          <DonutChart data={donutData} totalAmount={totalExpenses} hideBalances={settings.hideBalances} />
        </div>
      </div>

      {/* Charts Grid Row 2: Account Distribution & Monthly Savings Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Account Balance Distribution */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Account Balance Distribution</h3>
          </div>
          <AccountDistributionBarChart accounts={accountDistributionData} hideBalances={settings.hideBalances} />
        </div>

        {/* Monthly Net Savings Trend */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PiggyBank size={18} color="var(--accent-lavender)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Monthly Net Savings Trend</h3>
          </div>
          <SavingsTrendChart items={monthsList.map((m) => ({ label: m.label, savings: m.savings }))} hideBalances={settings.hideBalances} />
        </div>
      </div>

      {/* Top Spending Categories List */}
      {donutData.length > 0 && (
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Ranked Spending Categories</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {donutData.slice(0, 6).map((cat, idx) => (
              <div
                key={cat.categoryId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', width: '18px' }}>#{idx + 1}</span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: cat.color }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }} className="tabular-nums">
                    {settings.hideBalances ? '₹•••••' : `₹${cat.amount.toLocaleString()}`}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
