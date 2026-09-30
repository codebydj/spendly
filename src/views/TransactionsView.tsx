import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Transaction, TransactionType, Account, Category } from '../types/finance';
import { TransactionRow } from '../components/ui/TransactionRow';
import { EditTransactionModal } from '../components/forms/EditTransactionModal';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { BottomSheet } from '../components/ui/BottomSheet';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import { Search, Download, Receipt, Copy, X, SlidersHorizontal } from 'lucide-react';
import { exportTransactionsCSV } from '../utils/exportUtils';
import { formatINR } from '../utils/currency';
import { useFeatures } from '../context/FeatureContext';
import { PageTransition } from '../components/motion/PageTransition';

import { formatAccountLabel } from '../utils/accountUtils.ts';

import { TransactionDetailBottomSheet, TransactionDetailContent } from '../components/modals/TransactionDetailModal';

export const TransactionsView: React.FC = () => {
  const { templates, applyTemplate, deleteTemplate, saveTemplate } = useFeatures();
  const {
    transactions,
    accounts,
    categories,
    monthlyExpenses,
    searchQuery,
    setSearchQuery,
    settings,
    showToast,
    setIsAddTransactionOpen,
    deleteTransaction,
    user,
    authLoading,
  } = useApp();

  const filterStorageKey = `spendly_tx_filters_${user?.id || 'guest'}`;

  // Filter States
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [dateRangeOption, setDateRangeOption] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // UI & Master-Detail States
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const selectedTx = useMemo(
    () => transactions.find((t) => t.id === selectedTxId) || null,
    [transactions, selectedTxId]
  );

  const handleRowSelect = (tx: Transaction) => {
    setSelectedTxId(tx.id);
    if (window.innerWidth <= 768) {
      setIsDetailSheetOpen(true);
    }
  };

  // Restore saved filter preferences for the current user
  useEffect(() => {
    try {
      const saved = localStorage.getItem(filterStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.typeFilter) setTypeFilter(parsed.typeFilter);
        if (parsed.selectedAccountId && (parsed.selectedAccountId === 'ALL' || accounts.some((a) => a.id === parsed.selectedAccountId))) {
          setSelectedAccountId(parsed.selectedAccountId);
        }
        if (parsed.selectedCategoryId && (parsed.selectedCategoryId === 'ALL' || categories.some((c) => c.id === parsed.selectedCategoryId))) {
          setSelectedCategoryId(parsed.selectedCategoryId);
        }
        if (parsed.dateRangeOption) setDateRangeOption(parsed.dateRangeOption);
        if (parsed.dateFrom) setDateFrom(parsed.dateFrom);
        if (parsed.dateTo) setDateTo(parsed.dateTo);
        if (parsed.minAmount) setMinAmount(parsed.minAmount);
        if (parsed.maxAmount) setMaxAmount(parsed.maxAmount);
      }
    } catch {
      // Ignore storage read error
    }
  }, [filterStorageKey, accounts, categories]);

  // Persist filter preferences
  useEffect(() => {
    try {
      const toSave = {
        typeFilter,
        selectedAccountId,
        selectedCategoryId,
        dateRangeOption,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
      };
      localStorage.setItem(filterStorageKey, JSON.stringify(toSave));
    } catch {
      // Ignore storage write error
    }
  }, [typeFilter, selectedAccountId, selectedCategoryId, dateRangeOption, dateFrom, dateTo, minAmount, maxAmount, filterStorageKey]);

  // Handle Date Preset Selection
  const handleDatePresetChange = (preset: 'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'THIS_MONTH' | 'CUSTOM') => {
    setDateRangeOption(preset);
    const now = new Date();

    if (preset === 'ALL') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'TODAY') {
      const todayStr = now.toISOString().slice(0, 10);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === '7DAYS') {
      const past = new Date(now.getTime() - 7 * 86400000);
      setDateFrom(past.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (preset === '30DAYS') {
      const past = new Date(now.getTime() - 30 * 86400000);
      setDateFrom(past.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (preset === 'THIS_MONTH') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setDateFrom(`${y}-${m}-01`);
      setDateTo(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    }
  };

  const handleDuplicate = (tx: Transaction) => {
    sessionStorage.setItem('spendly_duplicate_transaction', JSON.stringify(tx));
    setIsAddTransactionOpen(true);
  };

  const handleResetFilters = () => {
    setTypeFilter('ALL');
    setSelectedAccountId('ALL');
    setSelectedCategoryId('ALL');
    setDateRangeOption('ALL');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
    try {
      localStorage.removeItem(filterStorageKey);
    } catch {
      // Ignore
    }
  };

  // Deduplicate and Label Accounts with Duplicate Names (Req 60)
  const uniqueAccountOptions = useMemo(() => {
    return accounts.map((acc) => {
      return { id: acc.id, name: formatAccountLabel(acc) };
    });
  }, [accounts]);

  // Active Filter Count calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'ALL') count++;
    if (selectedAccountId !== 'ALL') count++;
    if (selectedCategoryId !== 'ALL') count++;
    if (dateRangeOption !== 'ALL' || Boolean(dateFrom) || Boolean(dateTo)) count++;
    if (Boolean(minAmount) || Boolean(maxAmount)) count++;
    return count;
  }, [typeFilter, selectedAccountId, selectedCategoryId, dateRangeOption, dateFrom, dateTo, minAmount, maxAmount]);

  // Filtered Transactions calculation with full error protection
  const filteredTransactions = useMemo(() => {
    try {
      return transactions.filter((tx) => {
        if (!tx) return false;

        // Type Filter
        if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

        // Account Filter
        if (selectedAccountId !== 'ALL' && tx.accountId !== selectedAccountId && tx.toAccountId !== selectedAccountId) {
          return false;
        }

        // Category Filter
        if (selectedCategoryId !== 'ALL' && tx.categoryId !== selectedCategoryId) return false;

        // Date Filter
        const txDate = tx.date || '';
        if (dateFrom && txDate < dateFrom) return false;
        if (dateTo && txDate > dateTo) return false;

        // Amount Filter
        const txAmt = Number.isFinite(tx.amount) ? tx.amount : 0;
        if (minAmount && txAmt < parseFloat(minAmount)) return false;
        if (maxAmount && txAmt > parseFloat(maxAmount)) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const noteText = (tx.note || '').toLowerCase();
          const merchantText = (tx.merchant || '').toLowerCase();
          const catName = (categories.find((c) => c.id === tx.categoryId)?.name || '').toLowerCase();
          const accName = (accounts.find((a) => a.id === tx.accountId)?.name || '').toLowerCase();
          const toAccName = (accounts.find((a) => a.id === tx.toAccountId)?.name || '').toLowerCase();
          const locName = (tx.locationName || '').toLowerCase();
          const amtStr = String(txAmt);

          return (
            noteText.includes(q) ||
            merchantText.includes(q) ||
            catName.includes(q) ||
            accName.includes(q) ||
            toAccName.includes(q) ||
            locName.includes(q) ||
            amtStr.includes(q) ||
            txDate.includes(q)
          );
        }

        return true;
      });
    } catch (err) {
      console.error('Filter transaction exception:', err);
      return [];
    }
  }, [transactions, typeFilter, selectedAccountId, selectedCategoryId, dateFrom, dateTo, minAmount, maxAmount, searchQuery, categories, accounts]);

  // Group transactions safely by Date
  const groupedByDate = useMemo(() => {
    const map: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach((tx) => {
      const d = tx.date || 'Unknown Date';
      if (!map[d]) {
        map[d] = [];
      }
      map[d].push(tx);
    });
    return map;
  }, [filteredTransactions]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
  }, [groupedByDate]);

  // Export CSV Action
  const handleExportCSV = async () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions match the selected filters', 'warning');
      return;
    }
    const result = await exportTransactionsCSV(filteredTransactions, accounts, categories);
    if (result.success) {
      showToast(`Exported ${result.count} transactions to CSV`, 'info');
    } else {
      showToast(result.message || 'Export failed', 'danger');
    }
  };

  const selectedAccountName = accounts.find((a) => a.id === selectedAccountId)?.name;
  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name;

  return (
    <ErrorBoundary
      fallbackTitle="Couldn't load transactions"
      fallbackMessage="Your transaction data could not be displayed. Tap below to retry loading."
      onRetry={() => {
        handleResetFilters();
      }}
    >
      <PageTransition>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Column: Transaction List & Toolbar */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Summary Banner */}
            <div className="card-level-3 hero-blue-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px 24px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                MONTHLY SPENDING SUMMARY
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }} className="tabular-nums">
                {settings.hideBalances ? '₹••••• spent this month' : `${formatINR(monthlyExpenses)} spent this month`}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Showing {filteredTransactions.length} of {transactions.length} entries
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: '0.84rem' }}>
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          {/* Compact Mobile Top Bar & Filter Controls (Reqs 3, 4, 6) */}
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
            {/* Row 1: Search Box & Filter Toggle Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search merchant, note, amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px', fontSize: '0.86rem', padding: '9px 12px 9px 36px', height: '40px' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Mobile Filter Button with Badge (Req 4) */}
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(true)}
                className="btn btn-secondary"
                style={{
                  padding: '9px 14px',
                  height: '40px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  borderColor: activeFilterCount > 0 ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: activeFilterCount > 0 ? 'var(--accent-cyan)' : 'var(--text-primary)',
                }}
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--accent-cyan)',
                      color: '#000000',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      borderRadius: '10px',
                      padding: '1px 6px',
                      marginLeft: '2px',
                    }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Row 2: Compact Transaction Type Selector Pills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(15, 21, 42, 0.8)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => {
                  const isActive = typeFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                        color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.82rem',
                        border: isActive ? '1px solid var(--border-strong)' : 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}
                    </button>
                  );
                })}
              </div>

              {/* Desktop Compact Dropdown Filters (Req 6) */}
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', height: '34px' }}
                >
                  <option value="ALL">All Accounts</option>
                  {uniqueAccountOptions.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', height: '34px' }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Removable Active Filter Chips ONLY when active (Req 4) */}
            {activeFilterCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active filters:</span>
                
                {typeFilter !== 'ALL' && (
                  <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', padding: '3px 8px' }}>
                    Type: {typeFilter}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setTypeFilter('ALL')} />
                  </span>
                )}

                {selectedAccountId !== 'ALL' && selectedAccountName && (
                  <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', padding: '3px 8px' }}>
                    {selectedAccountName}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedAccountId('ALL')} />
                  </span>
                )}

                {selectedCategoryId !== 'ALL' && selectedCategoryName && (
                  <span className="badge badge-violet" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', padding: '3px 8px' }}>
                    {selectedCategoryName}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedCategoryId('ALL')} />
                  </span>
                )}

                {dateRangeOption !== 'ALL' && (
                  <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', padding: '3px 8px' }}>
                    {dateRangeOption.replace('_', ' ')}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleDatePresetChange('ALL')} />
                  </span>
                )}

                {(minAmount || maxAmount) && (
                  <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', padding: '3px 8px' }}>
                    ₹{minAmount || '0'}–₹{maxAmount || '∞'}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setMinAmount(''); setMaxAmount(''); }} />
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  style={{ fontSize: '0.74rem', color: 'var(--status-expense)', background: 'none', border: 'none', padding: '2px 6px', fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
                >
                  Reset all
                </button>
              </div>
            )}
          </div>

          {/* Template Strip */}
          {templates.length > 0 && (
            <section className="template-strip card-level-1" aria-labelledby="templates-title">
              <div><h2 id="templates-title">Transaction templates</h2><p>Selecting one prefills the form for quick entry.</p></div>
              <div className="template-list">{templates.map((template) => <div className="template-chip" key={template.id}><button onClick={() => applyTemplate(template)}><Copy size={15} /><span>{template.name}</span>{template.amount ? <small>{formatINR(template.amount)}</small> : null}</button><button className="template-edit" onClick={() => { const name = prompt('Rename template', template.name); if (name?.trim()) saveTemplate({ ...template, name: name.trim() }); }} aria-label={`Edit template ${template.name}`}>Edit</button><button className="btn-icon" aria-label={`Delete template ${template.name}`} onClick={() => { if (confirm(`Delete template “${template.name}”?`)) deleteTemplate(template.id); }}><X size={14} /></button></div>)}</div>
            </section>
          )}

          {/* Grouped Transactions List with Loading & Error States */}
          {authLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonList count={5} />
            </div>
          ) : sortedDates.length === 0 ? (
            <EmptyState
              icon={<Receipt size={24} />}
              title="No Transactions Found"
              description="No financial entries match your filter or search criteria. Try resetting filters or log a new transaction."
              actionText="Add Transaction"
              onAction={() => setIsAddTransactionOpen(true)}
            />
          ) : (
            sortedDates.map((dateStr) => {
              const dateTxs = groupedByDate[dateStr] || [];
              let formattedDate = dateStr;
              try {
                if (dateStr && dateStr !== 'Unknown Date') {
                  const d = new Date(dateStr);
                  if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                  }
                }
              } catch {
                formattedDate = dateStr;
              }

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
                            account={acc || ({ name: 'Deleted account' } as Account)}
                            toAccount={toAcc}
                            category={cat || ({ name: 'Unknown category' } as Category)}
                            hideBalances={settings.hideBalances}
                            isSelected={selectedTxId === tx.id}
                            onSelect={handleRowSelect}
                            onEdit={(t) => setEditingTx(t)}
                            onDuplicate={handleDuplicate}
                          />
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

          {/* Mobile Filter BottomSheet (Req 5) */}
          <BottomSheet
            isOpen={isFilterSheetOpen}
            onClose={() => setIsFilterSheetOpen(false)}
            title="Filter Transactions"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 1. Transaction Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  TRANSACTION TYPE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: typeFilter === t ? 'var(--accent-cyan-subtle)' : 'var(--bg-solid-dark)',
                        border: typeFilter === t ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        color: typeFilter === t ? 'var(--accent-cyan)' : 'var(--text-primary)',
                        fontSize: '0.84rem',
                        fontWeight: typeFilter === t ? 700 : 500,
                        textAlign: 'center',
                      }}
                    >
                      {t === 'ALL' ? 'All Types' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Account */}
              <div>
                <label htmlFor="filter-account-select" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  ACCOUNT
                </label>
                <select
                  id="filter-account-select"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '0.86rem' }}
                >
                  <option value="ALL">All Accounts</option>
                  {uniqueAccountOptions.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Category */}
              <div>
                <label htmlFor="filter-category-select" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  CATEGORY
                </label>
                <select
                  id="filter-category-select"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '0.86rem' }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Date Range */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  DATE RANGE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  {[
                    { id: 'ALL', label: 'All Time' },
                    { id: 'TODAY', label: 'Today' },
                    { id: '7DAYS', label: 'Last 7 Days' },
                    { id: '30DAYS', label: 'Last 30 Days' },
                    { id: 'THIS_MONTH', label: 'This Month' },
                    { id: 'CUSTOM', label: 'Custom' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleDatePresetChange(preset.id as any)}
                      style={{
                        padding: '7px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: dateRangeOption === preset.id ? 'var(--accent-blue-subtle)' : 'var(--bg-solid-dark)',
                        border: dateRangeOption === preset.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        color: dateRangeOption === preset.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: dateRangeOption === preset.id ? 700 : 500,
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {dateRangeOption === 'CUSTOM' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From</label>
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To</label>
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Amount Range */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  AMOUNT (₹)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="Min amount"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    style={{ width: '100%', fontSize: '0.84rem' }}
                  />
                  <input
                    type="number"
                    placeholder="Max amount"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    style={{ width: '100%', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.86rem', flex: 1 }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </BottomSheet>
          </div>

          {/* Right Column: Desktop Detail Panel (Reqs 20, 24, 25, 26) */}
          <div className="desktop-only" style={{ width: '360px', flexShrink: 0, position: 'sticky', top: '90px' }}>
            {selectedTx ? (
              <div className="card-level-2" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Transaction Details</h3>
                  <button className="btn-icon" onClick={() => setSelectedTxId(null)} aria-label="Close details">
                    <X size={18} />
                  </button>
                </div>
                <TransactionDetailContent
                  transaction={selectedTx}
                  account={accounts.find((a) => a.id === selectedTx.accountId)}
                  toAccount={accounts.find((a) => a.id === selectedTx.toAccountId)}
                  category={categories.find((c) => c.id === selectedTx.categoryId)}
                  hideBalances={settings.hideBalances}
                  onEdit={(t) => setEditingTx(t)}
                  onDuplicate={handleDuplicate}
                  onDelete={(id) => {
                    deleteTransaction(id);
                    setSelectedTxId(null);
                  }}
                />
              </div>
            ) : (
              <div className="card-level-2" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Receipt size={32} color="var(--accent-blue)" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>Transaction Details</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Select a transaction to view its details.
                </p>
              </div>
            )}
          </div>

          {/* Mobile Transaction Details BottomSheet (Req 22, 23) */}
          <TransactionDetailBottomSheet
            isOpen={isDetailSheetOpen}
            onClose={() => setIsDetailSheetOpen(false)}
            transaction={selectedTx}
            account={accounts.find((a) => a?.id === selectedTx?.accountId)}
            toAccount={accounts.find((a) => a?.id === selectedTx?.toAccountId)}
            category={categories.find((c) => c?.id === selectedTx?.categoryId)}
            onEdit={(t) => setEditingTx(t)}
            onDuplicate={handleDuplicate}
            onDelete={(id) => {
              deleteTransaction(id);
              setSelectedTxId(null);
            }}
          />
        </div>
      </PageTransition>
    </ErrorBoundary>
  );
};
