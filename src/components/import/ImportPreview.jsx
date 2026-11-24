import React, { useState } from 'react';
import { supabase, formatSupabaseError } from '../../lib/supabase';
import { chunkArray } from '../../lib/importer';
import { exportToCsv } from '../../lib/csv';
import StatusBadge from '../common/StatusBadge';
import {
  X,
  FileDown,
  DownloadCloud,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

export default function ImportPreview({ isOpen, onClose, previewData, onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInvalidDetails, setShowInvalidDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !previewData) return null;

  const {
    totalRows,
    validRows = [],
    duplicateRows = [],
    invalidRows = [],
    pendingCalls = []
  } = previewData;

  const handleDownloadSkipped = () => {
    const skipped = [
      ...duplicateRows.map(r => ({ ...r, category: 'Duplicate' })),
      ...invalidRows.map(r => ({ ...r, category: 'Invalid' }))
    ];

    if (skipped.length === 0) return;

    exportToCsv(
      `job-tracker-skipped-rows-${new Date().toISOString().slice(0, 10)}.csv`,
      skipped,
      ['category', 'rowNum', 'name', 'company', 'phone', 'reason']
    );
  };

  const handleConfirmImport = async () => {
    if (validRows.length === 0) {
      alert('No valid contacts to import.');
      return;
    }

    setImporting(true);
    setProgress(5);
    setErrorMessage('');

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        throw new Error('Your session has expired or you are not signed in. Please refresh and log in again.');
      }

      const chunks = chunkArray(validRows, 200);
      let importedCount = 0;
      const oldToNewIdMap = new Map();

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const payload = chunk.map(({ oldId, ...rest }) => ({
          ...rest,
          user_id: user.id
        }));

        const { data, error } = await supabase
          .from('contacts')
          .insert(payload)
          .select('id, phone_key');

        if (error) throw error;

        if (data && data.length) {
          chunk.forEach((c, idx) => {
            if (c.oldId && data[idx]) {
              oldToNewIdMap.set(c.oldId, data[idx].id);
            }
          });
        }

        importedCount += chunk.length;
        const currentProgress = Math.round(((i + 1) / chunks.length) * 80);
        setProgress(currentProgress);
      }

      if (pendingCalls.length > 0 && oldToNewIdMap.size > 0) {
        const validCallsToInsert = [];
        pendingCalls.forEach(call => {
          const newContactId = oldToNewIdMap.get(call.oldContactId);
          if (newContactId) {
            validCallsToInsert.push({
              user_id: user.id,
              contact_id: newContactId,
              outcome: call.outcome,
              notes: call.notes,
              followup_date: call.followup_date,
              called_at: call.called_at
            });
          }
        });

        if (validCallsToInsert.length > 0) {
          const callChunks = chunkArray(validCallsToInsert, 200);
          for (let j = 0; j < callChunks.length; j++) {
            const { error: callErr } = await supabase
              .from('calls')
              .insert(callChunks[j]);
            if (callErr) console.warn('Could not import call chunk:', callErr);
          }
        }
      }

      setProgress(100);
      setTimeout(() => {
        setImporting(false);
        onImportComplete(importedCount);
      }, 400);
    } catch (err) {
      console.error('Import failed:', err);
      setErrorMessage(formatSupabaseError(err));
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Import Preview</h3>
            <p>Review detected contacts before saving to Supabase</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-ghost"
            onClick={onClose}
            disabled={importing}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {errorMessage && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '12.5px'
            }}>
              {errorMessage}
            </div>
          )}

          {/* Metric cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <div className="metric-card blue" style={{ padding: '12px' }}>
              <div className="metric-card-label">Total Rows</div>
              <div className="metric-card-value" style={{ fontSize: '22px' }}>{totalRows}</div>
            </div>

            <div className="metric-card emerald" style={{ padding: '12px' }}>
              <div className="metric-card-label">Ready to Import</div>
              <div className="metric-card-value" style={{ fontSize: '22px', color: '#059669' }}>{validRows.length}</div>
            </div>

            <div className="metric-card amber" style={{ padding: '12px' }}>
              <div className="metric-card-label">Duplicates (Skipped)</div>
              <div className="metric-card-value" style={{ fontSize: '22px', color: '#d97706' }}>{duplicateRows.length}</div>
            </div>

            <div className="metric-card red" style={{ padding: '12px' }}>
              <div className="metric-card-label">Invalid Rows</div>
              <div className="metric-card-value" style={{ fontSize: '22px', color: '#dc2626' }}>{invalidRows.length}</div>
            </div>
          </div>

          {/* Progress bar when importing */}
          {importing && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '6px',
                fontWeight: 600
              }}>
                <span>Inserting records in chunks of 200…</span>
                <span>{progress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#2563eb',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {/* Preview Table of First 20 Rows */}
          <div style={{ marginBottom: '14px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Preview (Showing first {Math.min(20, validRows.length)} valid rows):
            </h4>
            <div className="table-container" style={{ maxHeight: '30vh', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>HR Name</th>
                    <th>Company</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.company}</td>
                      <td>{r.phone}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td style={{ color: '#64748b' }}>{r.next_action || '—'}</td>
                    </tr>
                  ))}
                  {validRows.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        No valid new rows found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invalid Rows Accordion */}
          {invalidRows.length > 0 && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setShowInvalidDetails(prev => !prev)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, color: '#92400e' }}>
                  <AlertTriangle size={15} />
                  <span>{invalidRows.length} invalid rows will be skipped</span>
                </div>
                <button type="button" className="btn btn-sm btn-ghost" style={{ padding: 0 }}>
                  {showInvalidDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>

              {showInvalidDetails && (
                <div style={{ marginTop: '10px', maxHeight: '140px', overflowY: 'auto' }}>
                  <table style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Phone</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invalidRows.map((inv, idx) => (
                        <tr key={idx}>
                          <td>{inv.rowNum}</td>
                          <td>{inv.name}</td>
                          <td>{inv.company}</td>
                          <td>{inv.phone}</td>
                          <td style={{ color: '#dc2626' }}>{inv.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {(duplicateRows.length > 0 || invalidRows.length > 0) && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={handleDownloadSkipped}
                title="Download skipped rows as CSV"
              >
                <FileDown size={13} />
                <span>Download Skipped Rows CSV</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={onClose}
              disabled={importing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleConfirmImport}
              disabled={importing || validRows.length === 0}
            >
              <DownloadCloud size={13} />
              <span>{importing ? 'Importing…' : `Confirm Import (${validRows.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
