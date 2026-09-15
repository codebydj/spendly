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
  calculateNetWorthBreakdown,
  calculateCashFlowSummary,
  generateDeterministicInsights,
  generateFinancialHealthSummary,
  calculateMonthlyClosingSummary,
} from '../utils/calculations';
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
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    accounts,
    transactions,
    categories,
    recurringPayments,
    budgets,
    setCurrentView,
    setSelectedAccountIdForDetail,
    setIsAddTransactionOpen,
    setIsAddAccountOpen,
    setIsAddBudgetOpen,
    loadDemoData,
    settings,
    toggleHideBalances,
    authLoading,
    addTransaction,
    showToast,
  } = useApp();

  const activeAccounts = accounts.filter((a) => !a.isArchived);

  // Time-based Greeting
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) greeting = 'Good afternoon';
  if (currentHour >= 17) greeting = 'Good evening';

  // 1. Net Worth Breakdown
  const netWorthData = calculateNetWorthBreakdown(accounts, transactions);

  // 2. Cash Flow Summary (Today, Week, Month)
  const cashFlow = calculateCashFlowSummary(transactions);

  // 3. Monthly Closing Summary (Previous Month)
  const monthlyClosing = calculateMonthlyClosingSummary(transactions, categories, budgets);

  // 4. Financial Health Statements
  const healthStatements = generateFinancialHealthSummary(transactions, budgets, accounts);

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

  const richPalette = ['#8B5CF6', '#22D3EE', '#60A5FA', '#F472B6', '#C4B5FD', '#F59E0B'];

  const donutData: CategoryData[] = Object.keys(categoryTotals).map((catId, index) => {
    const cat = categories.find((c) => c.id === catId);
    const amount = categoryTotals[catId];
    const percentage = totalExpenseMonth > 0 ? Math.round((amount / totalExpenseMonth) * 100) : 0;
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

  const recentTransactions = transactions.slice(0, 5);

  // Deterministic Smart Insights Generation
  const deterministicInsightStrings = generateDeterministicInsights(transactions, categories, budgets);
  const insights: InsightItem[] = deterministicInsightStrings.map((msg, idx) => ({
    id: `insight-det-${idx}`,
    type: msg.includes('exceeded') || msg.includes('higher') ? 'WARNING' : msg.includes('lower') ? 'POSITIVE' : 'NEUTRAL',
    title: msg.split(' ')[0] + ' ' + msg.split(' ')[1],
    message: msg,
  }));

  // Upcoming Recurring Payments
  const upcomingPayments = recurringPayments
    .filter((r) => !r.isPaused)
    .slice(0, 3);

  // Action: Mark Recurring as Paid
  const handleMarkPaid = (rec: any) => {
    if (activeAccounts.length === 0) {
      showToast('Please create an account first.', 'warning');
      return;
    }
    const accId = activeAccounts[0].id;
    addTransaction({
      type: 'EXPENSE',
      amount: rec.amount,
      accountId: accId,
      categoryId: rec.categoryId || categories[0]?.id || 'cat-bills',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      merchant: rec.title,
      description: `Recurring payment: ${rec.title}`,
      note: 'Auto-marked as paid from dashboard',
      paymentMethod: 'UPI / Online',
    });
    showToast(`Marked ${rec.title} (₹${rec.amount.toLocaleString()}) as paid!`, 'success');
  };

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
              style={{ padding: '14px', cursor: 'pointer' }}
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
              style={{ padding: '14px', cursor: 'pointer' }}
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
              style={{ padding: '14px', cursor: 'pointer' }}
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
      {/* PREVIOUS MONTH CLOSING SUMMARY BANNER */}
      {monthlyClosing.hasData && (
        <div
          className="card-level-2"
          style={{
            backgroundColor: 'rgba(34, 211, 238, 0.06)',
            border: '1px solid var(--accent-cyan-border)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-cyan-subtle)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                LAST MONTH SUMMARY ({monthlyClosing.monthName})
              </span>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                Income: ₹{monthlyClosing.income.toLocaleString()} • Expenses: ₹{monthlyClosing.expenses.toLocaleString()} • Net: <strong style={{ color: monthlyClosing.net >= 0 ? 'var(--accent-cyan)' : 'var(--status-expense)' }}>₹{monthlyClosing.net.toLocaleString()}</strong>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Top Category: <strong>{monthlyClosing.topCategoryName}</strong> (₹{monthlyClosing.topCategoryAmount.toLocaleString()})
          </div>
        </div>
      )}

      {/* NET WORTH HERO CENTERPIECE CARD */}
      <div className="card-level-4 ambient-violet-glow ambient-cyan-glow" style={{ position: 'relative', overflow: 'hidden', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.02em' }}>
              {greeting}, financial summary
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-lavender)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                NET WORTH
              </span>
              <button
                onClick={toggleHideBalances}
                className="btn-icon"
                title={settings.hideBalances ? 'Show Balances' : 'Hide Balances'}
                style={{ padding: '2px 4px', minHeight: '24px', minWidth: '24px' }}
              >
                {settings.hideBalances ? <EyeOff size={14} color="var(--accent-cyan)" /> : <Eye size={14} color="var(--text-secondary)" />}
              </button>
            </div>

            <div
              style={{
                fontSize: '2.6rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '6px',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
              }}
              className="tabular-nums"
            >
              {settings.hideBalances ? '₹•••••' : `₹${netWorthData.totalNetWorth.toLocaleString()}`}
            </div>
          </div>

          {/* Asset vs Credit Debt Snapshot pill */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)', border: '1px solid var(--accent-cyan-border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Assets</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {settings.hideBalances ? '₹••••' : `₹${netWorthData.totalAssets.toLocaleString()}`}
              </div>
            </div>
            {netWorthData.totalCreditCardDebt > 0 && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--status-expense)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Credit Debt</span>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--status-expense)' }}>
                  {settings.hideBalances ? '₹••••' : `-₹${netWorthData.totalCreditCardDebt.toLocaleString()}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Supporting Monthly Financial Summary Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
              <ArrowDownLeft size={14} color="var(--accent-cyan)" />
              <span>Income</span>
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '3px', display: 'block' }} className="tabular-nums">
              {settings.hideBalances ? '₹••••' : `₹${monthlyIncome.toLocaleString()}`}
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
              <ArrowUpRight size={14} color="var(--status-expense)" />
              <span>Expenses</span>
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '3px', display: 'block' }} className="tabular-nums">
              {settings.hideBalances ? '₹••••' : `₹${monthlyExpenses.toLocaleString()}`}
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-violet)' }} />
              <span>Savings</span>
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '3px', display: 'block' }} className="tabular-nums">
              {settings.hideBalances ? '₹••••' : `₹${monthlySavings.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* CASH FLOW SUMMARY (Today, Week, Month) */}
      <div className="card-level-2" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cash Flow Summary</h3>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Real Transaction Data</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Today */}
          <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Today</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
              <span>Inc: ₹{cashFlow.today.income.toLocaleString()}</span>
              <span>Exp: ₹{cashFlow.today.expense.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: cashFlow.today.net >= 0 ? 'var(--accent-cyan)' : 'var(--status-expense)' }}>
              Net: ₹{cashFlow.today.net.toLocaleString()}
            </div>
          </div>

          {/* This Week */}
          <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>This Week</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
              <span>Inc: ₹{cashFlow.week.income.toLocaleString()}</span>
              <span>Exp: ₹{cashFlow.week.expense.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: cashFlow.week.net >= 0 ? 'var(--accent-cyan)' : 'var(--status-expense)' }}>
              Net: ₹{cashFlow.week.net.toLocaleString()}
            </div>
          </div>

          {/* This Month */}
          <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>This Month</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
              <span>Inc: ₹{cashFlow.month.income.toLocaleString()}</span>
              <span>Exp: ₹{cashFlow.month.expense.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: cashFlow.month.net >= 0 ? 'var(--accent-cyan)' : 'var(--status-expense)' }}>
              Net: ₹{cashFlow.month.net.toLocaleString()}
            </div>
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

      {/* UPCOMING PAYMENTS CARD */}
      {upcomingPayments.length > 0 && (
        <div className="card-level-2" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Upcoming Payments</h3>
            </div>
            <button onClick={() => setCurrentView('recurring')} style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Manage
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingPayments.map((rec) => (
              <div
                key={rec.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{rec.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Due: {rec.nextDueDate} • ₹{rec.amount.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkPaid(rec)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <CheckCircle2 size={14} color="var(--accent-cyan)" /> Mark as Paid
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

        {/* Smart Financial Insights & Health Summary */}
        <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Financial Insights</h3>
          </div>
          
          {healthStatements.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' }}>
              {healthStatements.map((stmt, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--accent-cyan)" /> {stmt}
                </div>
              ))}
            </div>
          )}

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
