import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '../context/ContactsContext';
import { useAuth } from '../context/AuthContext';
import { isDueToday, isOverdue, formatDate, formatDateTime } from '../lib/dates';
import StatusBadge from '../components/common/StatusBadge';
import ContactModal from '../components/contacts/ContactModal';
import CallModal from '../components/calls/CallModal';
import BulkModal from '../components/contacts/BulkModal';
import {
  Users,
  PhoneCall,
  CalendarClock,
  AlertTriangle,
  Briefcase,
  Phone,
  Plus,
  ArrowRight,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

export default function Dashboard() {
  const { contacts, calls, applications, loading } = useContacts();
  const { username } = useAuth();
  const navigate = useNavigate();

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [activeCallContact, setActiveCallContact] = useState(null);

  // Computed metrics
  const totalContacts = contacts.length;
  const callsMade = calls.length;
  const todayFollowUps = contacts.filter(c => c.followup_date && isDueToday(c.followup_date));
  const overdueFollowUps = contacts.filter(c => c.followup_date && isOverdue(c.followup_date));
  const activeApplications = applications.filter(a => !['Rejected', 'Withdrawn', 'Offer Accepted'].includes(a.application_status));

  // Urgent & Upcoming Follow-ups (overdue first, then today, max 6)
  const urgentFollowUps = [...overdueFollowUps, ...todayFollowUps].slice(0, 6);

  // Recent calls (last 6)
  const recentCalls = calls.slice(0, 6);

  // Recent job application updates (last 4)
  const recentApplications = applications.slice(0, 4);

  const handleOpenCallModal = (contact) => {
    setActiveCallContact(contact);
    setCallModalOpen(true);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-title-banner">
        <div>
          <h2>Good day, {username}</h2>
          <p>Here is your recruiter outreach pipeline and upcoming follow-ups.</p>
        </div>
        <div className="page-banner-actions">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setBulkModalOpen(true)}
          >
            <FileSpreadsheet size={14} />
            <span>Bulk Add</span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setContactModalOpen(true)}
          >
            <Plus size={14} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* 5 Information Metric Cards */}
      <div className="metrics-row">
        {/* Total HR Contacts */}
        <div
          className="metric-card blue"
          onClick={() => navigate('/contacts')}
          title="View all contacts"
        >
          <div className="metric-card-top">
            <span className="metric-card-label">Total HR Contacts</span>
            <div className="metric-icon-wrap"><Users size={15} /></div>
          </div>
          <div className="metric-card-value">{loading ? '…' : totalContacts}</div>
          <div className="metric-card-subtext" style={{ color: '#64748b' }}>
            In active directory
          </div>
        </div>

        {/* Calls Made */}
        <div
          className="metric-card blue"
          onClick={() => navigate('/contacts')}
          title="Total calls logged"
        >
          <div className="metric-card-top">
            <span className="metric-card-label">Calls Made</span>
            <div className="metric-icon-wrap"><PhoneCall size={15} /></div>
          </div>
          <div className="metric-card-value">{loading ? '…' : callsMade}</div>
          <div className="metric-card-subtext" style={{ color: '#059669' }}>
            Outreach calls logged
          </div>
        </div>

        {/* Today's Follow-ups */}
        <div
          className={`metric-card ${todayFollowUps.length > 0 ? 'amber' : 'emerald'}`}
          onClick={() => navigate('/follow-ups?tab=today')}
          title="View today's follow-ups"
        >
          <div className="metric-card-top">
            <span className="metric-card-label">Today's Follow-ups</span>
            <div className="metric-icon-wrap"><CalendarClock size={15} /></div>
          </div>
          <div className="metric-card-value">{loading ? '…' : todayFollowUps.length}</div>
          <div className="metric-card-subtext" style={{ color: todayFollowUps.length > 0 ? '#d97706' : '#059669' }}>
            {todayFollowUps.length > 0 ? 'Callbacks due today' : 'No follow-ups due today'}
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div
          className={`metric-card ${overdueFollowUps.length > 0 ? 'red' : 'emerald'}`}
          onClick={() => navigate('/follow-ups?tab=overdue')}
          title="View overdue follow-ups"
        >
          <div className="metric-card-top">
            <span className="metric-card-label">Overdue Follow-ups</span>
            <div className="metric-icon-wrap"><AlertTriangle size={15} /></div>
          </div>
          <div className="metric-card-value">{loading ? '…' : overdueFollowUps.length}</div>
          <div className="metric-card-subtext" style={{ color: overdueFollowUps.length > 0 ? '#dc2626' : '#059669' }}>
            {overdueFollowUps.length > 0 ? 'Action required' : 'None overdue'}
          </div>
        </div>

        {/* Active Job Applications */}
        <div
          className="metric-card purple"
          onClick={() => navigate('/applications')}
          title="View job applications"
        >
          <div className="metric-card-top">
            <span className="metric-card-label">Active Applications</span>
            <div className="metric-icon-wrap"><Briefcase size={15} /></div>
          </div>
          <div className="metric-card-value">{loading ? '…' : activeApplications.length}</div>
          <div className="metric-card-subtext" style={{ color: '#7c3aed' }}>
            In interview pipeline
          </div>
        </div>
      </div>

      {/* Main Content Sections: 2 Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Urgent Follow-ups List */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Upcoming & Urgent Follow-ups</h3>
              <p>Callbacks and discussions due today or overdue</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => navigate('/follow-ups')}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="panel-body" style={{ padding: '0' }}>
            {urgentFollowUps.length === 0 ? (
              <div className="empty-view-state">
                <div className="empty-view-icon">🎉</div>
                <h4>All caught up!</h4>
                <p>No urgent follow-ups pending right now. Great job keeping in touch!</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-container desktop-table-view">
                  <table>
                    <thead>
                      <tr>
                        <th>HR Contact</th>
                        <th>Phone</th>
                        <th>Due Date</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {urgentFollowUps.map(c => {
                        const overdue = isOverdue(c.followup_date);
                        return (
                          <tr key={c.id}>
                            <td>
                              <div className="table-cell-name">{c.name}</div>
                              <div className="table-cell-sub">{c.company}</div>
                            </td>
                            <td>
                              <a href={`tel:${c.phone}`} className="phone-action-link">
                                <Phone size={12} />
                                <span>{c.phone}</span>
                              </a>
                            </td>
                            <td>
                              <span className={overdue ? 'due-indicator' : 'today-indicator'}>
                                {overdue && <AlertTriangle size={12} />}
                                {formatDate(c.followup_date)}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleOpenCallModal(c)}
                                title="Log Call Outcome"
                              >
                                <PhoneCall size={12} />
                                <span>Log Call</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="mobile-card-stack" style={{ padding: '8px' }}>
                  {urgentFollowUps.map(c => {
                    const overdue = isOverdue(c.followup_date);
                    return (
                      <div key={c.id} className="crm-mobile-card" style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div>
                            <div className="mobile-card-title" style={{ fontSize: '13.5px' }}>{c.name}</div>
                            <div className="mobile-card-sub">{c.company}</div>
                          </div>
                          <span className={overdue ? 'due-indicator' : 'today-indicator'}>
                            {overdue && <AlertTriangle size={11} />}
                            {formatDate(c.followup_date)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <a href={`tel:${c.phone}`} className="phone-action-link">
                            <Phone size={13} />
                            <span>{c.phone}</span>
                          </a>

                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => handleOpenCallModal(c)}
                            style={{ minHeight: '34px', padding: '4px 10px' }}
                          >
                            <PhoneCall size={12} />
                            <span>Call</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Recent Call Activities */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent Call Activities</h3>
              <p>Last {recentCalls.length} calls logged with HR recruiters</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => navigate('/contacts')}
            >
              <span>Contacts</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="panel-body" style={{ padding: '0' }}>
            {recentCalls.length === 0 ? (
              <div className="empty-view-state">
                <Clock size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                <h4>No calls logged yet</h4>
                <p>Start calling recruiters and record your conversations.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-container desktop-table-view">
                  <table>
                    <thead>
                      <tr>
                        <th>HR / Company</th>
                        <th>Outcome</th>
                        <th>Called At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCalls.map((call, idx) => (
                        <tr key={call.id || idx}>
                          <td>
                            <div className="table-cell-name">
                              {call.contacts?.name || 'HR Recruiter'}
                            </div>
                            <div className="table-cell-sub">
                              {call.contacts?.company || 'Company'}
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={call.outcome} />
                            {call.notes && (
                              <div style={{
                                fontSize: '11px',
                                color: '#64748b',
                                marginTop: '2px',
                                maxWidth: '180px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {call.notes}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>
                            {formatDateTime(call.called_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="mobile-card-stack" style={{ padding: '8px' }}>
                  {recentCalls.map((call, idx) => (
                    <div key={call.id || idx} className="crm-mobile-card" style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="table-cell-name" style={{ fontSize: '13px' }}>
                          {call.contacts?.name || 'HR Recruiter'} ({call.contacts?.company || 'Company'})
                        </span>
                        <StatusBadge status={call.outcome} />
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{formatDateTime(call.called_at)}</span>
                        {call.notes && <span style={{ fontStyle: 'italic', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Recent Job Application Updates Section */}
      {recentApplications.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent Job Application Updates</h3>
              <p>Active job search opportunities and interview rounds</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => navigate('/applications')}
            >
              <span>View Pipeline</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="panel-body" style={{ padding: '0' }}>
            <div className="table-container desktop-table-view">
              <table>
                <thead>
                  <tr>
                    <th>Company & Role</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                    <th>Expected / Offered CTC</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div className="table-cell-name">{app.company_name}</div>
                        <div className="table-cell-sub">{app.job_title}</div>
                      </td>
                      <td>
                        <StatusBadge status={app.application_status} type="application" />
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatDate(app.application_date)}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 600 }}>
                        {app.expected_ctc ? `₹${Number(app.expected_ctc).toLocaleString('en-IN')}` : '—'}
                        {app.offered_ctc && (
                          <span style={{ color: '#059669', marginLeft: '6px' }}>
                            (Offered: ₹{Number(app.offered_ctc).toLocaleString('en-IN')})
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {app.location || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View for Recent Applications */}
            <div className="mobile-card-stack" style={{ padding: '8px' }}>
              {recentApplications.map(app => (
                <div key={app.id} className="crm-mobile-card" style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div>
                      <div className="mobile-card-title" style={{ fontSize: '13.5px' }}>{app.company_name}</div>
                      <div className="mobile-card-sub">{app.job_title}</div>
                    </div>
                    <StatusBadge status={app.application_status} type="application" />
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>{formatDate(app.application_date)}</span>
                    {app.expected_ctc && <span style={{ fontWeight: 600, color: '#2563eb' }}>₹{Number(app.expected_ctc).toLocaleString('en-IN')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      <BulkModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
      />

      <CallModal
        isOpen={callModalOpen}
        onClose={() => {
          setCallModalOpen(false);
          setActiveCallContact(null);
        }}
        contact={activeCallContact}
      />
    </div>
  );
}
