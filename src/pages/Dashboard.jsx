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
  CalendarClock,
  PhoneOff,
  CalendarCheck,
  PhoneCall,
  Briefcase,
  Phone,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
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

  // Computations
  const totalContacts = contacts.length;
  const dueContacts = contacts.filter(
    c => c.followup_date && (isDueToday(c.followup_date) || isOverdue(c.followup_date))
  );
  const overdueCount = contacts.filter(c => c.followup_date && isOverdue(c.followup_date)).length;
  const neverCalledCount = contacts.filter(c => c.status === 'Not Called' && !c.last_call_at).length;
  const interviewsCount = contacts.filter(c => c.status === 'Interview Scheduled' || c.interview_date).length;
  const totalCallsLogged = calls.length;
  const offersCount = applications.filter(a => a.application_status === 'Offer Received' || a.application_status === 'Offer Accepted').length;

  // Urgent follow-ups list (overdue first, then due today, max 6)
  const urgentFollowUps = [...dueContacts].sort((a, b) => {
    return (a.followup_date || '').localeCompare(b.followup_date || '');
  }).slice(0, 6);

  // Recent calls (last 10)
  const recentCalls = calls.slice(0, 10);

  const handleOpenCallModal = (contact) => {
    setActiveCallContact(contact);
    setCallModalOpen(true);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Welcome back, {username}!</h2>
          <p>Here is your HR recruiter pipeline and upcoming follow-ups.</p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => setBulkModalOpen(true)}>
            <FileSpreadsheet size={15} />
            <span>Bulk Add</span>
          </button>
          <button className="btn btn-primary" onClick={() => setContactModalOpen(true)}>
            <Plus size={15} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div
          className="stat-card blue"
          onClick={() => navigate('/contacts')}
          title="View all contacts"
        >
          <div className="stat-header">
            <span className="stat-label">Total HR</span>
            <div className="stat-icon"><Users size={16} /></div>
          </div>
          <div className="stat-value">{loading ? '…' : totalContacts}</div>
        </div>

        <div
          className={`stat-card ${dueContacts.length > 0 ? 'red' : 'green'}`}
          onClick={() => navigate('/follow-ups')}
          title="View follow-ups due"
        >
          <div className="stat-header">
            <span className="stat-label">Follow-ups Due</span>
            <div className="stat-icon"><CalendarClock size={16} /></div>
          </div>
          <div className="stat-value">
            {loading ? '…' : dueContacts.length}
          </div>
          {overdueCount > 0 && (
            <span style={{ fontSize: '11px', color: '#b42318', fontWeight: 700 }}>
              {overdueCount} overdue
            </span>
          )}
        </div>

        <div
          className="stat-card amber"
          onClick={() => navigate('/contacts?filter=never-called')}
          title="View never called contacts"
        >
          <div className="stat-header">
            <span className="stat-label">Never Called</span>
            <div className="stat-icon"><PhoneOff size={16} /></div>
          </div>
          <div className="stat-value">{loading ? '…' : neverCalledCount}</div>
        </div>

        <div
          className="stat-card purple"
          onClick={() => navigate('/contacts?filter=interviews')}
          title="View scheduled interviews"
        >
          <div className="stat-header">
            <span className="stat-label">Interviews</span>
            <div className="stat-icon"><CalendarCheck size={16} /></div>
          </div>
          <div className="stat-value">{loading ? '…' : interviewsCount}</div>
        </div>

        <div
          className="stat-card blue"
          onClick={() => navigate('/contacts')}
          title="Total calls logged"
        >
          <div className="stat-header">
            <span className="stat-label">Calls Logged</span>
            <div className="stat-icon"><PhoneCall size={16} /></div>
          </div>
          <div className="stat-value">{loading ? '…' : totalCallsLogged}</div>
        </div>

        <div
          className="stat-card green"
          onClick={() => navigate('/applications')}
          title="View job applications and offers"
        >
          <div className="stat-header">
            <span className="stat-label">Applications / Offers</span>
            <div className="stat-icon"><Briefcase size={16} /></div>
          </div>
          <div className="stat-value">
            {loading ? '…' : `${applications.length} / ${offersCount}`}
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Urgent Follow-ups */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Urgent Follow-ups</h3>
              <p>Callbacks and discussions due today or overdue</p>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => navigate('/follow-ups')}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="panel-body" style={{ padding: '0' }}>
            {urgentFollowUps.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🎉</span>
                <h4>All caught up!</h4>
                <p>No urgent follow-ups pending right now.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>HR / Company</th>
                      <th>Phone</th>
                      <th>Due</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentFollowUps.map(c => {
                      const overdue = isOverdue(c.followup_date);
                      return (
                        <tr key={c.id}>
                          <td>
                            <div className="contact-name">{c.name}</div>
                            <div className="company-sub">{c.company}</div>
                          </td>
                          <td>
                            <a href={`tel:${c.phone}`} className="phone-link">
                              <Phone size={13} />
                              <span>{c.phone}</span>
                            </a>
                          </td>
                          <td>
                            <span className={overdue ? 'due-badge' : 'today-badge'}>
                              {overdue && <AlertTriangle size={12} />}
                              {formatDate(c.followup_date)}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleOpenCallModal(c)}
                              title="Log Call"
                            >
                              <PhoneCall size={13} />
                              <span>Log Call</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Recent Calls Log */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent Calls</h3>
              <p>Last {recentCalls.length} calls logged across your contacts</p>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => navigate('/contacts')}
            >
              <span>Contacts</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="panel-body" style={{ padding: '0' }}>
            {recentCalls.length === 0 ? (
              <div className="empty-state">
                <Clock size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                <h4>No calls logged yet</h4>
                <p>Start calling HR recruiters and log your conversation outcomes.</p>
              </div>
            ) : (
              <div className="table-container">
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
                          <div className="contact-name">
                            {call.contacts?.name || 'HR Recruiter'}
                          </div>
                          <div className="company-sub">
                            {call.contacts?.company || 'Company'}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={call.outcome} />
                          {call.notes && (
                            <div style={{
                              fontSize: '11px',
                              color: '#66748b',
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
                        <td style={{ fontSize: '12px', color: '#66748b' }}>
                          {formatDateTime(call.called_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

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

