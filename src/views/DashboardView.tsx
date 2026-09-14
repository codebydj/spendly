import React from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/ui/GlassCard';
import { AccountCard } from '../components/ui/AccountCard';
import { TransactionRow } from '../components/ui/TransactionRow';
import { InsightCard } from '../components/ui/InsightCard';
import type { InsightItem } from '../components/ui/InsightCard';
import { DonutChart } from '../components/ui/Charts';
import type { CategoryData } from '../components/ui/Charts';
import { DashboardSkeleton } from '../components/ui/SkeletonLoader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Wallet,
  Sparkles,
  PiggyBank,
  Receipt,
  Eye,
  EyeOff,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    accounts,
    transactions,
    categories,
    recurringPayments,
    setCurrentView,
    setSelectedAccountIdForDetail,
    setIsAddTransactionOpen,
    setIsAddAccountOpen,
    setIsAddBudgetOpen,
    loadDemoData,
    settings,
    toggleHideBalances,
    authLoading,
  } = useApp();

  const activeAccounts = accounts.filter((a) => !a.isArchived);

  // Time-based Greeting
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) greeting = 'Good afternoon';
  if (currentHour >= 17) greeting = 'Good evening';

  // Category spending calculations for Donut Chart
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const expenseTransactions = transactions.filter(
    (t) => t.type === 'EXPENSE' && t.date.startsWith(currentMonthPrefix)
  );

  const categoryTotals: { [key: string]: number } = {};
  let totalExpenseMonth = 0;

  expenseTransactions.forEach((tx) => {
    categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
    totalExpenseMonth += tx.amount;
  });

  const donutData: CategoryData[] = Object.keys(categoryTotals).map((catId) => {
    const cat = categories.find((c) => c.id === catId);
    const amount = categoryTotals[catId];
    const percentage = totalExpenseMonth > 0 ? Math.round((amount / totalExpenseMonth) * 100) : 0;
    return {
      categoryId: catId,
      name: cat?.name || 'Other',
      amount,
      color: cat?.color || '#6B7280',
      percentage,
    };
  });
  donutData.sort((a, b) => b.amount - a.amount);

  const recentTransactions = transactions.slice(0, 5);

  // Deterministic Smart Insights Generation
  const insights: InsightItem[] = [];

  if (transactions.length >= 3) {
    if (monthlyIncome > 0) {
      const savingsRate = Math.round((monthlySavings / monthlyIncome) * 100);
      if (savingsRate > 0) {
        insights.push({
          id: 'ins-savings',
          type: 'POSITIVE',
          title: `Savings Rate: ${savingsRate}%`,
          message: `You saved ₹${monthlySavings.toLocaleString()} (${savingsRate}%) of income this month.`,
        });
      }
    }

    if (donutData.length > 0) {
      const topCat = donutData[0];
      insights.push({
        id: 'ins-top-cat',
        type: 'NEUTRAL',
        title: `Top Category: ${topCat.name}`,
        message: `${topCat.name} is ${topCat.percentage}% (₹${topCat.amount.toLocaleString()}) of spending.`,
      });
    }

    const upcomingRecurring = recurringPayments.find((r) => !r.isPaused);
    if (upcomingRecurring) {
      insights.push({
        id: 'ins-recurring',
        type: 'NEUTRAL',
        title: `Upcoming: ${upcomingRecurring.title}`,
        message: `₹${upcomingRecurring.amount.toLocaleString()} due on ${upcomingRecurring.nextDueDate}.`,
      });
    }
  }

  // Show Skeleton UI during Auth / Cloud Data Hydration
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  // 1. New User 0-Account Onboarding Dashboard
  if (activeAccounts.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px', margin: '20px auto' }}>
        <GlassCard elevated className="card-level-3 hero-emerald-glow" style={{ textAlign: 'center', padding: '36px 24px', position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-emerald-subtle)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid var(--accent-emerald-border)',
            }}
          >
            <Wallet size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Welcome to Spendly</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
            Get started by adding your bank account, cash, or credit card to track your finances.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '24px',
              textAlign: 'left',
            }}
          >
            <div
              onClick={() => setIsAddAccountOpen(true)}
              className="card-level-2"
              style={{
                padding: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-emerald">Step 1</span>
                <Wallet size={16} color="var(--accent-emerald)" />
              </div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Add an Account</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Bank, Cash, or Credit</p>
            </div>

            <div
              onClick={() => setIsAddTransactionOpen(true)}
              className="card-level-2"
              style={{
                padding: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-neutral">Step 2</span>
                <Receipt size={16} color="var(--accent-blue)" />
              </div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Log Transaction</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Income or Expense</p>
            </div>

            <div
              onClick={() => setIsAddBudgetOpen(true)}
              className="card-level-2"
              style={{
                padding: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-neutral">Step 3</span>
                <PiggyBank size={16} color="var(--status-warning)" />
              </div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Set Budget</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Monthly limits</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => setIsAddAccountOpen(true)} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <Plus size={18} /> Add Your First Account
            </button>
            <button onClick={loadDemoData} className="btn btn-secondary" style={{ padding: '10px 18px' }}>
              <Sparkles size={18} color="var(--accent-emerald)" /> Load Sample Data
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 2. Mobile & Desktop Authenticated Dashboard
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* NET WORTH HERO CARD */}
      <div className="card-level-3 hero-emerald-glow" style={{ position: 'relative', overflow: 'hidden', padding: '22px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {greeting}, financial summary
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                NET WORTH
              </span>
              <button
                onClick={toggleHideBalances}
                className="btn-icon"
                title={settings.hideBalances ? 'Show Balances' : 'Hide Balances'}
                style={{ padding: '2px 4px', minHeight: '24px', minWidth: '24px' }}
              >
                {settings.hideBalances ? <EyeOff size={14} color="var(--accent-emerald)" /> : <Eye size={14} />}
              </button>
            </div>

            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '4px',
                lineHeight: 1.1,
              }}
              className="tabular-nums"
            >
              {settings.hideBalances ? '₹•••••' : `₹${totalBalance.toLocaleString()}`}
            </div>
          </div>

          <button
            onClick={() => setIsAddTransactionOpen(true)}
            className="btn btn-primary"
            style={{ padding: '8px 16px', minHeight: '40px', fontSize: '0.86rem', borderRadius: 'var(--radius-md)' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add transaction</span>
          </button>
        </div>

        {/* Compact Summary Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <ArrowDownLeft size={14} color="var(--accent-emerald)" />
              <span>Income</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'block' }} className="tabular-nums">
              {settings.hideBalances ? '₹••••' : `₹${monthlyIncome.toLocaleString()}`}
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <ArrowUpRight size={14} color="var(--status-expense)" />
              <span>Expenses</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'block' }} className="tabular-nums">
              {settings.hideBalances ? '₹••••' : `₹${monthlyExpenses.toLocaleString()}`}
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
              <span>Savings</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px', display: 'block' }} className="tabular-nums">
              {settings.hideBalances ? '₹••••' : `₹${monthlySavings.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* ACCOUNTS 2-COLUMN COMPACT GRID */}
      <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Accounts</h3>
          <button
            onClick={() => setCurrentView('accounts')}
            style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            <span>View all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          {activeAccounts.slice(0, 4).map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              hideBalances={settings.hideBalances}
              onClick={() => {
                setSelectedAccountIdForDetail(acc.id);
                setCurrentView('accounts');
              }}
            />
          ))}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN & INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Category Spending Donut Chart */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Monthly Spending</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>This Month</span>
          </div>

          <DonutChart data={donutData} totalAmount={monthlyExpenses} hideBalances={settings.hideBalances} />
        </div>

        {/* Smart Financial Insights */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Insights</h3>
          </div>
          <InsightCard insights={insights} />
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</h3>
          <button
            onClick={() => setCurrentView('transactions')}
            style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            <span>View all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            No recent activity recorded. Click "+ Add transaction" to log an entry.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentTransactions.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const toAcc = accounts.find((a) => a.id === tx.toAccountId);
              const cat = categories.find((c) => c.id === tx.categoryId);

              return (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  account={acc}
                  toAccount={toAcc}
                  category={cat}
                  hideBalances={settings.hideBalances}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
