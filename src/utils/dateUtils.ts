/**
 * Formats time string (HH:mm, e.g. '14:30') to 12-hour or 24-hour format based on user setting.
 * 12-hour: '02:30 PM', '09:05 AM'
 * 24-hour: '14:30', '09:05'
 */
export function formatDisplayTime(timeStr?: string, timeFormat: '12' | '24' = '12'): string {
  if (!timeStr) return '';

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];

  if (timeFormat === '24') {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${minutes}`;
  }

  // 12-hour format with AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hh = hours.toString().padStart(2, '0');

  return `${hh}:${minutes} ${period}`;
}

/**
 * Safely calculates the next due date string (YYYY-MM-DD) for recurring payments,
 * properly handling end-of-month dates (e.g. Jan 31 -> Feb 28/29), leap years, and custom day snoozing.
 */
export function advanceRecurringDueDate(
  currentDueDateStr: string,
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  daysOffset: number = 0
): string {
  const [yearStr, monthStr, dayStr] = (currentDueDateStr || '').split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10); // 1-12
  let day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    const fallback = new Date();
    return fallback.toISOString().slice(0, 10);
  }

  if (daysOffset !== 0) {
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + daysOffset);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (frequency === 'DAILY') {
    const dateObj = new Date(year, month - 1, day + 1);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (frequency === 'WEEKLY') {
    const dateObj = new Date(year, month - 1, day + 7);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (frequency === 'MONTHLY') {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const maxDaysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
    const nextDay = Math.min(day, maxDaysInNextMonth);

    const m = String(nextMonth).padStart(2, '0');
    const d = String(nextDay).padStart(2, '0');
    return `${nextYear}-${m}-${d}`;
  }

  if (frequency === 'YEARLY') {
    let nextYear = year + 1;
    let nextMonth = month;
    let nextDay = day;

    const maxDaysInMonth = new Date(nextYear, nextMonth, 0).getDate();
    if (nextDay > maxDaysInMonth) {
      nextDay = maxDaysInMonth;
    }

    const m = String(nextMonth).padStart(2, '0');
    const d = String(nextDay).padStart(2, '0');
    return `${nextYear}-${m}-${d}`;
  }

  return currentDueDateStr;
}
