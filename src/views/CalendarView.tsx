import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/ui/GlassCard';
import { TransactionRow } from '../components/ui/TransactionRow';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { transactions, accounts, categories, settings, setIsAddTransactionOpen } = useApp();

  const [currentDateObj, setCurrentDateObj] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const year = currentDateObj.getFullYear();
  const month = currentDateObj.getMonth();
  const monthName = currentDateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTxs = transactions.filter((t) => t.date === dateStr);
    const dayIncome = dayTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const dayExpense = dayTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return {
      day: d,
      dateStr,
      txCount: dayTxs.length,
      dayIncome,
      dayExpense,
    };
  });

  const selectedDateTxs = transactions.filter((t) => t.date === selectedDate);
  const selectedDayIncome = selectedDateTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const selectedDayExpense = selectedDateTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const selectedDayTransfer = selectedDateTxs.filter((t) => t.type === 'TRANSFER').reduce((s, t) => s + t.amount, 0);

  const prevMonth = () => {
    setCurrentDateObj(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDateObj(new Date(year, month + 1, 1));
  };

  const handleTodayClick = () => {
    const now = new Date();
    setCurrentDateObj(now);
    setSelectedDate(now.toISOString().slice(0, 10));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Calendar Header */}
      <GlassCard elevated style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-lavender)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            FINANCIAL CALENDAR
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>{monthName}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={handleTodayClick} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            <CalendarIcon size={14} color="var(--accent-cyan)" /> Today
          </button>
          <button onClick={prevMonth} className="btn-icon btn-secondary" title="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, minWidth: '120px', textAlign: 'center', color: 'var(--text-primary)' }}>{monthName}</span>
          <button onClick={nextMonth} className="btn-icon btn-secondary" title="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'flex-start' }}>
        {/* Calendar Grid Card - Controlled Height */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', height: 'fit-content', alignSelf: 'flex-start' }}>
          {/* Days of week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-lavender)' }}>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ minHeight: '48px' }} />
            ))}

            {daysArray.map((dayObj) => {
              const isSelected = dayObj.dateStr === selectedDate;
              const hasActivity = dayObj.txCount > 0;

              return (
                <div
                  key={dayObj.dateStr}
                  onClick={() => setSelectedDate(dayObj.dateStr)}
                  style={{
                    minHeight: '48px',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected
                      ? 'rgba(139, 92, 246, 0.22)'
                      : hasActivity
                      ? 'rgba(27, 32, 66, 0.65)'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid var(--accent-violet)'
                      : hasActivity
                      ? '1px solid var(--border-glass)'
                      : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: isSelected || hasActivity ? 700 : 400,
                      color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    }}
                  >
                    {dayObj.day}
                  </span>

                  {hasActivity && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                      {dayObj.dayIncome > 0 && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', boxShadow: '0 0 4px var(--accent-cyan)' }} title={`Income: ₹${dayObj.dayIncome}`} />
                      )}
                      {dayObj.dayExpense > 0 && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-expense)', boxShadow: '0 0 4px var(--status-expense)' }} title={`Expense: ₹${dayObj.dayExpense}`} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Selected Date Breakdown Panel - Independently Scrollable */}
        <GlassCard elevated style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '620px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-lavender)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>SELECTED DATE</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </h3>
            </div>
            <button
              onClick={() => setIsAddTransactionOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', minHeight: '32px' }}
            >
              <Plus size={14} color="var(--accent-cyan)" /> Add entry
            </button>
          </div>

          {/* Summary Strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '12px 14px', backgroundColor: 'rgba(15, 19, 42, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div style={{ flex: '1 1 80px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Income</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${selectedDayIncome.toLocaleString()}`}
              </span>
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Expenses</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--status-expense)', display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${selectedDayExpense.toLocaleString()}`}
              </span>
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Transfers</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${selectedDayTransfer.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Transactions List for Date - Independent Scroll */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
            {selectedDateTxs.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No activity recorded on this date.
              </div>
            ) : (
              selectedDateTxs.map((tx) => {
                const acc = accounts.find((a) => a.id === tx.accountId);
                const toAcc = accounts.find((a) => a.id === tx.toAccountId);
                const cat = categories.find((c) => c.id === tx.categoryId);

                return (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    account={acc}
                    toAccount={toAcc}
                    category={cat}
                    hideBalances={settings.hideBalances}
                  />
                );
              })
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
