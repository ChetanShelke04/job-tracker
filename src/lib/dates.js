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

export function addDays(days, fromDate = null) {
  const d = fromDate ? new Date(fromDate) : new Date();
  d.setDate(d.getDate() + Number(days));
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

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, p1, p2, year] = dmyMatch;
    // Default to DD/MM/YYYY if p1 <= 31
    const day = String(p1).padStart(2, '0');
    const month = String(p2).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

