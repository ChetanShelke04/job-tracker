import React, { useState } from 'react';
import { useContacts } from '../context/ContactsContext';
import { formatDate } from '../lib/dates';
import StatusBadge from '../components/common/StatusBadge';
import {
  Trash2,
  RotateCcw,
  Users,
  Briefcase
} from 'lucide-react';

export default function Trash() {
  const {
    trashContacts,
    trashApplications,
    restoreContact,
    permanentlyDeleteContact,
    restoreApplication,
    permanentlyDeleteApplication
  } = useContacts();

  const [activeTab, setActiveTab] = useState('contacts');

  const handlePermanentDeleteContact = (c) => {
    if (window.confirm(`Permanently delete "${c.name}" (${c.company})? This cannot be undone.`)) {
      permanentlyDeleteContact(c.id);
    }
  };

  const handlePermanentDeleteApp = (app) => {
    if (window.confirm(`Permanently delete application for "${app.company_name}"? This cannot be undone.`)) {
      permanentlyDeleteApplication(app.id);
    }
  };

  return (
    <div>
      {/* Banner */}
      <div className="page-title-banner">
        <div>
          <h2>Trash & Archived Records</h2>
          <p>
            Soft-deleted contacts and job applications live here. You can restore them anytime or permanently delete them.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-chips-bar" style={{ borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <Users size={13} style={{ marginRight: '3px' }} />
          <span>Contacts ({trashContacts.length})</span>
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          <Briefcase size={13} style={{ marginRight: '3px' }} />
          <span>Applications ({trashApplications.length})</span>
        </button>
      </div>

      {/* Panel */}
      <section className="panel" style={{ borderRadius: '0 0 10px 10px' }}>
        {activeTab === 'contacts' ? (
          trashContacts.length === 0 ? (
            <div className="empty-view-state">
              <div className="empty-view-icon">🗑️</div>
              <h4>Trash is empty</h4>
              <p>No contacts have been soft-deleted.</p>
            </div>
          ) : (
            <>
              <div className="table-container desktop-table-view">
                <table>
                  <thead>
                    <tr>
                      <th>HR Name & Company</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Deleted Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashContacts.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div className="table-cell-name">{c.name}</div>
                          <div className="table-cell-sub">{c.company}</div>
                        </td>
                        <td>{c.phone}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {formatDate(c.deleted_at)}
                        </td>
                        <td>
                          <div className="row-actions-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => restoreContact(c.id)}
                              title="Restore Contact"
                            >
                              <RotateCcw size={12} />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-danger"
                              onClick={() => handlePermanentDeleteContact(c)}
                              title="Delete Permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="mobile-card-stack">
                {trashContacts.map(c => (
                  <div key={c.id} className="crm-mobile-card">
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-title">{c.name}</div>
                        <div className="mobile-card-sub">{c.company} · {c.phone}</div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '10px' }}>
                      Deleted on {formatDate(c.deleted_at)}
                    </div>
                    <div className="mobile-card-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        style={{ flex: 1 }}
                        onClick={() => restoreContact(c.id)}
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-danger"
                        onClick={() => handlePermanentDeleteContact(c)}
                        title="Delete Permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        ) : (
          trashApplications.length === 0 ? (
            <div className="empty-view-state">
              <div className="empty-view-icon">🗑️</div>
              <h4>Trash is empty</h4>
              <p>No job applications have been soft-deleted.</p>
            </div>
          ) : (
            <>
              <div className="table-container desktop-table-view">
                <table>
                  <thead>
                    <tr>
                      <th>Company & Job Title</th>
                      <th>Status</th>
                      <th>Deleted Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashApplications.map(app => (
                      <tr key={app.id}>
                        <td>
                          <div className="table-cell-name">{app.company_name}</div>
                          <div className="table-cell-sub">{app.job_title}</div>
                        </td>
                        <td><StatusBadge status={app.application_status} type="application" /></td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {formatDate(app.deleted_at)}
                        </td>
                        <td>
                          <div className="row-actions-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => restoreApplication(app.id)}
                              title="Restore Application"
                            >
                              <RotateCcw size={12} />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-danger"
                              onClick={() => handlePermanentDeleteApp(app)}
                              title="Delete Permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="mobile-card-stack">
                {trashApplications.map(app => (
                  <div key={app.id} className="crm-mobile-card">
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-title">{app.company_name}</div>
                        <div className="mobile-card-sub">{app.job_title}</div>
                      </div>
                      <StatusBadge status={app.application_status} type="application" />
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '10px' }}>
                      Deleted on {formatDate(app.deleted_at)}
                    </div>
                    <div className="mobile-card-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        style={{ flex: 1 }}
                        onClick={() => restoreApplication(app.id)}
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-danger"
                        onClick={() => handlePermanentDeleteApp(app)}
                        title="Delete Permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </section>
    </div>
  );
}
