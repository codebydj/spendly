import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/ui/GlassCard';
import { TransactionRow } from '../components/ui/TransactionRow';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { transactions, accounts, categories, settings } = useApp();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Calendar Header */}
      <GlassCard elevated style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            FINANCIAL CALENDAR
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '2px' }}>{monthName}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={prevMonth} className="btn-icon btn-secondary" title="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, minWidth: '120px', textAlign: 'center' }}>{monthName}</span>
          <button onClick={nextMonth} className="btn-icon btn-secondary" title="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Calendar Grid Card */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Days of week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ height: '56px' }} />
            ))}

            {daysArray.map((dayObj) => {
              const isSelected = dayObj.dateStr === selectedDate;
              const hasActivity = dayObj.txCount > 0;

              return (
                <div
                  key={dayObj.dateStr}
                  onClick={() => setSelectedDate(dayObj.dateStr)}
                  style={{
                    height: '58px',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected
                      ? 'var(--glass-bg-hover)'
                      : hasActivity
                      ? 'var(--bg-main)'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid var(--accent-emerald)'
                      : hasActivity
                      ? '1px solid var(--border-glass)'
                      : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: isSelected || hasActivity ? 700 : 400,
                      color: isSelected ? 'var(--accent-emerald)' : 'var(--text-primary)',
                    }}
                  >
                    {dayObj.day}
                  </span>

                  {hasActivity && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {dayObj.dayIncome > 0 && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
                      )}
                      {dayObj.dayExpense > 0 && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-danger)' }} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Selected Date Breakdown Panel */}
        <GlassCard elevated style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>SELECTED DATE</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {new Date(selectedDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>
          </div>

          {/* Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '14px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Income</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${selectedDayIncome.toLocaleString()}`}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Expenses</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--status-danger)', display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${selectedDayExpense.toLocaleString()}`}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Transfers</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} className="tabular-nums">
                {settings.hideBalances ? '₹•••••' : `₹${selectedDayTransfer.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Transactions List for Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
