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

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const addFiveRows = () => {
    setRows(prev => [...prev, emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  };

  const removeRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const applyPastedData = () => {
    if (!pasteText.trim()) return;

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

    for (const row of rows) {
      const name = (row.name || '').trim();
      const company = (row.company || '').trim();
      const phone = (row.phone || '').trim();

      if (!name && !company && !phone) continue;

      if (!name || !company || !phone) {
        setError('Every non-empty row must include Name, Company, and Phone.');
        return;
      }

      const pKey = getPhoneKey(phone);
      if (pKey.length < 6) {
        setError(`Phone "${phone}" must have at least 6 digits.`);
        return;
      }

      if (existingKeys.has(pKey) || seenInBatch.has(pKey)) {
        continue; // skip duplicate
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
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Bulk Add Contacts</h3>
            <p>Paste multiple HR recruiters from spreadsheets or enter them row-by-row</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '14px',
              fontSize: '12.5px'
            }}>
              {error}
            </div>
          )}

          {/* Action Toolbar */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <button type="button" className="btn btn-sm" onClick={addRow}>
              <Plus size={13} /> Add 1 Row
            </button>
            <button type="button" className="btn btn-sm" onClick={addFiveRows}>
              <Plus size={13} /> Add 5 Rows
            </button>
            <button
              type="button"
              className={`btn btn-sm ${pasteMode ? 'btn-primary' : ''}`}
              onClick={() => setPasteMode(prev => !prev)}
            >
              <Clipboard size={13} /> Paste from Sheets / Excel
            </button>
            <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
              <FileUp size={13} /> Import CSV into Rows
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCsvUpload}
              />
            </label>
          </div>

          {/* Paste Container */}
          {pasteMode && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                Copy columns (HR Name, Company, Phone, Status, Notes) from Excel or Sheets and paste below:
              </p>
              <textarea
                rows={3}
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
                <Check size={13} /> Parse & Add into Table
              </button>
            </div>
          )}

          {/* Table */}
          <div className="table-container" style={{ maxHeight: '46vh', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '38px' }}>#</th>
                  <th>HR Name *</th>
                  <th>Company *</th>
                  <th>Phone *</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th style={{ width: '38px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: '#94a3b8', fontSize: '11.5px' }}>{idx + 1}</td>
                    <td>
                      <input
                        type="text"
                        placeholder="HR Name"
                        value={row.name}
                        onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                        style={{ padding: '5px 8px', fontSize: '12.5px', minHeight: '30px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Company"
                        value={row.company}
                        onChange={(e) => handleRowChange(idx, 'company', e.target.value)}
                        style={{ padding: '5px 8px', fontSize: '12.5px', minHeight: '30px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={row.phone}
                        onChange={(e) => handleRowChange(idx, 'phone', e.target.value)}
                        style={{ padding: '5px 8px', fontSize: '12.5px', minHeight: '30px' }}
                      />
                    </td>
                    <td>
                      <select
                        value={row.status}
                        onChange={(e) => handleRowChange(idx, 'status', e.target.value)}
                        style={{ padding: '5px 8px', fontSize: '12px', minHeight: '30px' }}
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
                        style={{ padding: '5px 8px', fontSize: '12.5px', minHeight: '30px' }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-ghost"
                        onClick={() => removeRow(idx)}
                        style={{ color: '#94a3b8' }}
                        title="Remove row"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '8px' }}>
            Blank rows are ignored. Any duplicate phone numbers are skipped automatically.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
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
