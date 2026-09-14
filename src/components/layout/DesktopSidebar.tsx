import React from 'react';
import { useApp } from '../../context/AppContext';
import type { ViewType } from '../../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  PieChart,
  Repeat,
  Calendar as CalendarIcon,
  Bell,
  Settings,
  Plus,
  Wifi,
  WifiOff,
  Lock,
  LogOut,
} from 'lucide-react';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const DesktopSidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    setIsAddTransactionOpen,
    isOffline,
    unreadNotificationCount,
    setIsPinLocked,
    settings,
    user,
    logout,
  } = useApp();

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt size={18} /> },
    { id: 'accounts', label: 'Accounts', icon: <Wallet size={18} /> },
    { id: 'budgets', label: 'Budgets', icon: <PiggyBank size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <PieChart size={18} /> },
    { id: 'recurring', label: 'Recurring', icon: <Repeat size={18} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={18} /> },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
    },
  ];

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const displayEmail = user?.email || 'Authenticated User';

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-dark)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
        flexShrink: 0,
        overflowY: 'auto',
        zIndex: 150,
      }}
    >
      {/* Top Brand & Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: 'var(--accent-emerald)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#042f2e', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>₹</span>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            spendly
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setIsAddTransactionOpen(true)}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
        >
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>

        {/* Main Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {mainNavItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      backgroundColor: 'var(--accent-emerald-subtle)',
                      color: 'var(--accent-emerald)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    className="tabular-nums"
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Settings & Status & Profile */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <button
          onClick={() => setCurrentView('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '9px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: currentView === 'settings' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: currentView === 'settings' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            fontSize: '0.9rem',
            textAlign: 'left',
          }}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        {/* Offline / Online Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            fontSize: '0.78rem',
            color: isOffline ? 'var(--status-warning)' : 'var(--text-muted)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          {isOffline ? <WifiOff size={14} color="var(--status-warning)" /> : <Wifi size={14} color="var(--accent-emerald)" />}
          <span>{isOffline ? 'Offline mode' : 'Cloud synchronized'}</span>
        </div>

        {/* Profile / App Lock / Sign Out */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent-emerald-subtle)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '120px',
              }}
              title={displayEmail}
            >
              {displayEmail}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {settings.pinEnabled && (
              <button
                onClick={() => setIsPinLocked(true)}
                className="btn-icon"
                title="Lock Spendly"
                style={{ padding: '4px', color: 'var(--text-muted)' }}
              >
                <Lock size={14} />
              </button>
            )}
            <button
              onClick={logout}
              className="btn-icon"
              title="Sign Out"
              style={{ padding: '4px', color: 'var(--status-danger)' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
