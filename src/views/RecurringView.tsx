import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/ui/GlassCard';
import { EmptyState } from '../components/ui/EmptyState';
import type { RecurringPayment } from '../types/finance';
import {
  Plus,
  Pause,
  Play,
  Trash2,
  Calendar,
  Bell,
  Clock,
  Pencil,
  AlertCircle,
  Tag,
  Check,
} from 'lucide-react';
import { EditRecurringModal } from '../components/forms/EditRecurringModal';

export const RecurringView: React.FC = () => {
  const {
    recurringPayments,
    accounts,
    categories,
    setIsAddRecurringOpen,
    togglePauseRecurring,
    deleteRecurring,
    editRecurring,
    addTransaction,
    settings,
    showToast,
  } = useApp();

  const [filterSection, setFilterSection] = useState<'ALL' | 'UPCOMING' | 'PAUSED'>('ALL');
  const [editingReminder, setEditingReminder] = useState<RecurringPayment | null>(null);
  const [paidHistory, setPaidHistory] = useState<Set<string>>(new Set());

  // Calculate summary metrics
  const totalActiveMonthly = useMemo(() => {
    return recurringPayments
      .filter((r) => !r.isPaused)
      .reduce((sum, r) => {
        if (r.frequency === 'DAILY') return sum + r.amount * 30;
        if (r.frequency === 'WEEKLY') return sum + r.amount * 4.3;
        if (r.frequency === 'YEARLY') return sum + r.amount / 12;
        return sum + r.amount; // Monthly or Once
      }, 0);
  }, [recurringPayments]);

  const activeCount = useMemo(() => recurringPayments.filter((r) => !r.isPaused).length, [recurringPayments]);
  const pausedCount = useMemo(() => recurringPayments.filter((r) => r.isPaused).length, [recurringPayments]);

  // Group reminders by due timing
  const groupedReminders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date().getTime();

    const todayList: RecurringPayment[] = [];
    const thisWeekList: RecurringPayment[] = [];
    const laterList: RecurringPayment[] = [];
    const pausedList: RecurringPayment[] = [];

    recurringPayments.forEach((r) => {
      if (r.isPaused) {
        pausedList.push(r);
        return;
      }

      if (r.nextDueDate === todayStr) {
        todayList.push(r);
      } else {
        const dueDate = new Date(r.nextDueDate).getTime();
        const diffDays = (dueDate - now) / 86400000;
        if (diffDays >= 0 && diffDays <= 7) {
          thisWeekList.push(r);
        } else {
          laterList.push(r);
        }
      }
    });

    return { todayList, thisWeekList, laterList, pausedList };
  }, [recurringPayments]);

  // Action: Mark as Paid
  const handleMarkAsPaid = (reminder: RecurringPayment) => {
    const paidKey = `${reminder.id}_${reminder.nextDueDate}`;
    if (paidHistory.has(paidKey)) {
      showToast(`Reminder "${reminder.title}" was already marked as paid!`, 'warning');
      return;
    }

    // 1. Create corresponding expense transaction
    addTransaction({
      type: 'EXPENSE',
      amount: reminder.amount,
      accountId: reminder.accountId,
      categoryId: reminder.categoryId,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      note: `Bill Paid: ${reminder.title}`,
      paymentMethod: 'UPI',
    });

    // 2. Advance next due date based on frequency
    const current = new Date(reminder.nextDueDate);
    if (reminder.frequency === 'DAILY') current.setDate(current.getDate() + 1);
    else if (reminder.frequency === 'WEEKLY') current.setDate(current.getDate() + 7);
    else if (reminder.frequency === 'YEARLY') current.setFullYear(current.getFullYear() + 1);
    else current.setMonth(current.getMonth() + 1); // Monthly / Once

    const nextDueDateStr = current.toISOString().slice(0, 10);

    editRecurring(reminder.id, {
      ...reminder,
      nextDueDate: nextDueDateStr,
    });

    setPaidHistory((prev) => new Set(prev).add(paidKey));
    showToast(`Marked "${reminder.title}" as paid & added expense transaction ₹${reminder.amount.toLocaleString()}`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Reminders Top Hero Banner */}
      <div className="card-level-3 hero-emerald-glow" style={{ padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={24} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Bill & Payment Reminders
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Never miss house rent, mobile recharge, electricity, OTT subscriptions, or EMI deadlines.
          </p>
        </div>

        <button onClick={() => setIsAddRecurringOpen(true)} className="btn btn-primary" style={{ padding: '11px 22px' }}>
          <Plus size={18} /> Add Reminder
        </button>
      </div>

      {/* 2. Reminders Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card-level-2" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            ESTIMATED MONTHLY DUES
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }} className="tabular-nums">
            {settings.hideBalances ? '₹•••••' : `₹${Math.round(totalActiveMonthly).toLocaleString()}`}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Sum of active recurring bills</span>
        </div>

        <div className="card-level-2" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            ACTIVE REMINDERS
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {activeCount}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Notifications active</span>
        </div>

        <div className="card-level-2" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            PAUSED REMINDERS
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '4px' }}>
            {pausedCount}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Temporarily muted</span>
        </div>
      </div>

      {/* 3. Section Filter Pills */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'ALL', label: `All Reminders (${recurringPayments.length})` },
          { id: 'UPCOMING', label: `Upcoming (${activeCount})` },
          { id: 'PAUSED', label: `Paused (${pausedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterSection(tab.id as any)}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: filterSection === tab.id ? 'var(--accent-violet)' : 'var(--bg-surface)',
              color: filterSection === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${filterSection === tab.id ? 'transparent' : 'var(--border-color)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Reminders Grid List */}
      {recurringPayments.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} color="var(--accent-cyan)" />}
          title="No Bill Reminders Set"
          description="Add scheduled bill reminders for Netflix, Rent, Electricity, Credit Cards or Insurance to get automatic notifications before due dates."
          actionText="Add Reminder"
          onAction={() => setIsAddRecurringOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TODAY SECTION */}
          {(filterSection === 'ALL' || filterSection === 'UPCOMING') && groupedReminders.todayList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertCircle size={18} color="var(--status-danger)" />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--status-danger)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Due Today ({groupedReminders.todayList.length})
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {groupedReminders.todayList.map((item) => renderReminderCard(item))}
              </div>
            </div>
          )}

          {/* THIS WEEK SECTION */}
          {(filterSection === 'ALL' || filterSection === 'UPCOMING') && groupedReminders.thisWeekList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={18} color="#F59E0B" />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Due This Week ({groupedReminders.thisWeekList.length})
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {groupedReminders.thisWeekList.map((item) => renderReminderCard(item))}
              </div>
            </div>
          )}

          {/* LATER SECTION */}
          {(filterSection === 'ALL' || filterSection === 'UPCOMING') && groupedReminders.laterList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Calendar size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Upcoming Later ({groupedReminders.laterList.length})
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {groupedReminders.laterList.map((item) => renderReminderCard(item))}
              </div>
            </div>
          )}

          {/* PAUSED SECTION */}
          {(filterSection === 'ALL' || filterSection === 'PAUSED') && groupedReminders.pausedList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Pause size={18} color="var(--text-muted)" />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Paused Reminders ({groupedReminders.pausedList.length})
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {groupedReminders.pausedList.map((item) => renderReminderCard(item))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Reminder Modal */}
      <EditRecurringModal
        isOpen={Boolean(editingReminder)}
        onClose={() => setEditingReminder(null)}
        reminder={editingReminder}
      />
    </div>
  );

  // Helper render card for each reminder
  function renderReminderCard(item: RecurringPayment) {
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
          padding: '20px',
          opacity: item.isPaused ? 0.65 : 1,
          border: item.isPaused ? '1px solid var(--border-color)' : '1px solid var(--border-strong)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.title}</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={13} color="var(--accent-lavender)" />
              {cat?.name || 'Bill'} • {acc?.name || 'Account'}
            </span>
          </div>

          <span className={item.isPaused ? 'badge badge-neutral' : 'badge badge-emerald'}>
            {item.isPaused ? 'PAUSED' : item.frequency}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Amount Due
          </span>
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', display: 'block' }} className="tabular-nums">
            {settings.hideBalances ? '₹•••••' : `₹${item.amount.toLocaleString()}`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            <span>Due: {item.nextDueDate}{item.dueTime ? ` at ${item.dueTime}` : ''}</span>
          </div>
          {item.reminderDaysBefore !== undefined && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ({item.reminderDaysBefore === 0 ? 'Notify on date' : `${item.reminderDaysBefore}d before`})
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => handleMarkAsPaid(item)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', minHeight: '34px', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 700 }}
          >
            <Check size={14} /> Mark as Paid
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setEditingReminder(item)}
              className="btn-icon"
              title="Edit Reminder"
              style={{ padding: '6px', color: 'var(--text-secondary)' }}
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              onClick={() => togglePauseRecurring(item.id)}
              className="btn-icon"
              title={item.isPaused ? 'Resume Reminder' : 'Pause Reminder'}
              style={{ padding: '6px' }}
            >
              {item.isPaused ? <Play size={15} color="var(--accent-emerald)" /> : <Pause size={15} color="var(--text-muted)" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete reminder "${item.title}"?`)) {
                  deleteRecurring(item.id);
                }
              }}
              className="btn-icon"
              title="Delete Reminder"
              style={{ padding: '6px', color: 'var(--status-danger)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </GlassCard>
    );
  }
};
