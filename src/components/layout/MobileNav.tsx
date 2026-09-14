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
  Calendar,
  MapPin,
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
      // Ignore on non-native web
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
    { id: 'dashboard' as ViewType, label: 'Home', icon: <LayoutDashboard size={24} /> },
    { id: 'transactions' as ViewType, label: 'Txns', icon: <ArrowLeftRight size={24} /> },
    { id: 'accounts' as ViewType, label: 'Accounts', icon: <WalletCards size={24} /> },
    { id: 'budgets' as ViewType, label: 'Budgets', icon: <Target size={24} /> },
  ];

  const secondaryMenu = [
    {
      id: 'analytics' as ViewType,
      title: 'Analytics',
      description: 'Spending trends & overview',
      icon: <PieChart size={24} color="var(--accent-cyan)" />,
    },
    {
      id: 'maps' as ViewType,
      title: 'Maps',
      description: 'Transaction locations & spend map',
      icon: <MapPin size={24} color="var(--accent-cyan)" />,
    },
    {
      id: 'recurring' as ViewType,
      title: 'Reminders',
      description: 'Bill & payment reminders',
      icon: <Bell size={24} color="var(--accent-blue)" />,
    },
    {
      id: 'calendar' as ViewType,
      title: 'Calendar',
      description: 'View transactions by date',
      icon: <Calendar size={24} color="var(--accent-purple)" />,
    },
    {
      id: 'notifications' as ViewType,
      title: 'Notifications',
      description: 'Budget alerts and reminders',
      icon: <Bell size={24} color="var(--accent-violet)" />,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : null,
    },
    {
      id: 'settings' as ViewType,
      title: 'Settings',
      description: 'Account, sync & app options',
      icon: <Settings size={24} color="var(--text-secondary)" />,
    },
  ];

  const isSecondaryActive = secondaryMenu.some((item) => item.id === currentView);

  return (
    <>
      {/* Mobile Floating Add Transaction Action Button */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--mobile-nav-height) + var(--mobile-safe-bottom) + 14px)',
          right: '20px',
          zIndex: 920,
        }}
      >
        <button
          onClick={handleOpenAddTransaction}
          aria-label="Add transaction"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #22D3EE 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(139, 92, 246, 0.5), 0 2px 10px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          className="btn-floating-gradient"
        >
          <Plus size={32} strokeWidth={2.8} />
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
          backgroundColor: 'rgba(17, 21, 46, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 'calc(var(--mobile-nav-height) + var(--mobile-safe-bottom))',
          padding: '4px 6px var(--mobile-safe-bottom) 6px',
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
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                backgroundColor: isActive ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                padding: '6px 0',
                minHeight: '50px',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
                transition: 'all 0.15s ease',
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
            color: isMoreOpen || isSecondaryActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
            backgroundColor: isMoreOpen || isSecondaryActive ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: isMoreOpen || isSecondaryActive ? 700 : 500,
            padding: '6px 0',
            minHeight: '50px',
            border: isMoreOpen || isSecondaryActive ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
            transition: 'all 0.15s ease',
          }}
        >
          <MoreHorizontal size={24} />
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
            backgroundColor: 'rgba(8, 10, 24, 0.85)',
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
              backgroundColor: 'rgba(27, 32, 66, 0.96)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderTop: '1px solid var(--border-light)',
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
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Spendly Navigation</h3>
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
                    backgroundColor: currentView === menu.id ? 'var(--accent-violet-subtle)' : 'rgba(17, 21, 46, 0.7)',
                    border: `1px solid ${currentView === menu.id ? 'var(--accent-violet-border)' : 'var(--border-color)'}`,
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
                              backgroundColor: 'var(--accent-violet)',
                              color: '#FFFFFF',
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
                  border: '1px solid rgba(244, 63, 94, 0.25)',
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
