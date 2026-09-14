import React from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Search, Plus, WifiOff, RefreshCw, AlertTriangle, User, CloudCheck } from 'lucide-react';

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
    triggerManualSync,
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
        return { title: 'Settings', subtitle: 'Cloud synchronization, export CSV, and security.' };
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
        <button
          onClick={triggerManualSync}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-warning-subtle)',
            color: 'var(--status-warning)',
            fontSize: '0.74rem',
            fontWeight: 700,
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
          title="Working offline - tap to try syncing"
        >
          <WifiOff size={13} />
          <span>Offline</span>
        </button>
      );
    }

    if (syncStatus === 'SYNCING') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            color: 'var(--accent-blue)',
            fontSize: '0.74rem',
            fontWeight: 700,
            border: '1px solid rgba(96, 165, 250, 0.3)',
          }}
        >
          <RefreshCw size={13} style={{ animation: 'spin 1.5s linear infinite' }} />
          <span>Syncing...</span>
        </div>
      );
    }

    if (syncStatus === 'SYNC_FAILED') {
      return (
        <button
          onClick={triggerManualSync}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-danger-subtle)',
            color: 'var(--status-danger)',
            fontSize: '0.74rem',
            fontWeight: 700,
            border: '1px solid rgba(244, 63, 94, 0.25)',
          }}
          title="Sync issue - tap Sync Now to retry"
        >
          <AlertTriangle size={13} />
          <span>Sync Issue</span>
        </button>
      );
    }

    return (
      <button
        onClick={triggerManualSync}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-cyan-subtle)',
          color: 'var(--accent-cyan)',
          fontSize: '0.74rem',
          fontWeight: 700,
          border: '1px solid var(--accent-cyan-border)',
        }}
        title={`Synced at ${settings.lastSyncedAt ? new Date(settings.lastSyncedAt).toLocaleTimeString() : 'now'}. Tap to Sync Now`}
      >
        <CloudCheck size={13} />
        <span>Synced</span>
      </button>
    );
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(13, 16, 36, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
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
        {/* Manual Sync Status Badge */}
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
              backgroundColor: 'rgba(17, 21, 46, 0.8)',
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
          {settings.hideBalances ? <EyeOff size={16} color="var(--accent-cyan)" /> : <Eye size={16} />}
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
              backgroundColor: 'var(--accent-violet-subtle)',
              border: '1px solid var(--accent-violet-border)',
              color: 'var(--accent-lavender)',
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
          className="btn btn-gradient desktop-only"
          style={{ padding: '7px 18px', fontSize: '0.84rem', minHeight: '38px', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>Add transaction</span>
        </button>
      </div>
    </header>
  );
};
