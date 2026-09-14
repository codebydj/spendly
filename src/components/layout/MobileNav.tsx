import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ViewType } from '../../context/AppContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  LayoutDashboard,
  ArrowLeftRight,
  WalletCards,
  Target,
  MoreHorizontal,
  PieChart,
  Repeat,
  Calendar,
  Bell,
  Settings,
  X,
  ChevronRight,
  LogOut,
  Plus,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    unreadNotificationCount,
    user,
    logout,
    setIsAddTransactionOpen,
  } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore on non-native environments
    }
  };

  const handleNavClick = (id: ViewType) => {
    triggerHaptic();
    setCurrentView(id);
    setIsMoreOpen(false);
  };

  const handleOpenAddTransaction = () => {
    triggerHaptic();
    setIsAddTransactionOpen(true);
  };

  const navItems = [
    { id: 'dashboard' as ViewType, label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions' as ViewType, label: 'Txns', icon: <ArrowLeftRight size={20} /> },
    { id: 'accounts' as ViewType, label: 'Accounts', icon: <WalletCards size={20} /> },
    { id: 'budgets' as ViewType, label: 'Budgets', icon: <Target size={20} /> },
  ];

  const secondaryMenu = [
    {
      id: 'analytics' as ViewType,
      title: 'Analytics',
      description: 'Spending trends & overview',
      icon: <PieChart size={20} color="var(--accent-emerald)" />,
    },
    {
      id: 'recurring' as ViewType,
      title: 'Recurring',
      description: 'Manage recurring bills',
      icon: <Repeat size={20} color="var(--accent-blue)" />,
    },
    {
      id: 'calendar' as ViewType,
      title: 'Calendar',
      description: 'View transactions by date',
      icon: <Calendar size={20} color="var(--status-warning)" />,
    },
    {
      id: 'notifications' as ViewType,
      title: 'Notifications',
      description: 'Budget alerts and reminders',
      icon: <Bell size={20} color="var(--accent-emerald)" />,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : null,
    },
    {
      id: 'settings' as ViewType,
      title: 'Settings',
      description: 'Account and app preferences',
      icon: <Settings size={20} color="var(--text-secondary)" />,
    },
  ];

  const isSecondaryActive = secondaryMenu.some((item) => item.id === currentView);

  return (
    <>
      {/* Mobile Floating Add Transaction Action Button */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--mobile-nav-height) + var(--mobile-safe-bottom) + 12px)',
          right: '20px',
          zIndex: 920,
        }}
      >
        <button
          onClick={handleOpenAddTransaction}
          aria-label="Add transaction"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: 'var(--accent-emerald)',
            color: '#042f2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.42), 0 2px 8px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
          className="btn-floating-action"
        >
          <Plus size={26} strokeWidth={2.8} />
        </button>
      </div>

      {/* Mobile Fixed App Glass Navigation Bar */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          backgroundColor: 'rgba(12, 16, 24, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 'calc(var(--mobile-nav-height) + var(--mobile-safe-bottom))',
          padding: '0 4px var(--mobile-safe-bottom) 4px',
        }}
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id && !isMoreOpen;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: isActive ? 700 : 500,
                padding: '6px 0',
                minHeight: '48px',
                transition: 'color 0.15s ease',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* More Tab Trigger */}
        <button
          onClick={() => {
            triggerHaptic();
            setIsMoreOpen(!isMoreOpen);
          }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: isMoreOpen || isSecondaryActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: isMoreOpen || isSecondaryActive ? 700 : 500,
            padding: '6px 0',
            minHeight: '48px',
            transition: 'color 0.15s ease',
          }}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer Sheet */}
      {isMoreOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 950,
            backgroundColor: 'rgba(6, 8, 13, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'rgba(22, 29, 42, 0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderTop: '1px solid var(--border-strong)',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderTopRightRadius: 'var(--radius-xl)',
              padding: '20px 16px calc(var(--mobile-nav-height) + var(--mobile-safe-bottom) + 20px) 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Spendly Features</h3>
                {user?.email && (
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{user.email}</p>
                )}
              </div>
              <button onClick={() => setIsMoreOpen(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            {/* Clean App List Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {secondaryMenu.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => handleNavClick(menu.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: currentView === menu.id ? 'var(--accent-emerald-subtle)' : 'rgba(18, 23, 34, 0.7)',
                    border: `1px solid ${currentView === menu.id ? 'var(--accent-emerald-border)' : 'var(--border-color)'}`,
                    textAlign: 'left',
                    minHeight: '52px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {menu.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {menu.title}
                        </span>
                        {menu.badge && (
                          <span
                            style={{
                              backgroundColor: 'var(--accent-emerald)',
                              color: '#042f2e',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              borderRadius: '4px',
                              padding: '1px 6px',
                            }}
                          >
                            {menu.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {menu.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={18} color="var(--text-muted)" />
                </button>
              ))}

              <button
                onClick={() => {
                  triggerHaptic();
                  setIsMoreOpen(false);
                  logout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-danger-subtle)',
                  border: '1px solid rgba(240, 68, 68, 0.25)',
                  color: 'var(--status-danger)',
                  marginTop: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
