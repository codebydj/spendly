import React from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Search, Plus, Wifi, WifiOff, RefreshCw, AlertTriangle, User, CloudCheck, Bell, Sparkles } from 'lucide-react';
import { isNewerVersionAvailable } from '../../utils/versionCheck';

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
    pendingOpsCount,
    triggerManualSync,
    setCurrentView,
    user,
    unreadNotificationCount,
    latestManifest,
    setIsUpdateModalOpen,
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
      const pendingText = pendingOpsCount > 0 ? ` • ${pendingOpsCount} pending` : '';
      return (
        <button
          onClick={triggerManualSync}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-warning-subtle)',
            color: 'var(--status-warning)',
            fontSize: '0.78rem',
            fontWeight: 700,
            border: '1px solid rgba(245, 158, 11, 0.25)',
            cursor: 'pointer',
          }}
          title={pendingOpsCount > 0 ? `Working offline (${pendingOpsCount} changes pending sync)` : 'Working offline - tap to try syncing'}
        >
          <WifiOff size={16} />
          <span>Offline{pendingText}</span>
        </button>
      );
    }

    if (syncStatus === 'SYNCING') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            color: 'var(--accent-blue)',
            fontSize: '0.78rem',
            fontWeight: 700,
            border: '1px solid rgba(96, 165, 250, 0.3)',
          }}
        >
          <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
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
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-danger-subtle)',
            color: 'var(--status-danger)',
            fontSize: '0.78rem',
            fontWeight: 700,
            border: '1px solid rgba(244, 63, 94, 0.25)',
            cursor: 'pointer',
          }}
          title="Sync issue - tap Sync Now to retry"
        >
          <AlertTriangle size={16} />
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
          gap: '6px',
          padding: '5px 12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-cyan-subtle)',
          color: 'var(--accent-cyan)',
          fontSize: '0.78rem',
          fontWeight: 700,
          border: '1px solid var(--accent-cyan-border)',
          cursor: 'pointer',
        }}
        title={`Synced at ${settings.lastSyncedAt ? new Date(settings.lastSyncedAt).toLocaleTimeString() : 'now'}. Tap to Sync Now`}
      >
        <CloudCheck size={16} />
        <span>Synced</span>
      </button>
    );
  };

  const isUpdateAvailable = latestManifest && isNewerVersionAvailable(latestManifest.version);

  return (
    <>
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </h1>
          <p className="desktop-only" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            · {subtitle}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {/* New App Update Badge Button */}
          {isUpdateAvailable && (
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: 'var(--accent-lavender)',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid var(--accent-violet-border)',
                cursor: 'pointer',
              }}
              title={`New update V${latestManifest.version} is available. Click to view details.`}
            >
              <Sparkles size={16} color="var(--accent-cyan)" />
              <span>V{latestManifest.version} Update</span>
            </button>
          )}

          {/* Network Status Indicator */}
          <div
            title={isOffline ? 'Network status: Offline' : 'Network status: Online'}
            aria-label={isOffline ? 'Network Offline' : 'Network Online'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isOffline ? 'var(--status-warning-subtle)' : 'rgba(16, 185, 129, 0.1)',
              border: isOffline ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: isOffline ? 'var(--status-warning)' : 'var(--accent-emerald)',
              gap: '6px',
            }}
          >
            {isOffline ? (
              <>
                <WifiOff size={16} color="var(--status-warning)" />
                <span className="desktop-only">Offline</span>
              </>
            ) : (
              <>
                <Wifi size={16} color="var(--accent-emerald)" />
                <span className="desktop-only">Online</span>
              </>
            )}
          </div>

          {/* Manual Sync Status Badge */}
          {renderSyncBadge()}

          {/* Global Search (Desktop Only) */}
          <div style={{ position: 'relative', width: '200px' }} className="desktop-only">
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
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
                paddingLeft: '38px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '0.86rem',
                backgroundColor: 'rgba(17, 21, 46, 0.85)',
              }}
            />
          </div>

          {/* Notification Bell with Badge */}
          <button
            onClick={() => setCurrentView('notifications')}
            className="btn-icon"
            title="Notifications"
            aria-label="Notifications"
            style={{ position: 'relative', padding: '8px', minHeight: '40px', minWidth: '40px' }}
          >
            <Bell size={22} color={unreadNotificationCount > 0 ? 'var(--accent-lavender)' : 'var(--text-secondary)'} />
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: 'var(--status-expense)',
                  color: '#FFFFFF',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '2px 6px',
                  lineHeight: 1,
                  border: '1.5px solid var(--bg-dark)',
                }}
              >
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Privacy Balance Toggle */}
          <button
            onClick={toggleHideBalances}
            className="btn-icon"
            title={settings.hideBalances ? 'Show Balances' : 'Hide Balances'}
            aria-label="Toggle hide balance privacy"
            style={{ padding: '8px', minHeight: '40px', minWidth: '40px' }}
          >
            {settings.hideBalances ? <EyeOff size={20} color="var(--accent-cyan)" /> : <Eye size={20} />}
          </button>

          {/* User Profile Avatar Link (Mobile Quick Settings Access) */}
          <button
            onClick={() => setCurrentView('settings')}
            className="btn-icon mobile-only"
            style={{ padding: '4px', minHeight: '40px', minWidth: '40px' }}
            aria-label="User Settings"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-violet-subtle)',
                border: '1px solid var(--accent-violet-border)',
                color: 'var(--accent-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              {user?.email ? user.email.slice(0, 2).toUpperCase() : <User size={16} />}
            </div>
          </button>

          {/* Top Desktop Add Transaction Button */}
          <button
            onClick={() => setIsAddTransactionOpen(true)}
            className="btn btn-gradient desktop-only"
            style={{ padding: '8px 20px', fontSize: '0.88rem', minHeight: '40px', borderRadius: 'var(--radius-md)' }}
          >
            <Plus size={20} strokeWidth={2.8} />
            <span>Add transaction</span>
          </button>
        </div>
      </header>
    </>
  );
};
