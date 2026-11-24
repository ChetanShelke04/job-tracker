/**
 * Date utility functions for Job Tracker
 */

export function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(arg1, arg2 = null) {
  let days, fromDate;
  if (typeof arg1 === 'string' && arg2 !== null && !isNaN(Number(arg2))) {
    // addDays('2026-11-24', 3)
    fromDate = arg1;
    days = Number(arg2);
  } else {
    // addDays(3, '2026-11-24') or addDays(3)
    days = Number(arg1) || 0;
    fromDate = arg2;
  }

  let d;
  if (fromDate) {
    // If format is YYYY-MM-DD, append T12:00:00 to prevent UTC midnight timezone shifts
    const str = String(fromDate).slice(0, 10);
    d = new Date(str.length === 10 ? str + 'T12:00:00' : fromDate);
  } else {
    d = new Date();
  }
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(val) {
  if (!val) return '—';
  // If YYYY-MM-DD format, append T12:00:00 to avoid UTC timezone day shifts
  const d = new Date(val.length === 10 ? val + 'T12:00:00' : val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = todayISO();
  // Compare strings YYYY-MM-DD directly
  return dateStr.slice(0, 10) < today;
}

export function isDueToday(dateStr) {
  if (!dateStr) return false;
  return dateStr.slice(0, 10) === todayISO();
}

export function getOverdueDays(dateStr) {
  if (!dateStr) return 0;
  const today = new Date(todayISO() + 'T00:00:00');
  const target = new Date(dateStr.slice(0, 10) + 'T00:00:00');
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Parses flexible dates from CSV or JSON import
 * Supports: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, and ISO strings
 */
export function parseFlexibleDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  // ISO with timestamp: YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    return s.slice(0, 10);
  }

  // DD/MM/YYYY, MM/DD/YYYY, or with dashes
  const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, p1, p2, year] = dmyMatch;
    const n1 = Number(p1);
    const n2 = Number(p2);

    let day, month;
    if (n1 > 12 && n2 <= 12) {
      // Clearly DD/MM/YYYY (e.g. 25/05/2024)
      day = String(n1).padStart(2, '0');
      month = String(n2).padStart(2, '0');
    } else if (n2 > 12 && n1 <= 12) {
      // Clearly MM/DD/YYYY (e.g. 05/25/2024)
      month = String(n1).padStart(2, '0');
      day = String(n2).padStart(2, '0');
    } else {
      // Ambiguous (e.g. 04/05/2024): default to DD/MM/YYYY
      day = String(n1).padStart(2, '0');
      month = String(n2).padStart(2, '0');
    }

    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // Try standard Date parsing
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

