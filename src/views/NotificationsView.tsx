import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/ui/GlassCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SpendlyLogo } from '../components/ui/SpendlyLogo';
import { AlertTriangle, Calendar, Info, Check, Trash2, Bell, ArrowUpRight } from 'lucide-react';
import { PageTransition } from '../components/motion/PageTransition';
import type { NotificationItem } from '../types/finance';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    clearNotifications,
    setIsUpdateModalOpen,
    updateStatus,
    setCurrentView,
    setIsAddTransactionOpen,
  } = useApp();

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  // Group Notifications by Today, Yesterday, Earlier (Req 47)
  const groupedNotifications = useMemo(() => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    notifications.forEach((item) => {
      const itemTime = new Date(item.date).getTime();
      if (itemTime >= todayStart) {
        today.push(item);
      } else if (itemTime >= yesterdayStart) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Earlier', items: earlier },
    ].filter((group) => group.items.length > 0);
  }, [notifications]);

  // Handle Deep Links (Req 46)
  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationRead(item.id);

    if (item.type === 'APP_UPDATE') {
      if (updateStatus === 'UPDATE_AVAILABLE') {
        setIsUpdateModalOpen(true);
      } else {
        setCurrentView('settings');
      }
    } else if (item.type === 'BUDGET_ALERT') {
      setCurrentView('budgets');
    } else if (item.type === 'RECURRING_REMINDER') {
      setCurrentView('recurring');
    } else if (item.type === 'DAILY_REMINDER') {
      setIsAddTransactionOpen(true);
    } else if (item.type === 'SUMMARY') {
      setCurrentView('analytics');
    } else {
      setCurrentView('dashboard');
    }
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Banner */}
        <GlassCard elevated style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px 24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Notifications & Alerts</h2>
              {unreadCount > 0 && (
                <span className="badge badge-cyan" style={{ fontSize: '0.74rem', padding: '2px 8px' }}>
                  {unreadCount} UNREAD
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              Financial insights, budget limits, bill reminders, and app update alerts.
            </span>
          </div>

          {notifications.length > 0 && (
            <button onClick={clearNotifications} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
              <Trash2 size={15} /> Clear All
            </button>
          )}
        </GlassCard>

        {/* Feed / Empty State (Req 49) */}
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={26} />}
            title="You're all caught up"
            description="Budget alerts, reminders, updates and useful financial insights will appear here when available."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {groupedNotifications.map((group) => (
              <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>
                  {group.label} ({group.items.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {group.items.map((n) => {
                    let icon = <Info size={18} color="var(--accent-blue)" />;
                    if (n.type === 'BUDGET_ALERT') icon = <AlertTriangle size={18} color="var(--status-danger)" />;
                    if (n.type === 'RECURRING_REMINDER') icon = <Calendar size={18} color="var(--status-warning)" />;
                    if (n.type === 'APP_UPDATE') icon = <SpendlyLogo type="icon" size={20} />;

                    return (
                      <GlassCard
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '14px',
                          flexWrap: 'wrap',
                          backgroundColor: n.isRead ? 'var(--bg-solid-dark)' : 'rgba(32, 196, 232, 0.05)',
                          borderColor: n.isRead ? 'var(--border-color)' : 'var(--accent-cyan-border)',
                          cursor: 'pointer',
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: '1 1 240px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: 'var(--bg-main)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {icon}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</h4>
                              {!n.isRead && <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />}
                            </div>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                              {n.message}
                            </p>
                            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                              {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleNotificationClick(n)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>Open</span> <ArrowUpRight size={13} />
                          </button>

                          {!n.isRead && (
                            <button
                              onClick={() => markNotificationRead(n.id)}
                              className="btn-icon"
                              title="Mark Read"
                              style={{ padding: '6px', color: 'var(--text-muted)' }}
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};
