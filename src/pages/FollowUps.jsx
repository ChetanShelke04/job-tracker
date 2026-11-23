import React, { useState, useMemo } from 'react';
import { useContacts } from '../context/ContactsContext';
import { isOverdue, isDueToday, getOverdueDays, formatDate, addDays } from '../lib/dates';
import StatusBadge from '../components/common/StatusBadge';
import CallModal from '../components/calls/CallModal';
import ContactModal from '../components/contacts/ContactModal';
import {
  CalendarClock,
  Phone,
  PhoneCall,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Edit2
} from 'lucide-react';

export default function FollowUps() {
  const { contacts, updateContact } = useContacts();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'overdue' | 'today'
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);

  // Filter contacts that have a follow-up date due today or overdue
  const dueContacts = useMemo(() => {
    return contacts.filter(c => {
      if (!c.followup_date) return false;
      const overdue = isOverdue(c.followup_date);
      const dueToday = isDueToday(c.followup_date);

      if (activeTab === 'overdue') return overdue;
      if (activeTab === 'today') return dueToday;
      return overdue || dueToday;
    }).sort((a, b) => {
      // Overdue first (oldest date first)
      return (a.followup_date || '').localeCompare(b.followup_date || '');
    });
  }, [contacts, activeTab]);

  const overdueTotal = contacts.filter(c => c.followup_date && isOverdue(c.followup_date)).length;
  const todayTotal = contacts.filter(c => c.followup_date && isDueToday(c.followup_date)).length;

  const handleReschedule = async (contact, days) => {
    const newDate = addDays(days);
    await updateContact(contact.id, { followup_date: newDate });
  };

  const handleOpenCall = (contact) => {
    setActiveCallContact(contact);
    setCallModalOpen(true);
  };

  const handleOpenEdit = (contact) => {
    setContactToEdit(contact);
    setContactModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Follow-up Tracker</h2>
          <p>
            Stay on top of callbacks, recruiter responses, and interview follow-ups.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="chips-bar" style={{ borderRadius: '10px 10px 0 0', border: '1px solid #dfe6f0', borderBottom: 'none' }}>
        <button
          className={`chip ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Due ({overdueTotal + todayTotal})
        </button>
        <button
          className={`chip ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue Only ({overdueTotal})
        </button>
        <button
          className={`chip ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Due Today ({todayTotal})
        </button>
      </div>

      {/* Panel */}
      <section className="panel" style={{ borderRadius: '0 0 10px 10px' }}>
        {dueContacts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎉</span>
            <h4>All caught up!</h4>
            <p>No pending follow-ups right now. Great job keeping your calling pipeline active!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>HR Contact & Company</th>
                  <th>Phone Number</th>
                  <th>Status</th>
                  <th>Follow-up Due</th>
                  <th>Next Action</th>
                  <th>Quick Reschedule</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dueContacts.map(c => {
                  const overdue = isOverdue(c.followup_date);
                  const daysOverdue = getOverdueDays(c.followup_date);

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
                        <StatusBadge status={c.status} />
                      </td>
                      <td>
                        {overdue ? (
                          <div style={{ color: '#b42318', fontWeight: 700, fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={13} />
                              <span>{formatDate(c.followup_date)}</span>
                            </div>
                            <span style={{ fontSize: '11px', display: 'block' }}>
                              (Overdue by {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'})
                            </span>
                          </div>
                        ) : (
                          <div style={{ color: '#a65a00', fontWeight: 700, fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} />
                              <span>Today ({formatDate(c.followup_date)})</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569' }}>
                        {c.next_action || 'Call again'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ padding: '3px 7px', fontSize: '11px' }}
                            onClick={() => handleReschedule(c, 1)}
                            title="Reschedule to tomorrow"
                          >
                            +1d
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ padding: '3px 7px', fontSize: '11px' }}
                            onClick={() => handleReschedule(c, 3)}
                            title="Reschedule +3 days"
                          >
                            +3d
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ padding: '3px 7px', fontSize: '11px' }}
                            onClick={() => handleReschedule(c, 7)}
                            title="Reschedule +1 week"
                          >
                            +1w
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleOpenCall(c)}
                            title="Log Call Outcome"
                          >
                            <PhoneCall size={13} />
                            <span>Log Call</span>
                          </button>
                          <button
                            className="btn btn-sm btn-icon"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Contact"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modals */}
      <CallModal
        isOpen={callModalOpen}
        onClose={() => {
          setCallModalOpen(false);
          setActiveCallContact(null);
        }}
        contact={activeCallContact}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setContactToEdit(null);
        }}
        contactToEdit={contactToEdit}
      />
    </div>
  );
}

