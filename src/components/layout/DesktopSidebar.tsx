import React from 'react';
import { useApp } from '../../context/AppContext';
import type { ViewType } from '../../context/AppContext';
import { SpendlyLogo } from '../ui/SpendlyLogo';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  PieChart,
  Repeat,
  Calendar as CalendarIcon,
  MapPin,
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
    setIsPinLocked,
    settings,
    user,
    logout,
  } = useApp();

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={22} /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt size={22} /> },
    { id: 'accounts', label: 'Accounts', icon: <Wallet size={22} /> },
    { id: 'budgets', label: 'Budgets', icon: <PiggyBank size={22} /> },
    { id: 'analytics', label: 'Analytics', icon: <PieChart size={22} /> },
    { id: 'recurring', label: 'Recurring', icon: <Repeat size={22} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={22} /> },
    { id: 'maps', label: 'Maps', icon: <MapPin size={22} /> },
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
        <div style={{ padding: '4px 8px' }}>
          <SpendlyLogo type="full" height={44} />
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setIsAddTransactionOpen(true)}
          className="btn btn-gradient"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.94rem' }}
        >
          <Plus size={22} strokeWidth={2.8} />
          <span>Add Transaction</span>
        </button>

        {/* Main Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.95rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      backgroundColor: 'rgba(139, 92, 246, 0.28)',
                      color: 'var(--accent-lavender)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '2px 8px',
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
            gap: '14px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: currentView === 'settings' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: currentView === 'settings' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            fontSize: '0.95rem',
            textAlign: 'left',
          }}
        >
          <Settings size={22} />
          <span>Settings</span>
        </button>

        {/* Offline / Online Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 14px',
            fontSize: '0.82rem',
            color: isOffline ? 'var(--status-warning)' : 'var(--text-muted)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          {isOffline ? <WifiOff size={18} color="var(--status-warning)" /> : <Wifi size={18} color="var(--accent-emerald)" />}
          <span>{isOffline ? 'Offline mode' : 'Cloud synchronized'}</span>
        </div>

        {/* Profile / App Lock / Sign Out */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 14px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-emerald-subtle)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            <span
              style={{
                fontSize: '0.82rem',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {settings.pinEnabled && (
              <button
                onClick={() => setIsPinLocked(true)}
                className="btn-icon"
                title="Lock Spendly"
                style={{ padding: '6px', color: 'var(--text-muted)' }}
              >
                <Lock size={16} />
              </button>
            )}
            <button
              onClick={logout}
              className="btn-icon"
              title="Sign Out"
              style={{ padding: '6px', color: 'var(--status-danger)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
