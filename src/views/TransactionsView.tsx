import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Transaction, TransactionType } from '../types/finance';
import { TransactionRow } from '../components/ui/TransactionRow';
import { EditTransactionModal } from '../components/forms/EditTransactionModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Search, Download, Trash2, Filter, Receipt, Plus } from 'lucide-react';
import { exportTransactionsCSV } from '../utils/exportUtils';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    deleteTransaction,
    monthlyExpenses,
    searchQuery,
    setSearchQuery,
    settings,
    showToast,
    setIsAddTransactionOpen,
  } = useApp();

  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Filtered transactions calculation
  const filteredTransactions = transactions.filter((tx) => {
    // Type Filter
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

    // Account Filter
    if (selectedAccountId !== 'ALL' && tx.accountId !== selectedAccountId && tx.toAccountId !== selectedAccountId) {
      return false;
    }

    // Category Filter
    if (selectedCategoryId !== 'ALL' && tx.categoryId !== selectedCategoryId) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const catName = categories.find((c) => c.id === tx.categoryId)?.name || '';
      const accName = accounts.find((a) => a.id === tx.accountId)?.name || '';
      const toAccName = accounts.find((a) => a.id === tx.toAccountId)?.name || '';
      return (
        tx.note.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        accName.toLowerCase().includes(q) ||
        toAccName.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q) ||
        tx.date.includes(q)
      );
    }

    return true;
  });

  // Group transactions by Date
  const groupedByDate: { [key: string]: typeof transactions } = {};
  filteredTransactions.forEach((tx) => {
    if (!groupedByDate[tx.date]) {
      groupedByDate[tx.date] = [];
    }
    groupedByDate[tx.date].push(tx);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Export CSV Action
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions match the selected filters', 'warning');
      return;
    }
    const result = exportTransactionsCSV(filteredTransactions, accounts, categories);
    if (result.success) {
      showToast(`Exported ${result.count} transactions to CSV`, 'info');
    } else {
      showToast(result.message || 'Export failed', 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary Banner */}
      <div className="card-level-3 hero-emerald-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '22px 26px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            MONTHLY SPENDING SUMMARY
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }} className="tabular-nums">
            {settings.hideBalances ? '₹••••• spent this month' : `₹${monthlyExpenses.toLocaleString()} spent this month`}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Showing {filteredTransactions.length} of {transactions.length} total entries
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setIsAddTransactionOpen(true)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Add transaction</span>
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '10px 16px' }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '18px 20px' }}>
        {/* Top Type Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(10, 14, 22, 0.8)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => {
              const isActive = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
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
                  {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search merchant, note, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '32px', fontSize: '0.84rem', padding: '7px 10px 7px 32px' }}
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <Filter size={14} />
            <span>Filter by:</span>
          </div>

          <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            <option value="ALL">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {(typeFilter !== 'ALL' || selectedAccountId !== 'ALL' || selectedCategoryId !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setSelectedAccountId('ALL');
                setSelectedCategoryId('ALL');
                setSearchQuery('');
              }}
              style={{ fontSize: '0.8rem', color: 'var(--status-expense)', padding: '4px 8px', fontWeight: 600 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grouped Transactions List */}
      {sortedDates.length === 0 ? (
        <EmptyState
          icon={<Receipt size={24} />}
          title="No Transactions Found"
          description="No financial entries match your filter or search criteria. Try resetting filters or log a new transaction."
          actionText="Add Transaction"
          onAction={() => setIsAddTransactionOpen(true)}
        />
      ) : (
        sortedDates.map((dateStr) => {
          const dateTxs = groupedByDate[dateStr];
          const formattedDate = new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {formattedDate}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dateTxs.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const toAcc = accounts.find((a) => a.id === tx.toAccountId);
                  const cat = categories.find((c) => c.id === tx.categoryId);

                  return (
                    <div key={tx.id} style={{ position: 'relative' }}>
                      <TransactionRow
                        transaction={tx}
                        account={acc}
                        toAccount={toAcc}
                        category={cat}
                        hideBalances={settings.hideBalances}
                        onEdit={(t) => setEditingTx(t)}
                      />
                      <button
                        onClick={() => {
                          if (confirm(`Delete transaction "${tx.note}"?`)) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="btn-icon"
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          display: 'none',
                        }}
                        title="Delete transaction"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
      />
    </div>
  );
};
