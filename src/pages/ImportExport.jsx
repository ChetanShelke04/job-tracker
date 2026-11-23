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
  AlertCircle,
  HelpCircle
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
      // Parse file with duplicate checking against currently loaded contacts
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
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Data Import & Export</h2>
          <p>
            Backup your contacts and call histories, download CSV reports, or import records from other trackers
          </p>
        </div>
      </div>

      {parsingError && (
        <div style={{
          background: '#ffebe9',
          color: '#b42318',
          border: '1px solid #fecdca',
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px'
        }}>
          <AlertCircle size={18} />
          <span>{parsingError}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          background: '#e1f7e9',
          color: '#137a45',
          border: '1px solid #b7ebca',
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* IMPORT CARD */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Import Data</h3>
              <p>Supports .csv, .json, and legacy HR Tracker HTML backups</p>
            </div>
            <Upload size={18} style={{ color: '#245de8' }} />
          </div>

          <div className="panel-body">
            <div style={{
              border: '2px dashed #cbd5e3',
              borderRadius: '12px',
              padding: '36px 20px',
              textAlign: 'center',
              background: '#f8faff',
              marginBottom: '16px'
            }}>
              <Upload size={36} style={{ color: '#245de8', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                Choose a File to Import
              </h4>
              <p style={{ fontSize: '12px', color: '#66748b', marginBottom: '16px', maxWidth: '340px', margin: '0 auto 16px' }}>
                Select a CSV spreadsheet or JSON backup. An interactive preview will appear before anything is saved.
              </p>

              <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <Upload size={15} />
                <span>Select .CSV or .JSON File</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '14px', fontSize: '12px', color: '#475569' }}>
              <strong>Legacy Tracker Compatible:</strong> You can directly upload backup files generated by the original single-file HTML tracker (<code>hr-tracker-backup-*.json</code>). Old contact IDs, notes, and call histories are automatically mapped and securely synchronized with your account!
            </div>
          </div>
        </section>

        {/* EXPORT CARD */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Export & Backups</h3>
              <p>Download your private records anytime</p>
            </div>
            <Download size={18} style={{ color: '#137a45' }} />
          </div>

          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Full JSON Backup */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px',
                border: '1px solid #dfe6f0',
                borderRadius: '8px',
                background: '#ffffff'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={16} style={{ color: '#245de8' }} />
                    <span>Complete JSON Backup</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#66748b', marginTop: '2px' }}>
                    Full export of all your contacts, call logs, and job applications.
                  </p>
                </div>
                <button className="btn btn-sm" onClick={handleExportJson}>
                  <Download size={13} />
                  <span>Download JSON</span>
                </button>
              </div>

              {/* Contacts CSV */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px',
                border: '1px solid #dfe6f0',
                borderRadius: '8px',
                background: '#ffffff'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileSpreadsheet size={16} style={{ color: '#137a45' }} />
                    <span>HR Contacts (CSV)</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#66748b', marginTop: '2px' }}>
                    Excel-ready spreadsheet with UTF-8 BOM encoding.
                  </p>
                </div>
                <button className="btn btn-sm" onClick={handleExportContactsCsv}>
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Applications CSV */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px',
                border: '1px solid #dfe6f0',
                borderRadius: '8px',
                background: '#ffffff'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} style={{ color: '#6941c6' }} />
                    <span>Job Applications (CSV)</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#66748b', marginTop: '2px' }}>
                    Spreadsheet of your job search pipeline and salary offers.
                  </p>
                </div>
                <button className="btn btn-sm" onClick={handleExportAppsCsv}>
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Blank Templates */}
              <div style={{
                padding: '14px',
                border: '1px solid #dfe6f0',
                borderRadius: '8px',
                background: '#f8faff'
              }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                  Blank CSV Templates
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-sm" onClick={downloadContactsTemplate}>
                    <span>Contacts Template</span>
                  </button>
                  <button className="btn btn-sm" onClick={downloadApplicationsTemplate}>
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

