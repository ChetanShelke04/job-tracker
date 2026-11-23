import React, { useState } from 'react';
import { useContacts } from '../../context/ContactsContext';
import { STATUSES } from '../../lib/constants';
import { getPhoneKey } from '../../lib/importer';
import Papa from 'papaparse';
import { X, Plus, Trash2, Clipboard, FileUp, Check } from 'lucide-react';

export default function BulkModal({ isOpen, onClose }) {
  const { bulkAddContacts, contacts } = useContacts();

  const emptyRow = () => ({
    name: '',
    company: '',
    phone: '',
    status: 'Not Called',
    notes: ''
  });

  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    setRows(prev => [...prev, emptyRow()]);
  };

  const addFiveRows = () => {
    setRows(prev => [...prev, emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  };

  const removeRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // Parse pasted spreadsheet data (tab-separated or comma-separated)
  const applyPastedData = () => {
    if (!pasteText.trim()) return;

    // Use PapaParse to parse TSV or CSV
    const parsed = Papa.parse(pasteText.trim(), {
      delimiter: pasteText.includes('\t') ? '\t' : undefined,
      skipEmptyLines: true
    });

    if (parsed.data && parsed.data.length > 0) {
      const newRows = parsed.data.map(line => {
        const name = (line[0] || '').trim();
        const company = (line[1] || '').trim();
        const phone = (line[2] || '').trim();
        const rawStatus = (line[3] || '').trim();
        const status = STATUSES.includes(rawStatus) ? rawStatus : 'Not Called';
        const notes = (line[4] || '').trim();

        return { name, company, phone, status, notes };
      });

      setRows(prev => [...prev.filter(r => r.name || r.company || r.phone), ...newRows]);
      setPasteText('');
      setPasteMode(false);
    }
  };

  // Load from CSV file into bulk rows
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const importedRows = results.data.map(r => {
          const name = (r.name || r.hr_name || r.hrname || '').trim();
          const company = (r.company || r.company_name || '').trim();
          const phone = (r.phone || r.mobile || '').trim();
          const rawStatus = (r.status || '').trim();
          const status = STATUSES.includes(rawStatus) ? rawStatus : 'Not Called';
          const notes = (r.notes || '').trim();
          return { name, company, phone, status, notes };
        }).filter(r => r.name || r.company || r.phone);

        if (importedRows.length > 0) {
          setRows(prev => [...prev.filter(x => x.name || x.company || x.phone), ...importedRows]);
        }
      }
    });

    e.target.value = '';
  };

  const handleSaveAll = async () => {
    setError('');
    const existingKeys = new Set(contacts.map(c => getPhoneKey(c.phone)).filter(Boolean));
    const seenInBatch = new Set();
    const toInsert = [];

    // Filter valid rows
    for (const row of rows) {
      const name = (row.name || '').trim();
      const company = (row.company || '').trim();
      const phone = (row.phone || '').trim();

      if (!name && !company && !phone) continue; // skip blank row

      if (!name || !company || !phone) {
        setError('Every non-empty row must include Name, Company, and Phone.');
        return;
      }

      const pKey = getPhoneKey(phone);
      if (pKey.length < 6) {
        setError(`Phone "${phone}" is too short (must have at least 6 digits).`);
        return;
      }

      // Check duplicate
      if (existingKeys.has(pKey) || seenInBatch.has(pKey)) {
        // Skip duplicate silently as requested in prompt: "skipping duplicates"
        continue;
      }

      seenInBatch.add(pKey);
      toInsert.push({
        name,
        company,
        phone,
        status: STATUSES.includes(row.status) ? row.status : 'Not Called',
        notes: (row.notes || '').trim() || null
      });
    }

    if (toInsert.length === 0) {
      setError('No new valid contacts found (empty or duplicate rows were ignored).');
      return;
    }

    setSaving(true);
    try {
      await bulkAddContacts(toInsert);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save contacts.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Bulk Add Contacts</h3>
            <p>Paste multiple HR contacts from spreadsheets or enter them row-by-row</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: '#ffebe9',
              color: '#b42318',
              border: '1px solid #fecdca',
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '14px',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          {/* Bulk Action Toolbar */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '14px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <button type="button" className="btn btn-sm" onClick={addRow}>
              <Plus size={14} /> Add 1 Row
            </button>
            <button type="button" className="btn btn-sm" onClick={addFiveRows}>
              <Plus size={14} /> Add 5 Rows
            </button>
            <button
              type="button"
              className={`btn btn-sm ${pasteMode ? 'btn-primary' : ''}`}
              onClick={() => setPasteMode(prev => !prev)}
            >
              <Clipboard size={14} /> Paste from Sheets / Excel
            </button>
            <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
              <FileUp size={14} /> Import CSV into Rows
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCsvUpload}
              />
            </label>
          </div>

          {/* Paste Input Container */}
          {pasteMode && (
            <div style={{
              background: '#f8faff',
              border: '1px solid #dfe6f0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <p style={{ fontSize: '12px', color: '#66748b', marginBottom: '8px' }}>
                Copy columns (HR Name, Company, Phone, Status, Notes) from Excel or Google Sheets and paste below:
              </p>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Priya Sharma [TAB] Acme Corp [TAB] 9876543210 [TAB] Connected [TAB] Referred by Rahul"
                style={{ width: '100%', marginBottom: '8px' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={applyPastedData}
              >
                <Check size={14} /> Parse & Add into Table
              </button>
            </div>
          )}

          {/* Bulk Table */}
          <div className="table-container" style={{ maxHeight: '48vh', border: '1px solid #dfe6f0', borderRadius: '8px' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>HR Name *</th>
                  <th>Company *</th>
                  <th>Phone *</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                    <td>
                      <input
                        type="text"
                        placeholder="HR Name"
                        value={row.name}
                        onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Company"
                        value={row.company}
                        onChange={(e) => handleRowChange(idx, 'company', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={row.phone}
                        onChange={(e) => handleRowChange(idx, 'phone', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                      <select
                        value={row.status}
                        onChange={(e) => handleRowChange(idx, 'status', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Notes"
                        value={row.notes}
                        onChange={(e) => handleRowChange(idx, 'notes', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-icon"
                        onClick={() => removeRow(idx)}
                        style={{ border: 'none', color: '#94a3b8' }}
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '11px', color: '#66748b', marginTop: '8px' }}>
            Blank rows are ignored. Any phone numbers already present in your contacts will be skipped automatically.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? 'Saving Contacts…' : 'Save All Contacts'}
          </button>
        </div>
      </div>
    </div>
  );
}

