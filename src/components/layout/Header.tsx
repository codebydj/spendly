import React from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Search, Plus, Wifi, WifiOff, RefreshCw, AlertTriangle, User } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentView,
    settings,
    toggleHideBalances,
    searchQuery,
    setSearchQuery,
    setIsAddTransactionOpen,
    isOffline,
    syncStatus,
    setCurrentView,
    user,
  } = useApp();

  const getPageMeta = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Overview', subtitle: 'Personal financial summary and account balances.' };
      case 'transactions':
        return { title: 'Transactions', subtitle: 'View and filter all your financial entries.' };
      case 'accounts':
        return { title: 'Accounts', subtitle: 'Manage your money across all accounts.' };
      case 'budgets':
        return { title: 'Budgets', subtitle: 'Track monthly limits and category spending.' };
      case 'analytics':
        return { title: 'Analytics', subtitle: 'Understand your spending trends and savings rate.' };
      case 'recurring':
        return { title: 'Recurring Payments', subtitle: 'Subscriptions and scheduled recurring bills.' };
      case 'calendar':
        return { title: 'Financial Calendar', subtitle: 'Daily breakdown of financial activity.' };
      case 'notifications':
        return { title: 'Notifications', subtitle: 'Alerts, payment reminders, and summaries.' };
      case 'settings':
        return { title: 'Settings', subtitle: 'Privacy controls, export CSV, and offline data backup.' };
      case 'login':
        return { title: 'Sign In', subtitle: 'Access your Spendly synchronized financial account.' };
      case 'signup':
        return { title: 'Create Account', subtitle: 'Join Spendly to manage your personal finances.' };
      default:
        return { title: 'Spendly', subtitle: 'Personal Finance Application' };
    }
  };

  const { title, subtitle } = getPageMeta();

  const renderSyncBadge = () => {
    if (isOffline || syncStatus === 'OFFLINE') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-warning-subtle)',
            color: 'var(--status-warning)',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
          title="Working offline using local storage"
        >
          <WifiOff size={13} />
          <span>Offline</span>
        </div>
      );
    }

    if (syncStatus === 'SYNCING') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--accent-blue)',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={13} style={{ animation: 'spin 1.5s linear infinite' }} />
          <span>Syncing...</span>
        </div>
      );
    }

    if (syncStatus === 'SYNC_FAILED') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-danger-subtle)',
            color: 'var(--status-danger)',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
          title="Sync temporary issue - local changes saved"
        >
          <AlertTriangle size={13} />
          <span>Sync issue</span>
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-emerald-subtle)',
          color: 'var(--accent-emerald)',
          fontSize: '0.72rem',
          fontWeight: 600,
        }}
        title={`Synced at ${settings.lastSyncedAt ? new Date(settings.lastSyncedAt).toLocaleTimeString() : 'now'}`}
      >
        <Wifi size={13} />
        <span>Synced</span>
      </div>
    );
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(9, 12, 18, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        maxWidth: '100vw',
      }}
    >
      {/* Mobile / Desktop Title Area */}
      <div style={{ minWidth: 0, flexShrink: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </h1>
        <p className="desktop-only" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          · {subtitle}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Sync Status Badge */}
        {renderSyncBadge()}

        {/* Global Search (Desktop Only) */}
        <div style={{ position: 'relative', width: '180px' }} className="desktop-only">
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentView !== 'transactions') {
                setCurrentView('transactions');
              }
            }}
            style={{
              width: '100%',
              paddingLeft: '30px',
              paddingTop: '6px',
              paddingBottom: '6px',
              fontSize: '0.82rem',
              backgroundColor: 'rgba(18, 23, 34, 0.8)',
            }}
          />
        </div>

        {/* Privacy Balance Toggle */}
        <button
          onClick={toggleHideBalances}
          className="btn-icon"
          title={settings.hideBalances ? 'Show Balances' : 'Hide Balances'}
          aria-label="Toggle hide balance privacy"
          style={{ padding: '6px 8px', minHeight: '36px', minWidth: '36px' }}
        >
          {settings.hideBalances ? <EyeOff size={16} color="var(--accent-emerald)" /> : <Eye size={16} />}
        </button>

        {/* User Profile Avatar Link (Mobile Quick Settings Access) */}
        <button
          onClick={() => setCurrentView('settings')}
          className="btn-icon mobile-only"
          style={{ padding: '4px', minHeight: '36px', minWidth: '36px' }}
          aria-label="User Settings"
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-emerald-subtle)',
              border: '1px solid var(--accent-emerald-border)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {user?.email ? user.email.slice(0, 2).toUpperCase() : <User size={14} />}
          </div>
        </button>

        {/* Top Desktop Add Transaction Button */}
        <button
          onClick={() => setIsAddTransactionOpen(true)}
          className="btn btn-primary desktop-only"
          style={{ padding: '7px 16px', fontSize: '0.84rem', minHeight: '38px', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add transaction</span>
        </button>
      </div>
    </header>
  );
};
