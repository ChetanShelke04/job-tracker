import Papa from 'papaparse';
import { parseFlexibleDate } from './dates';
import { STATUSES, OUTCOMES } from './constants';

/**
 * Normalizes any phone string to the rightmost 10 digits
 */
export function getPhoneKey(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Parse an incoming file (CSV or JSON) and prepare it for preview and import.
 * Supports:
 * 1. Standard CSV with contact columns
 * 2. Standard JSON backup { version, contacts, calls, applications }
 * 3. Legacy HTML Tracker JSON backup { schemaVersion, contacts, calls, activities }
 */
export async function parseImportFile(file, existingContacts = []) {
  const text = await file.text();
  const fileName = file.name.toLowerCase();

  // Create a fast lookup set of existing contact phone keys for duplicate checking
  const existingKeys = new Set();
  existingContacts.forEach(c => {
    const k = getPhoneKey(c.phone);
    if (k) existingKeys.add(k);
  });

  if (fileName.endsWith('.json')) {
    return parseJsonData(text, existingKeys);
  } else if (fileName.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
    return parseCsvData(text, existingKeys);
  } else {
    throw new Error('Unsupported file format. Please upload a .csv or .json file.');
  }
}

/**
 * Parses and normalizes CSV data
 */
function parseCsvData(csvText, existingKeys) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim().toLowerCase().replace(/[\s_-]+/g, '')
  });

  if (parsed.errors && parsed.errors.length > 0 && !parsed.data.length) {
    throw new Error('Could not parse CSV file. Please verify the file formatting.');
  }

  const rawRows = parsed.data;
  return processContactRows(rawRows, existingKeys, 'csv');
}

/**
 * Parses and normalizes JSON data (new or legacy backup)
 */
function parseJsonData(jsonText, existingKeys) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('Invalid JSON file. Please ensure this is a valid Job Tracker backup file.');
  }

  // Handle wrapped structures like { data: { contacts: [] } }
  const root = parsed.data || parsed;
  const rawContacts = Array.isArray(root.contacts) ? root.contacts : [];
  const rawCalls = Array.isArray(root.calls) ? root.calls : [];
  const rawApplications = Array.isArray(root.applications || root.job_applications)
    ? (root.applications || root.job_applications)
    : [];

  const contactResult = processContactRows(rawContacts, existingKeys, 'json');

  // Prepare call records with mapping to old contact IDs
  const validCalls = [];
  rawCalls.forEach(call => {
    const oldContactId = call.contactId || call.contact_id;
    const outcome = OUTCOMES.includes(call.outcome) ? call.outcome : 'Connected';
    const notes = call.notes || '';
    const followupDate = parseFlexibleDate(call.followup || call.followup_date);
    const calledAt = call.dateTime || call.called_at || call.call_date || new Date().toISOString();

    if (oldContactId) {
      validCalls.push({
        oldContactId: String(oldContactId),
        outcome,
        notes,
        followup_date: followupDate,
        called_at: calledAt
      });
    }
  });

  return {
    ...contactResult,
    pendingCalls: validCalls,
    pendingApplications: rawApplications
  };
}

/**
 * Helper to process and categorize contact rows into valid, duplicate, and invalid
 */
function processContactRows(rows, existingKeys, source = 'csv') {
  const validRows = [];
  const duplicateRows = [];
  const invalidRows = [];
  const seenInBatch = new Set();

  rows.forEach((row, index) => {
    const rowNum = index + 1;
    // Map various possible column names from different tracker versions
    const name = String(row.name || row.hrname || row.recruitername || '').trim();
    const company = String(row.company || row.companyname || '').trim();
    const phone = String(row.phone || row.phonenumber || row.mobile || '').trim();
    const email = String(row.email || row.mail || '').trim() || null;
    const rawStatus = row.status || 'Not Called';
    const status = STATUSES.includes(rawStatus) ? rawStatus : 'Not Called';
    const followupDate = parseFlexibleDate(row.followupdate || row.followup || row.nextfollowupdate);
    const interviewDate = parseFlexibleDate(row.interviewdate || row.interview || row.interviewat);
    const nextAction = String(row.nextaction || row.suggestednextaction || '').trim() || null;
    const notes = String(row.notes || row.discussionnotes || '').trim() || null;
    const oldId = String(row.id || '');

    // Validation checks
    const reasons = [];
    if (!name) reasons.push('Missing Name');
    if (!company) reasons.push('Missing Company');
    if (!phone) {
      reasons.push('Missing Phone Number');
    } else {
      const pKey = getPhoneKey(phone);
      if (pKey.length < 6) {
        reasons.push('Phone number has fewer than 6 digits');
      }
    }

    if (reasons.length > 0) {
      invalidRows.push({
        rowNum,
        name: name || '—',
        company: company || '—',
        phone: phone || '—',
        status,
        reason: reasons.join(', ')
      });
      return;
    }

    const phoneKey = getPhoneKey(phone);

    // Check duplicate in database
    if (existingKeys.has(phoneKey)) {
      duplicateRows.push({
        rowNum,
        name,
        company,
        phone,
        status,
        reason: 'Already exists in your database'
      });
      return;
    }

    // Check duplicate within the same uploaded file
    if (seenInBatch.has(phoneKey)) {
      duplicateRows.push({
        rowNum,
        name,
        company,
        phone,
        status,
        reason: 'Duplicate phone number inside this file'
      });
      return;
    }

    seenInBatch.add(phoneKey);

    validRows.push({
      oldId,
      name,
      company,
      phone,
      email,
      status,
      followup_date: followupDate,
      interview_date: interviewDate,
      next_action: nextAction,
      notes
    });
  });

  return {
    totalRows: rows.length,
    validRows,
    duplicateRows,
    invalidRows,
    pendingCalls: [],
    pendingApplications: []
  };
}

/**
 * Splits array into chunks of specified size
 */
export function chunkArray(arr, chunkSize = 200) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

