import React, { useState, useRef } from 'react';
import { useContacts } from '../context/ContactsContext';
import { exportToCsv, downloadBlob, downloadContactsTemplate, downloadApplicationsTemplate } from '../lib/csv';
import { parseImportFile } from '../lib/importer';
import ImportPreview from '../components/import/ImportPreview';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ImportExport() {
  const { contacts, calls, applications, refreshData, showToast } = useContacts();

  const [previewData, setPreviewData] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [parsingError, setParsingError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef(null);

  // 1. Export JSON full backup
  const handleExportJson = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      contacts,
      calls,
      applications
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const filename = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(filename, blob);
    showToast('JSON Backup downloaded successfully.', 'success');
  };

  // 2. Export Contacts CSV
  const handleExportContactsCsv = () => {
    if (contacts.length === 0) {
      alert('You have no contacts to export.');
      return;
    }

    exportToCsv(
      `job-tracker-contacts-${new Date().toISOString().slice(0, 10)}.csv`,
      contacts,
      ['name', 'company', 'phone', 'status', 'followup_date', 'interview_date', 'next_action', 'notes']
    );
    showToast('Contacts CSV exported.', 'success');
  };

  // 3. Export Applications CSV
  const handleExportAppsCsv = () => {
    if (applications.length === 0) {
      alert('You have no applications to export.');
      return;
    }

    exportToCsv(
      `job-tracker-applications-${new Date().toISOString().slice(0, 10)}.csv`,
      applications,
      [
        'company_name',
        'job_title',
        'location',
        'job_url',
        'application_date',
        'expected_ctc',
        'offered_ctc',
        'application_status',
        'recruiter_name',
        'recruiter_phone',
        'notes'
      ]
    );
    showToast('Job Applications CSV exported.', 'success');
  };

  // 4. File input change: parse CSV or JSON
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsingError('');
    setSuccessMessage('');

    try {
      const result = await parseImportFile(file, contacts);
      setPreviewData(result);
      setPreviewModalOpen(true);
    } catch (err) {
      setParsingError(err.message || 'Could not parse the selected file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportComplete = (importedCount) => {
    setPreviewModalOpen(false);
    setPreviewData(null);
    setSuccessMessage(`Successfully imported ${importedCount} contacts into Supabase!`);
    refreshData();
  };

  return (
    <div>
      {/* Banner */}
      <div className="page-title-banner">
        <div>
          <h2>Data Backup & Import Center</h2>
          <p>Download secure snapshots of your records or import contacts from CSV and legacy backups.</p>
        </div>
      </div>

      {parsingError && (
        <div style={{
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px'
        }}>
          <AlertCircle size={16} />
          <span>{parsingError}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          background: '#ecfdf5',
          color: '#059669',
          border: '1px solid #a7f3d0',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px' }}>
        {/* IMPORT SECTION */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Import Contacts & Data</h3>
              <p>Supports .csv, .json, and legacy HR Tracker HTML backups</p>
            </div>
            <Upload size={17} style={{ color: '#2563eb' }} />
          </div>

          <div className="panel-body">
            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '36px 20px',
              textAlign: 'center',
              background: '#f8fafc',
              marginBottom: '16px'
            }}>
              <Upload size={32} style={{ color: '#2563eb', margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '14.5px', fontWeight: 600, marginBottom: '4px' }}>
                Upload CSV or JSON Backup
              </h4>
              <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px', maxWidth: '320px', margin: '0 auto 16px' }}>
                An interactive preview will display valid rows and flag duplicates before saving.
              </p>

              <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <Upload size={14} />
                <span>Select File to Import</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              <strong>Legacy Backup Compatible:</strong> Directly upload backups from your original single-file tracker (<code>hr-tracker-backup-*.json</code>). Old contact IDs and call histories are automatically mapped and securely linked to your account!
            </div>
          </div>
        </section>

        {/* EXPORT SECTION */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Export & Backups</h3>
              <p>Save local backups and Excel-ready spreadsheets</p>
            </div>
            <Download size={17} style={{ color: '#059669' }} />
          </div>

          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Full JSON Backup */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#ffffff'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={15} style={{ color: '#2563eb' }} />
                    <span>Complete JSON Backup</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                    Full snapshot of all contacts, call histories, and applications.
                  </p>
                </div>
                <button type="button" className="btn btn-sm" onClick={handleExportJson}>
                  <Download size={13} />
                  <span>Download</span>
                </button>
              </div>

              {/* Contacts CSV */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#ffffff'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileSpreadsheet size={15} style={{ color: '#059669' }} />
                    <span>HR Contacts (CSV)</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                    Excel-formatted spreadsheet with UTF-8 BOM encoding.
                  </p>
                </div>
                <button type="button" className="btn btn-sm" onClick={handleExportContactsCsv}>
                  <Download size={13} />
                  <span>Export</span>
                </button>
              </div>

              {/* Applications CSV */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#ffffff'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} style={{ color: '#7c3aed' }} />
                    <span>Job Applications (CSV)</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                    Spreadsheet of your job search pipeline and salary offers.
                  </p>
                </div>
                <button type="button" className="btn btn-sm" onClick={handleExportAppsCsv}>
                  <Download size={13} />
                  <span>Export</span>
                </button>
              </div>

              {/* Blank Templates */}
              <div style={{
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#f8fafc'
              }}>
                <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '8px' }}>
                  Blank CSV Templates
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-sm" onClick={downloadContactsTemplate}>
                    <span>Contacts Template</span>
                  </button>
                  <button type="button" className="btn btn-sm" onClick={downloadApplicationsTemplate}>
                    <span>Applications Template</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Import Preview Modal */}
      <ImportPreview
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        previewData={previewData}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
