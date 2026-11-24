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
  Calendar
} from 'lucide-react';

export default function Applications() {
  const { applications, softDeleteApplication } = useContacts();

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
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

  // Structured Kanban status groups
  const kanbanColumns = [
    { title: 'Interested', statusKey: 'Interested' },
    { title: 'Applied', statusKey: 'Applied' },
    { title: 'HR Screening', statusKey: 'HR Screening' },
    { title: 'Technical Interview', statusKey: 'Technical Interview' },
    { title: 'Offer Received', statusKey: 'Offer Received' },
    { title: 'Archived / Rejected', statusKey: 'Rejected' }
  ];

  return (
    <div>
      {/* Banner */}
      <div className="page-title-banner">
        <div>
          <h2>Job Application Pipeline</h2>
          <p>Track your job opportunities, CTC expectations, and interview rounds.</p>
        </div>
        <div className="page-banner-actions">
          {/* View toggle pills */}
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0, boxShadow: 'none' }}
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
            >
              <LayoutGrid size={13} />
              <span>Board</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0, boxShadow: 'none' }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={13} />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleExportCsv}
            title="Export applications to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              setAppToEdit(null);
              setModalOpen(true);
            }}
          >
            <Plus size={14} />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="crm-toolbar" style={{ borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by company, role, recruiter…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="toolbar-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter status"
        >
          <option value="ALL">All Application Stages</option>
          {APPLICATION_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Main Content Area */}
      <section className="panel" style={{ borderRadius: '0 0 10px 10px' }}>
        {viewMode === 'table' ? (
          <>
            <div className="table-container desktop-table-view">
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
                        <div className="table-cell-name">{app.company_name}</div>
                        <div className="table-cell-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{app.job_title}</span>
                          {app.job_url && (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb' }}
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
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatDate(app.application_date)}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {app.location || '—'}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 600 }}>
                        {app.expected_ctc ? `₹${Number(app.expected_ctc).toLocaleString('en-IN')}` : '—'}
                        {app.offered_ctc && (
                          <div style={{ color: '#059669', fontWeight: 700, fontSize: '11px' }}>
                            Offered: ₹{Number(app.offered_ctc).toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {app.recruiter_name ? (
                          <div>
                            <div>{app.recruiter_name}</div>
                            {app.recruiter_phone && (
                              <a href={`tel:${app.recruiter_phone}`} className="phone-action-link" style={{ fontSize: '11px' }}>
                                {app.recruiter_phone}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions-group" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-icon btn-ghost"
                            onClick={() => handleOpenEdit(app)}
                            title="Edit Application"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
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
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No job applications found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View */}
            <div className="mobile-card-stack">
              {filteredApps.map(app => (
                <div key={app.id} className="crm-mobile-card">
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title">{app.company_name}</div>
                      <div className="mobile-card-sub">{app.job_title}</div>
                    </div>
                    <StatusBadge status={app.application_status} type="application" />
                  </div>

                  <div className="mobile-card-metadata">
                    <div>
                      <span style={{ color: '#64748b' }}>Applied: </span>
                      <span>{formatDate(app.application_date)}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>CTC: </span>
                      <span>{app.expected_ctc ? `₹${Number(app.expected_ctc).toLocaleString('en-IN')}` : '—'}</span>
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenEdit(app)}
                    >
                      <Edit2 size={14} />
                      <span>Edit Details</span>
                    </button>
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-icon"
                        title="Job Posting"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn btn-icon btn-danger"
                      onClick={() => handleDelete(app)}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Modern Kanban Board View */
          <div className="kanban-view-scroll">
            {kanbanColumns.map(col => {
              const colApps = filteredApps.filter(a => {
                if (col.statusKey === 'Rejected') {
                  return a.application_status === 'Rejected' || a.application_status === 'Withdrawn';
                }
                if (col.statusKey === 'Offer Received') {
                  return a.application_status === 'Offer Received' || a.application_status === 'Offer Accepted';
                }
                if (col.statusKey === 'Technical Interview') {
                  return a.application_status === 'Technical Interview' || a.application_status === 'Managerial Interview' || a.application_status === 'HR Discussion';
                }
                if (col.statusKey === 'HR Screening') {
                  return a.application_status === 'HR Screening' || a.application_status === 'Resume Shortlisted';
                }
                return a.application_status === col.statusKey;
              });

              return (
                <div key={col.title} className="kanban-column-box">
                  <div className="kanban-column-title">
                    <span>{col.title}</span>
                    <span style={{
                      fontSize: '11px',
                      background: '#f1f5f9',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      color: '#64748b',
                      fontWeight: 700
                    }}>
                      {colApps.length}
                    </span>
                  </div>

                  <div className="kanban-column-cards">
                    {colApps.map(app => (
                      <div
                        key={app.id}
                        className="kanban-task-card"
                        onClick={() => handleOpenEdit(app)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                            {app.company_name}
                          </span>
                          <StatusBadge status={app.application_status} type="application" />
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                          {app.job_title}
                        </div>

                        {app.expected_ctc && (
                          <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#2563eb', marginBottom: '6px' }}>
                            Exp: ₹{Number(app.expected_ctc).toLocaleString('en-IN')}
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px',
                          color: '#94a3b8',
                          paddingTop: '6px',
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={11} />
                            {formatDate(app.application_date)}
                          </span>
                          {app.location && <span>{app.location}</span>}
                        </div>
                      </div>
                    ))}

                    {colApps.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '12px' }}>
                        No opportunities
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
