import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Search, WifiOff, RefreshCw, AlertTriangle, CloudCheck, Bell, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { SyncBottomSheet } from '../modals/SyncBottomSheet';

export const Header: React.FC = () => {
  const {
    currentView,
    settings,
    toggleHideBalances,
    isOffline,
    syncStatus,
    pendingOpsCount,
    setCurrentView,
    user,
    userProfile,
    unreadNotificationCount,
    updateStatus,
    latestManifest,
    setIsUpdateModalOpen,
  } = useApp();

  const [isSyncSheetOpen, setIsSyncSheetOpen] = useState(false);

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
      case 'goals':
        return { title: 'Savings goals', subtitle: 'Plan targets without changing account balances.' };
      case 'analytics':
        return { title: 'Analytics', subtitle: 'Understand your spending trends and savings rate.' };
      case 'recurring':
        return { title: 'Reminders', subtitle: 'Subscriptions and scheduled recurring bills.' };
      case 'calendar':
        return { title: 'Calendar', subtitle: 'Daily breakdown of financial activity.' };
      case 'maps':
        return { title: 'Maps', subtitle: 'Transaction locations and spending patterns.' };
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

  const handleSyncClick = () => {
    setIsSyncSheetOpen(true);
  };

  const renderSyncBadge = () => {
    // Mobile Compact Icon Badge
    const renderMobileIcon = () => {
      if (isOffline || syncStatus === 'OFFLINE') {
        return (
          <button
            onClick={handleSyncClick}
            className="btn-icon mobile-only"
            title="Working offline - tap for sync details"
            aria-label="Offline sync status"
            style={{ padding: '6px', color: 'var(--status-warning)', minHeight: '38px', minWidth: '38px' }}
          >
            <WifiOff size={19} />
          </button>
        );
      }
      if (syncStatus === 'SYNCING') {
        return (
          <button
            onClick={handleSyncClick}
            className="btn-icon mobile-only"
            title="Syncing..."
            aria-label="Syncing status"
            style={{ padding: '6px', color: 'var(--accent-blue)', minHeight: '38px', minWidth: '38px' }}
          >
            <RefreshCw size={19} style={{ animation: 'spin 1.5s linear infinite' }} />
          </button>
        );
      }
      if (syncStatus === 'SYNC_FAILED') {
        return (
          <button
            onClick={handleSyncClick}
            className="btn-icon mobile-only"
            title="Sync issue - tap to retry"
            aria-label="Sync error"
            style={{ padding: '6px', color: 'var(--status-danger)', minHeight: '38px', minWidth: '38px' }}
          >
            <AlertTriangle size={19} />
          </button>
        );
      }
      return (
        <button
          onClick={handleSyncClick}
          className="btn-icon mobile-only"
          title="Online Synced"
          aria-label="Online synced"
          style={{ padding: '6px', color: 'var(--accent-cyan)', minHeight: '38px', minWidth: '38px' }}
        >
          <CloudCheck size={20} />
        </button>
      );
    };

    // Desktop Pill Button
    const renderDesktopButton = () => {
      if (isOffline || syncStatus === 'OFFLINE') {
        const pendingText = pendingOpsCount > 0 ? ` (${pendingOpsCount})` : '';
        return (
          <button
            onClick={handleSyncClick}
            className="desktop-only"
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
            title={pendingOpsCount > 0 ? `Working offline (${pendingOpsCount} changes pending sync) - tap to sync` : 'Working offline - tap for sync status'}
          >
            <WifiOff size={16} />
            <span>Offline{pendingText}</span>
          </button>
        );
      }

      if (syncStatus === 'SYNCING') {
        return (
          <div
            className="desktop-only"
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
            <span>Syncing</span>
          </div>
        );
      }

      if (syncStatus === 'SYNC_FAILED') {
        return (
          <button
            onClick={handleSyncClick}
            className="desktop-only"
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
            <span>Sync Error</span>
          </button>
        );
      }

      return (
        <button
          onClick={handleSyncClick}
          className="desktop-only"
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
          title={`Synced at ${settings.lastSyncedAt ? new Date(settings.lastSyncedAt).toLocaleTimeString() : 'now'}. Tap for details`}
        >
          <CloudCheck size={16} />
          <span>Online Synced</span>
        </button>
      );
    };

    return (
      <>
        {renderMobileIcon()}
        {renderDesktopButton()}
      </>
    );
  };

  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  const isUpdateAvailable = isNative && updateStatus === 'UPDATE_AVAILABLE' && Boolean(latestManifest?.version);
  const initials = userProfile?.fullName
    ? userProfile.fullName.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'DJ';

  return (
    <>
      <header
        style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'rgba(13, 17, 38, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          maxWidth: '100vw',
        }}
      >
        <div className="header-title-group">
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {title}
          </h1>
          <p className="desktop-only" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            · {subtitle}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, flexWrap: 'nowrap' }}>
          {/* New App Update Badge Button */}
          {isUpdateAvailable && latestManifest && (
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: 'var(--accent-lavender)',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: '1px solid var(--accent-violet-border)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={`New update V${latestManifest.version} is available. Click to view details.`}
            >
              <Sparkles size={14} color="var(--accent-cyan)" />
              <span>V{latestManifest.version}</span>
              <span className="desktop-only" style={{ marginLeft: '2px' }}>Update</span>
            </button>
          )}

          {/* Unified Sync & Network Status Badge */}
          {renderSyncBadge()}

          {/* Global Search (Desktop Only) */}
          <button type="button" onClick={() => window.dispatchEvent(new Event('spendly:command'))} style={{ position: 'relative', width: '200px', textAlign: 'left' }} className="desktop-only header-command-trigger" aria-label="Open search and quick navigation">
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <span>Search or jump…</span><kbd>⌘K</kbd>
          </button>

          {/* Notification Bell with Badge */}
          <button
            onClick={() => setCurrentView('notifications')}
            className="btn-icon"
            title="Notifications"
            aria-label="Notifications"
            style={{ position: 'relative', padding: '6px', minHeight: '38px', minWidth: '38px' }}
          >
            <Bell size={20} color={unreadNotificationCount > 0 ? 'var(--accent-lavender)' : 'var(--text-secondary)'} />
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: 'var(--status-expense)',
                  color: '#FFFFFF',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '2px 5px',
                  lineHeight: 1,
                  border: '1.5px solid var(--bg-dark)',
                }}
              >
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Privacy Balance Toggle (Desktop Only) */}
          <button
            onClick={toggleHideBalances}
            className="btn-icon desktop-only"
            title={settings.hideBalances ? 'Show Balances' : 'Hide Balances'}
            aria-label="Toggle hide balance privacy"
            style={{ padding: '8px', minHeight: '40px', minWidth: '40px' }}
          >
            {settings.hideBalances ? <EyeOff size={20} color="var(--accent-cyan)" /> : <Eye size={20} />}
          </button>

          {/* User Profile Avatar Link (Mobile & Desktop Quick Settings Access) */}
          <button
            onClick={() => setCurrentView('settings')}
            className="btn-icon"
            style={{ padding: '2px', minHeight: '36px', minWidth: '36px' }}
            aria-label="User Settings"
            title="Settings & Profile"
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
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Cloud Synchronization Bottom Sheet */}
      <SyncBottomSheet isOpen={isSyncSheetOpen} onClose={() => setIsSyncSheetOpen(false)} />
    </>
  );
};

