import React, { useState, useMemo } from 'react';
import { useContacts } from '../context/ContactsContext';
import { APPLICATION_STATUSES } from '../lib/constants';
import { formatDate } from '../lib/dates';
import { exportToCsv } from '../lib/csv';
import StatusBadge from '../components/common/StatusBadge';
import ApplicationModal from '../components/applications/ApplicationModal';
import {
  Briefcase,
  Search,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  IndianRupee
} from 'lucide-react';

export default function Applications() {
  const { applications, softDeleteApplication } = useContacts();

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState(null);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchSearch =
        !searchQuery.trim() ||
        (app.company_name && app.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.job_title && app.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.recruiter_name && app.recruiter_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.location && app.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = selectedStatus === 'ALL' || app.application_status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, selectedStatus]);

  const handleExportCsv = () => {
    if (filteredApps.length === 0) return;
    exportToCsv(
      `job-tracker-applications-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredApps,
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
  };

  const handleOpenEdit = (app) => {
    setAppToEdit(app);
    setModalOpen(true);
  };

  const handleDelete = async (app) => {
    if (window.confirm(`Move application for "${app.company_name}" to Trash?`)) {
      await softDeleteApplication(app.id);
    }
  };

  // Kanban status groups
  const kanbanColumns = [
    'Interested',
    'Applied',
    'HR Screening',
    'Technical Interview',
    'Offer Received',
    'Rejected'
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Job Applications Pipeline</h2>
          <p>Track your job applications, interviews, and salary offers</p>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', border: '1px solid #dfe6f0', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : ''}`}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={14} />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : ''}`}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          <button className="btn" onClick={handleExportCsv} title="Export Applications to CSV">
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              setAppToEdit(null);
              setModalOpen(true);
            }}
          >
            <Plus size={15} />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ borderRadius: '10px 10px 0 0', border: '1px solid #dfe6f0', borderBottom: 'none' }}>
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by company, job title, recruiter…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter status"
        >
          <option value="ALL">All Application Statuses</option>
          {APPLICATION_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Main Content: Table or Kanban */}
      <section className="panel" style={{ borderRadius: '0 0 10px 10px' }}>
        {viewMode === 'table' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company & Role</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Location</th>
                  <th>Expected / Offered CTC</th>
                  <th>Recruiter</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app, index) => (
                  <tr key={app.id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{index + 1}</td>
                    <td>
                      <div className="contact-name">{app.company_name}</div>
                      <div className="company-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{app.job_title}</span>
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#245de8' }}
                            title="Open Job Posting"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={app.application_status} type="application" />
                    </td>
                    <td style={{ fontSize: '12px', color: '#66748b' }}>
                      {formatDate(app.application_date)}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {app.location || '—'}
                    </td>
                    <td style={{ fontSize: '12px', fontWeight: 600 }}>
                      {app.expected_ctc ? `₹${Number(app.expected_ctc).toLocaleString('en-IN')}` : '—'}
                      {app.offered_ctc && (
                        <div style={{ color: '#137a45', fontWeight: 700 }}>
                          Offered: ₹{Number(app.offered_ctc).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {app.recruiter_name ? (
                        <div>
                          <div>{app.recruiter_name}</div>
                          {app.recruiter_phone && (
                            <a href={`tel:${app.recruiter_phone}`} className="phone-link" style={{ fontSize: '11px' }}>
                              {app.recruiter_phone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-icon"
                          onClick={() => handleOpenEdit(app)}
                          title="Edit Application"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-danger"
                          onClick={() => handleDelete(app)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#66748b' }}>
                      No job applications found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Kanban Board View */
          <div className="kanban-board" style={{ padding: '16px' }}>
            {kanbanColumns.map(colStatus => {
              const colApps = filteredApps.filter(a => {
                if (colStatus === 'Rejected') {
                  return a.application_status === 'Rejected' || a.application_status === 'Withdrawn';
                }
                if (colStatus === 'Offer Received') {
                  return a.application_status === 'Offer Received' || a.application_status === 'Offer Accepted';
                }
                return a.application_status === colStatus;
              });

              return (
                <div key={colStatus} className="kanban-col">
                  <div className="kanban-col-head">
                    <span>{colStatus}</span>
                    <span style={{
                      fontSize: '11px',
                      background: '#edf0f5',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      color: '#66748b'
                    }}>
                      {colApps.length}
                    </span>
                  </div>
                  <div className="kanban-cards">
                    {colApps.map(app => (
                      <div
                        key={app.id}
                        className="kanban-card"
                        onClick={() => handleOpenEdit(app)}
                      >
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#182238' }}>
                          {app.company_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#66748b', marginBottom: '8px' }}>
                          {app.job_title}
                        </div>

                        {app.expected_ctc && (
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#245de8', marginBottom: '6px' }}>
                            Expected: ₹{Number(app.expected_ctc).toLocaleString('en-IN')}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                          <span>{formatDate(app.application_date)}</span>
                          <StatusBadge status={app.application_status} type="application" />
                        </div>
                      </div>
                    ))}
                    {colApps.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '12px' }}>
                        No applications
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal */}
      <ApplicationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAppToEdit(null);
        }}
        appToEdit={appToEdit}
      />
    </div>
  );
}

