import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Account } from '../types/finance';
import { GlassCard } from '../components/ui/GlassCard';
import { AccountCard } from '../components/ui/AccountCard';
import { TransactionRow } from '../components/ui/TransactionRow';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Wallet, Building2, CreditCard, Banknote, Archive, Search, X } from 'lucide-react';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    totalBalance,
    setIsAddAccountOpen,
    selectedAccountIdForDetail,
    setSelectedAccountIdForDetail,
    archiveAccount,
    transactions,
    categories,
    settings,
  } = useApp();

  const [accountSearch, setAccountSearch] = useState('');

  const activeAccounts = accounts.filter((a) => !a.isArchived);

  // Group accounts by type
  const bankAccounts = activeAccounts.filter((a) => a.type === 'BANK');
  const cashAccounts = activeAccounts.filter((a) => a.type === 'CASH');
  const walletAccounts = activeAccounts.filter((a) => a.type === 'WALLET');
  const creditCardAccounts = activeAccounts.filter((a) => a.type === 'CREDIT_CARD');
  const otherAccounts = activeAccounts.filter((a) => a.type === 'OTHER');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountIdForDetail);

  // Selected Account Specific Stats
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const accountTransactions = selectedAccount
    ? transactions.filter(
        (t) => (t.accountId === selectedAccount.id || t.toAccountId === selectedAccount.id) && t.date.startsWith(currentMonthPrefix)
      )
    : [];

  let accIncomeThisMonth = 0;
  let accExpensesThisMonth = 0;

  accountTransactions.forEach((tx) => {
    if (tx.type === 'INCOME' && tx.accountId === selectedAccount?.id) {
      accIncomeThisMonth += tx.amount;
    } else if (tx.type === 'EXPENSE' && tx.accountId === selectedAccount?.id) {
      accExpensesThisMonth += tx.amount;
    } else if (tx.type === 'TRANSFER') {
      if (tx.toAccountId === selectedAccount?.id) accIncomeThisMonth += tx.amount;
      if (tx.accountId === selectedAccount?.id) accExpensesThisMonth += tx.amount;
    }
  });

  const accNetChange = accIncomeThisMonth - accExpensesThisMonth;

  // Filter selected account's transaction list
  const filteredAccountTxs = selectedAccount
    ? transactions
        .filter(
          (t) => t.accountId === selectedAccount.id || t.toAccountId === selectedAccount.id
        )
        .filter((t) => {
          if (!accountSearch.trim()) return true;
          const query = accountSearch.toLowerCase();
          const catName = categories.find((c) => c.id === t.categoryId)?.name || '';
          return (
            (t.merchant && t.merchant.toLowerCase().includes(query)) ||
            t.note.toLowerCase().includes(query) ||
            catName.toLowerCase().includes(query) ||
            t.amount.toString().includes(query)
          );
        })
    : [];

  const renderAccountGroup = (title: string, groupAccounts: Account[], icon: React.ReactNode) => {
    if (groupAccounts.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          {icon}
          <span>{title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {groupAccounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              hideBalances={settings.hideBalances}
              onClick={() => setSelectedAccountIdForDetail(acc.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <GlassCard elevated style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            TOTAL NET WORTH
          </span>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }} className="tabular-nums">
            {settings.hideBalances ? '₹•••••' : `₹${totalBalance.toLocaleString()}`}
          </div>
        </div>

        <button onClick={() => setIsAddAccountOpen(true)} className="btn btn-primary" style={{ padding: '11px 20px' }}>
          <Plus size={18} /> Add Account
        </button>
      </GlassCard>

      {/* Account Groups / Empty State */}
      {activeAccounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={24} />}
          title="No Accounts Created Yet"
          description="Add your savings bank account, credit card, cash wallet, or UPI account to start tracking your net worth."
          actionText="Add Account"
          onAction={() => setIsAddAccountOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {renderAccountGroup('BANK ACCOUNTS', bankAccounts, <Building2 size={16} />)}
          {renderAccountGroup('CASH', cashAccounts, <Banknote size={16} />)}
          {renderAccountGroup('WALLETS', walletAccounts, <Wallet size={16} />)}
          {renderAccountGroup('CREDIT CARDS', creditCardAccounts, <CreditCard size={16} />)}
          {renderAccountGroup('OTHER ACCOUNTS', otherAccounts, <Wallet size={16} />)}
        </div>
      )}

      {/* Selected Account Details Panel */}
      {selectedAccount && (
        <GlassCard
          elevated
          style={{
            marginTop: '12px',
            borderColor: 'var(--accent-emerald-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{selectedAccount.name}</h3>
                <span className="badge badge-neutral">{selectedAccount.type.replace('_', ' ')}</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {selectedAccount.institution || 'Personal Account'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (confirm(`Archive account "${selectedAccount.name}"?`)) {
                    archiveAccount(selectedAccount.id);
                    setSelectedAccountIdForDetail(null);
                  }
                }}
                className="btn btn-danger"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Archive size={14} /> Archive Account
              </button>
              <button onClick={() => setSelectedAccountIdForDetail(null)} className="btn-icon">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Account Month Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              padding: '18px',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Balance</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${selectedAccount.balance.toLocaleString()}`}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Income this Month</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${accIncomeThisMonth.toLocaleString()}`}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expenses this Month</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--status-danger)', display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${accExpensesThisMonth.toLocaleString()}`}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Change</span>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: accNetChange >= 0 ? 'var(--accent-emerald)' : 'var(--status-danger)',
                  display: 'block',
                  marginTop: '2px',
                }}
                className="tabular-nums"
              >
                {settings.hideBalances
                  ? '₹•••••'
                  : `${accNetChange >= 0 ? '+' : ''}₹${accNetChange.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Account Specific Transactions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Account Activity</h4>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter account activity..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '32px', padding: '6px 10px 6px 32px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredAccountTxs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No activity recorded for this account.
                </div>
              ) : (
                filteredAccountTxs.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const toAcc = accounts.find((a) => a.id === tx.toAccountId);

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
                })
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
