import React from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/ui/GlassCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Pause, Play, Trash2, Calendar, Repeat } from 'lucide-react';

export const RecurringView: React.FC = () => {
  const {
    recurringPayments,
    accounts,
    categories,
    setIsAddRecurringOpen,
    togglePauseRecurring,
    deleteRecurring,
    settings,
  } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <GlassCard elevated style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            RECURRING PAYMENTS & SUBSCRIPTIONS
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
            Scheduled Bills & Obligations
          </h2>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Track recurring house rent, utility bills, and digital subscriptions.
          </span>
        </div>

        <button onClick={() => setIsAddRecurringOpen(true)} className="btn btn-primary" style={{ padding: '11px 20px' }}>
          <Plus size={18} /> Add Recurring Payment
        </button>
      </GlassCard>

      {/* List / Empty State */}
      {recurringPayments.length === 0 ? (
        <EmptyState
          icon={<Repeat size={24} />}
          title="No Recurring Bills Configured"
          description="Add scheduled payments for Netflix, Rent, Electricity, or Insurance to view upcoming due dates in your calendar and receive notifications."
          actionText="Add Recurring Payment"
          onAction={() => setIsAddRecurringOpen(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {recurringPayments.map((item) => {
            const acc = accounts.find((a) => a.id === item.accountId);
            const cat = categories.find((c) => c.id === item.categoryId);

            return (
              <GlassCard
                key={item.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  opacity: item.isPaused ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                      {cat?.name || 'Category'} • {acc?.name || 'Account'}
                    </span>
                  </div>

                  <span className={item.isPaused ? 'badge badge-neutral' : 'badge badge-emerald'}>
                    {item.isPaused ? 'PAUSED' : item.frequency}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled Amount</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', display: 'block' }} className="tabular-nums">
                    {settings.hideBalances ? '₹•••••' : `₹${item.amount.toLocaleString()}`}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-glass)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    <Calendar size={14} />
                    <span>Next due: {item.nextDueDate}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => togglePauseRecurring(item.id)}
                      className="btn-icon"
                      title={item.isPaused ? 'Resume payment' : 'Pause payment'}
                    >
                      {item.isPaused ? <Play size={16} color="var(--accent-emerald)" /> : <Pause size={16} />}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove recurring payment "${item.title}"?`)) {
                          deleteRecurring(item.id);
                        }
                      }}
                      className="btn-icon"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete rule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
