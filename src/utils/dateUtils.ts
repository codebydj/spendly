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
