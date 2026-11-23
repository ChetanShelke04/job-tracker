import React, { useState } from 'react';
import { useContacts } from '../context/ContactsContext';
import { formatDate } from '../lib/dates';
import StatusBadge from '../components/common/StatusBadge';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
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

  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'applications'

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

  const totalTrash = trashContacts.length + trashApplications.length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Trash & Archive</h2>
          <p>
            Review soft-deleted contacts and applications. You can restore them anytime or permanently delete them.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="chips-bar" style={{ borderRadius: '10px 10px 0 0', border: '1px solid #dfe6f0', borderBottom: 'none' }}>
        <button
          className={`chip ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <Users size={13} style={{ marginRight: '4px' }} />
          <span>Contacts ({trashContacts.length})</span>
        </button>
        <button
          className={`chip ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          <Briefcase size={13} style={{ marginRight: '4px' }} />
          <span>Applications ({trashApplications.length})</span>
        </button>
      </div>

      {/* Panel */}
      <section className="panel" style={{ borderRadius: '0 0 10px 10px' }}>
        {activeTab === 'contacts' ? (
          trashContacts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🗑️</span>
              <h4>Trash is empty</h4>
              <p>No contacts have been deleted.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>HR Name & Company</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Deleted At</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashContacts.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="contact-name">{c.name}</div>
                        <div className="company-sub">{c.company}</div>
                      </td>
                      <td>{c.phone}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td style={{ fontSize: '12px', color: '#66748b' }}>
                        {formatDate(c.deleted_at)}
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => restoreContact(c.id)}
                            title="Restore Contact"
                          >
                            <RotateCcw size={13} />
                            <span>Restore</span>
                          </button>
                          <button
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
          )
        ) : (
          trashApplications.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🗑️</span>
              <h4>Trash is empty</h4>
              <p>No job applications have been deleted.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Company & Job Title</th>
                    <th>Status</th>
                    <th>Deleted At</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashApplications.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div className="contact-name">{app.company_name}</div>
                        <div className="company-sub">{app.job_title}</div>
                      </td>
                      <td><StatusBadge status={app.application_status} type="application" /></td>
                      <td style={{ fontSize: '12px', color: '#66748b' }}>
                        {formatDate(app.deleted_at)}
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => restoreApplication(app.id)}
                            title="Restore Application"
                          >
                            <RotateCcw size={13} />
                            <span>Restore</span>
                          </button>
                          <button
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
          )
        )}
      </section>
    </div>
  );
}

