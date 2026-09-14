import React from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/ui/GlassCard';
import { EmptyState } from '../components/ui/EmptyState';
import { AlertTriangle, Calendar, Info, Check, Trash2, Bell } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { notifications, markNotificationRead, clearNotifications } = useApp();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <GlassCard elevated style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Notifications & Alerts</h2>
            {unreadCount > 0 && <span className="badge badge-emerald">{unreadCount} UNREAD</span>}
          </div>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
            System messages, budget threshold warnings, and recurring bill payment reminders.
          </span>
        </div>

        {notifications.length > 0 && (
          <button onClick={clearNotifications} className="btn btn-secondary" style={{ padding: '10px 18px' }}>
            <Trash2 size={16} /> Clear All
          </button>
        )}
      </GlassCard>

      {/* Notifications Feed / Empty State */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} />}
          title="You're All Caught Up"
          description="There are no active notifications or warnings right now. Alerts for budget limits and bill payments will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n) => {
            let icon = <Info size={18} color="var(--accent-blue)" />;
            if (n.type === 'BUDGET_ALERT') icon = <AlertTriangle size={18} color="var(--status-danger)" />;
            if (n.type === 'RECURRING_REMINDER') icon = <Calendar size={18} color="var(--status-warning)" />;

            return (
              <GlassCard
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  backgroundColor: n.isRead ? 'var(--glass-bg)' : 'var(--glass-bg-elevated)',
                  borderColor: n.isRead ? 'var(--border-glass)' : 'var(--accent-emerald-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--border-glass)',
                    }}
                  >
                    {icon}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</h4>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                      {new Date(n.date).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    <Check size={14} /> Mark Read
                  </button>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
