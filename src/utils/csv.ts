export function escapeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const raw = String(val);
  const str = /^[=+\-@]/.test(raw.trimStart()) ? `'${raw}` : raw;
  return `"${str.replace(/"/g, '""')}"`;
}
