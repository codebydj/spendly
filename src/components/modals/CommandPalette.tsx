import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Search } from 'lucide-react';
import { useApp, type ViewType } from '../../context/AppContext';

const pages: Array<{ label: string; view: ViewType; keywords: string }> = [
  { label: 'Overview', view: 'dashboard', keywords: 'home dashboard balance' },
  { label: 'Transactions', view: 'transactions', keywords: 'entries history search' },
  { label: 'Accounts', view: 'accounts', keywords: 'wallet bank cash' },
  { label: 'Budgets', view: 'budgets', keywords: 'limits spending' },
  { label: 'Savings goals', view: 'goals', keywords: 'target planning saving' },
  { label: 'Analytics', view: 'analytics', keywords: 'charts trends' },
  { label: 'Reminders', view: 'recurring', keywords: 'bills recurring' },
  { label: 'Calendar', view: 'calendar', keywords: 'dates' },
  { label: 'Maps', view: 'maps', keywords: 'location' },
  { label: 'Notifications', view: 'notifications', keywords: 'alerts updates' },
  { label: 'Settings', view: 'settings', keywords: 'profile sync security' },
];

export const CommandPalette: React.FC = () => {
  const { setCurrentView, setIsAddTransactionOpen, transactions, accounts, categories, setSearchQuery } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen((value) => !value); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => { const openPalette = () => setOpen(true); window.addEventListener('spendly:command', openPalette); return () => window.removeEventListener('spendly:command', openPalette); }, []);
  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()); else setQuery(''); }, [open]);
  const filteredPages = useMemo(() => pages.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const matchingTransactions = useMemo(() => query.trim().length < 2 ? [] : transactions.filter((tx) => {
    const category = categories.find((item) => item.id === tx.categoryId)?.name || '';
    const account = accounts.find((item) => item.id === tx.accountId)?.name || '';
    return `${tx.note} ${tx.merchant || ''} ${category} ${account} ${tx.amount}`.toLowerCase().includes(query.toLowerCase());
  }).slice(0, 5), [query, transactions, categories, accounts]);
  const add = (type: 'EXPENSE' | 'INCOME' | 'TRANSFER') => { sessionStorage.setItem('spendly_new_transaction_type', type); setIsAddTransactionOpen(true); setOpen(false); };
  if (!open) return null;
  return <div className="command-backdrop" onMouseDown={(e) => e.currentTarget === e.target && setOpen(false)}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Search and quick navigation"><div className="command-search"><Search size={20} /><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions or go to…" aria-label="Search commands"/><kbd>Esc</kbd></div><div className="command-results"><p className="command-label">Quick actions</p><div className="command-actions"><button onClick={() => add('EXPENSE')}><ArrowUpRight />Add expense</button><button onClick={() => add('INCOME')}><ArrowDownLeft />Add income</button><button onClick={() => add('TRANSFER')}><ArrowLeftRight />Transfer</button></div><p className="command-label">Navigate</p>{filteredPages.map((item) => <button className="command-row" key={item.view} onClick={() => { setCurrentView(item.view); setOpen(false); }}><span>{item.label}</span><small>Go to page</small></button>)}{matchingTransactions.length > 0 && <><p className="command-label">Transactions</p>{matchingTransactions.map((tx) => <button className="command-row" key={tx.id} onClick={() => { setSearchQuery(tx.note); setCurrentView('transactions'); setOpen(false); }}><span>{tx.note}</span><small>{tx.date}</small></button>)}</>}{filteredPages.length === 0 && matchingTransactions.length === 0 && <div className="command-empty">No matching pages or transactions</div>}</div></section></div>;
};
