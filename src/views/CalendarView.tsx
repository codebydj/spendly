import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/ui/GlassCard';
import { TransactionRow } from '../components/ui/TransactionRow';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Repeat,
  MapPin,
  Clock,
} from 'lucide-react';
import { formatINRMasked } from '../utils/currency';

type CalendarFilter = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'RECURRING';

export const CalendarView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    recurringPayments,
    settings,
    setIsAddTransactionOpen,
    setCurrentView,
  } = useApp();

  const [currentDateObj, setCurrentDateObj] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [filterType, setFilterType] = useState<CalendarFilter>('ALL');

  const year = currentDateObj.getFullYear();
  const month = currentDateObj.getMonth();
  const monthName = currentDateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Month-wide summary metrics
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthTxs = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(monthPrefix));
  }, [transactions, monthPrefix]);

  const monthIncome = useMemo(
    () => monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  );
  const monthExpenses = useMemo(
    () => monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  );
  const monthNet = monthIncome - monthExpenses;

  // Max daily expense for relative heatmap shading
  const maxDailyExpense = useMemo(() => {
    const expensesByDay: Record<number, number> = {};
    monthTxs.forEach((t) => {
      if (t.type === 'EXPENSE') {
        const dayNum = parseInt(t.date.split('-')[2], 10);
        expensesByDay[dayNum] = (expensesByDay[dayNum] || 0) + t.amount;
      }
    });
    return Math.max(...Object.values(expensesByDay), 1);
  }, [monthTxs]);

  // Compute calendar days
  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTxs = transactions.filter((t) => t.date === dateStr);

      const dayIncome = dayTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const dayExpense = dayTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      const dayTransfer = dayTxs.filter((t) => t.type === 'TRANSFER').reduce((s, t) => s + t.amount, 0);

      // Check for recurring payments due on this day
      const dayRecurring = recurringPayments.filter((r) => !r.isPaused && r.nextDueDate === dateStr);

      // Apply active filter to day count logic
      let filteredTxCount = dayTxs.length;
      if (filterType === 'EXPENSE') filteredTxCount = dayTxs.filter((t) => t.type === 'EXPENSE').length;
      else if (filterType === 'INCOME') filteredTxCount = dayTxs.filter((t) => t.type === 'INCOME').length;
      else if (filterType === 'TRANSFER') filteredTxCount = dayTxs.filter((t) => t.type === 'TRANSFER').length;
      else if (filterType === 'RECURRING') filteredTxCount = dayRecurring.length;

      return {
        day: d,
        dateStr,
        txCount: dayTxs.length,
        filteredTxCount,
        dayIncome,
        dayExpense,
        dayTransfer,
        recurringCount: dayRecurring.length,
      };
    });
  }, [daysInMonth, year, month, transactions, recurringPayments, filterType]);

  // Selected date details
  const selectedDateTxs = useMemo(() => {
    const raw = transactions.filter((t) => t.date === selectedDate);
    if (filterType === 'EXPENSE') return raw.filter((t) => t.type === 'EXPENSE');
    if (filterType === 'INCOME') return raw.filter((t) => t.type === 'INCOME');
    if (filterType === 'TRANSFER') return raw.filter((t) => t.type === 'TRANSFER');
    return raw;
  }, [transactions, selectedDate, filterType]);

  const selectedDayIncome = useMemo(
    () => selectedDateTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
    [selectedDateTxs]
  );
  const selectedDayExpense = useMemo(
    () => selectedDateTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    [selectedDateTxs]
  );
  const selectedDayTransfer = useMemo(
    () => selectedDateTxs.filter((t) => t.type === 'TRANSFER').reduce((s, t) => s + t.amount, 0),
    [selectedDateTxs]
  );

  // Upcoming active recurring payments
  const upcomingRecurring = useMemo(() => {
    return recurringPayments
      .filter((r) => !r.isPaused)
      .sort((a, b) => (a.nextDueDate > b.nextDueDate ? 1 : -1))
      .slice(0, 5);
  }, [recurringPayments]);

  const prevMonth = () => setCurrentDateObj(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDateObj(new Date(year, month + 1, 1));

  const handleTodayClick = () => {
    const now = new Date();
    setCurrentDateObj(now);
    setSelectedDate(now.toISOString().slice(0, 10));
  };

  const handleAddForSelectedDate = () => {
    sessionStorage.setItem('spendly_new_transaction_date', selectedDate);
    setIsAddTransactionOpen(true);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Financial Calendar Header */}
      <GlassCard elevated style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={18} color="var(--accent-blue)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-lavender)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                FINANCIAL CALENDAR
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {monthName}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              See your spending, income, and upcoming payments by date.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleTodayClick}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
            >
              Today
            </button>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(13, 17, 38, 0.6)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', padding: '2px' }}>
              <button onClick={prevMonth} className="btn-icon btn-ghost" title="Previous month" aria-label="Previous month" style={{ width: '32px', height: '32px' }}>
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '110px', textAlign: 'center', color: 'var(--text-primary)' }}>
                {monthName}
              </span>
              <button onClick={nextMonth} className="btn-icon btn-ghost" title="Next month" aria-label="Next month" style={{ width: '32px', height: '32px' }}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Financial Summary Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            backgroundColor: 'rgba(15, 19, 42, 0.65)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-glass)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Income</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'block', marginTop: '2px' }} className="tabular-nums">
              +{formatINRMasked(monthIncome, settings.hideBalances)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spent</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--status-expense)', display: 'block', marginTop: '2px' }} className="tabular-nums">
              -{formatINRMasked(monthExpenses, settings.hideBalances)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Cashflow</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: monthNet >= 0 ? 'var(--accent-cyan)' : 'var(--status-expense)', display: 'block', marginTop: '2px' }} className="tabular-nums">
              {monthNet >= 0 ? '+' : ''}{formatINRMasked(monthNet, settings.hideBalances)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transactions</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>
              {monthTxs.length}
            </span>
          </div>
        </div>

        {/* Filter Pills Header */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {(
            [
              { id: 'ALL', label: 'All Events' },
              { id: 'EXPENSE', label: 'Expenses' },
              { id: 'INCOME', label: 'Income' },
              { id: 'TRANSFER', label: 'Transfers' },
              { id: 'RECURRING', label: 'Upcoming Bills' },
            ] as const
          ).map((filter) => {
            const isActive = filterType === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--accent-blue)' : 'rgba(27, 32, 66, 0.6)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--border-glass)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Main Grid: Calendar View + Selected Date & Upcoming Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px', alignItems: 'flex-start' }}>
        {/* Calendar Grid Card */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', alignSelf: 'flex-start' }}>
          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-lavender)', paddingBottom: '4px' }}>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Cells Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ minHeight: '56px' }} />
            ))}

            {daysArray.map((dayObj) => {
              const isSelected = dayObj.dateStr === selectedDate;
              const isToday = dayObj.dateStr === todayStr;
              const hasActivity = dayObj.filteredTxCount > 0 || (filterType === 'RECURRING' && dayObj.recurringCount > 0);

              // Relative spending intensity shading (heatmap effect)
              const expenseIntensity = dayObj.dayExpense > 0 ? Math.min(dayObj.dayExpense / maxDailyExpense, 1) : 0;
              const heatmapBg = dayObj.dayExpense > 0
                ? `rgba(239, 68, 68, ${0.06 + expenseIntensity * 0.16})`
                : dayObj.dayIncome > 0
                ? 'rgba(32, 196, 232, 0.08)'
                : 'transparent';

              return (
                <button
                  type="button"
                  key={dayObj.dateStr}
                  onClick={() => setSelectedDate(dayObj.dateStr)}
                  aria-label={`${dayObj.dateStr}${hasActivity ? `, ${dayObj.filteredTxCount} activity` : ''}`}
                  aria-pressed={isSelected}
                  style={{
                    minHeight: '56px',
                    padding: '6px 4px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected
                      ? 'rgba(86, 133, 255, 0.24)'
                      : heatmapBg !== 'transparent'
                      ? heatmapBg
                      : 'rgba(19, 26, 52, 0.4)',
                    border: isSelected
                      ? '2px solid var(--accent-blue)'
                      : isToday
                      ? '1px solid var(--accent-cyan)'
                      : hasActivity
                      ? '1px solid var(--border-glass)'
                      : '1px solid rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: isSelected || isToday || hasActivity ? 700 : 400,
                        color: isSelected
                          ? '#FFFFFF'
                          : isToday
                          ? 'var(--accent-cyan)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {dayObj.day}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Daily Net or Dot Indicators */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '2px', marginTop: '2px' }}>
                    {dayObj.dayExpense > 0 && (filterType === 'ALL' || filterType === 'EXPENSE') && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--status-expense)', letterSpacing: '-0.02em' }} className="tabular-nums">
                        -{dayObj.dayExpense >= 1000 ? `${(dayObj.dayExpense / 1000).toFixed(1)}k` : dayObj.dayExpense}
                      </span>
                    )}

                    {dayObj.dayIncome > 0 && (filterType === 'ALL' || filterType === 'INCOME') && dayObj.dayExpense === 0 && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--accent-cyan)', letterSpacing: '-0.02em' }} className="tabular-nums">
                        +{dayObj.dayIncome >= 1000 ? `${(dayObj.dayIncome / 1000).toFixed(1)}k` : dayObj.dayIncome}
                      </span>
                    )}

                    {/* Indicator dots for multiple event types */}
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginTop: '1px' }}>
                      {dayObj.dayIncome > 0 && (
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
                      )}
                      {dayObj.dayExpense > 0 && (
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--status-expense)' }} />
                      )}
                      {dayObj.dayTransfer > 0 && (
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }} />
                      )}
                      {dayObj.recurringCount > 0 && (
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-violet)' }} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Selected Date Breakdown & Upcoming Bills Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Selected Date Detail Card */}
          <GlassCard elevated style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-lavender)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                  SELECTED DATE
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </h3>
              </div>

              <button
                onClick={handleAddForSelectedDate}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
              >
                <Plus size={14} /> Add Transaction
              </button>
            </div>

            {/* Daily Summary Strip */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '10px 14px',
                backgroundColor: 'rgba(15, 19, 42, 0.6)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Income</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'block' }} className="tabular-nums">
                  +{formatINRMasked(selectedDayIncome, settings.hideBalances)}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Spent</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--status-expense)', display: 'block' }} className="tabular-nums">
                  -{formatINRMasked(selectedDayExpense, settings.hideBalances)}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Transfers</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'block' }} className="tabular-nums">
                  {formatINRMasked(selectedDayTransfer, settings.hideBalances)}
                </span>
              </div>
            </div>

            {/* Transaction List for Selected Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '2px' }}>
              {selectedDateTxs.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No {filterType !== 'ALL' ? filterType.toLowerCase() : ''} transactions on this date.
                </div>
              ) : (
                selectedDateTxs.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const toAcc = accounts.find((a) => a.id === tx.toAccountId);
                  const cat = categories.find((c) => c.id === tx.categoryId);

                  return (
                    <div key={tx.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <TransactionRow
                        transaction={tx}
                        account={acc}
                        toAccount={toAcc}
                        category={cat}
                        hideBalances={settings.hideBalances}
                      />
                      {(tx.latitude || tx.locationName) && (
                        <button
                          onClick={() => setCurrentView('maps')}
                          style={{
                            alignSelf: 'flex-end',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            color: 'var(--accent-cyan)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 8px 4px 0',
                          }}
                        >
                          <MapPin size={12} /> View on Map
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>

          {/* Upcoming Recurring Bills Section */}
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Repeat size={16} color="var(--accent-violet)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Upcoming Bills
                </h4>
              </div>
              <button
                onClick={() => setCurrentView('recurring')}
                style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Manage Bills
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingRecurring.length === 0 ? (
                <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No active upcoming recurring payments found.
                </div>
              ) : (
                upcomingRecurring.map((bill) => {
                  const cat = categories.find((c) => c.id === bill.categoryId);
                  return (
                    <div
                      key={bill.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(15, 19, 42, 0.5)',
                        border: '1px solid var(--border-glass)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CategoryIcon categoryName={cat?.name || bill.title} size={16} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {bill.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> Due: {bill.nextDueDate}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--status-expense)' }} className="tabular-nums">
                          -{formatINRMasked(bill.amount, settings.hideBalances)}
                        </span>
                        <span style={{ fontSize: '0.68rem', display: 'block', color: 'var(--text-muted)' }}>
                          {bill.frequency}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
