export function escapeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const raw = String(val);
  const str = /^[=+\-@]/.test(raw.trimStart()) ? `'${raw}` : raw;
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Basic CSV parser supporting quoted strings and multiline cells.
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let entry = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          entry += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        entry += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(entry.trim());
        entry = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(entry.trim());
        if (row.some((cell) => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        entry = '';
      } else {
        entry += char;
      }
    }
  }

  if (entry.length > 0 || row.length > 0) {
    row.push(entry.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}
