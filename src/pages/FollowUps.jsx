import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab support from URL param or state (e.g. ?tab=overdue or ?tab=today)
  const activeTab = searchParams.get('tab') || 'all';

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);

  const overdueTotal = contacts.filter(c => c.followup_date && isOverdue(c.followup_date)).length;
  const todayTotal = contacts.filter(c => c.followup_date && isDueToday(c.followup_date)).length;

  const dueContacts = useMemo(() => {
    return contacts.filter(c => {
      if (!c.followup_date) return false;
      const overdue = isOverdue(c.followup_date);
      const dueToday = isDueToday(c.followup_date);

      if (activeTab === 'overdue') return overdue;
      if (activeTab === 'today') return dueToday;
      return overdue || dueToday;
    }).sort((a, b) => {
      return (a.followup_date || '').localeCompare(b.followup_date || '');
    });
  }, [contacts, activeTab]);

  const handleTabChange = (tab) => {
    if (tab === 'all') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

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
      {/* Banner */}
      <div className="page-title-banner">
        <div>
          <h2>Follow-up Manager</h2>
          <p>Prioritize recruiter callbacks, response checks, and interview follow-ups.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-chips-bar" style={{ borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Due ({overdueTotal + todayTotal})
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => handleTabChange('overdue')}
        >
          <span style={{ color: activeTab === 'overdue' ? '#ffffff' : '#dc2626' }}>●</span>
          Overdue ({overdueTotal})
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => handleTabChange('today')}
        >
          <span style={{ color: activeTab === 'today' ? '#ffffff' : '#d97706' }}>●</span>
          Due Today ({todayTotal})
        </button>
      </div>

      {/* Panel */}
      <section className="panel" style={{ borderRadius: '0 0 10px 10px' }}>
        {dueContacts.length === 0 ? (
          <div className="empty-view-state">
            <div className="empty-view-icon">🎉</div>
            <h4>All caught up!</h4>
            <p>No follow-ups pending in this view. Great job staying on top of outreach!</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-container desktop-table-view">
              <table>
                <thead>
                  <tr>
                    <th>HR Contact & Company</th>
                    <th>Phone</th>
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
                          <StatusBadge status={c.status} />
                        </td>
                        <td>
                          {overdue ? (
                            <div style={{ color: '#dc2626', fontWeight: 600, fontSize: '13px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={13} />
                                <span>{formatDate(c.followup_date)}</span>
                              </div>
                              <span style={{ fontSize: '11px', display: 'block', fontWeight: 500 }}>
                                (Overdue by {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'})
                              </span>
                            </div>
                          ) : (
                            <div style={{ color: '#d97706', fontWeight: 600, fontSize: '13px' }}>
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
                              className="btn btn-sm btn-ghost"
                              style={{ padding: '2px 7px', fontSize: '11.5px', border: '1px solid #e2e8f0' }}
                              onClick={() => handleReschedule(c, 1)}
                              title="Reschedule to tomorrow"
                            >
                              +1d
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              style={{ padding: '2px 7px', fontSize: '11.5px', border: '1px solid #e2e8f0' }}
                              onClick={() => handleReschedule(c, 3)}
                              title="Reschedule +3 days"
                            >
                              +3d
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              style={{ padding: '2px 7px', fontSize: '11.5px', border: '1px solid #e2e8f0' }}
                              onClick={() => handleReschedule(c, 7)}
                              title="Reschedule +1 week"
                            >
                              +1w
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="row-actions-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleOpenCall(c)}
                              title="Log Call Outcome"
                            >
                              <PhoneCall size={12} />
                              <span>Log Call</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-ghost"
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

            {/* Mobile Touch Cards View */}
            <div className="mobile-card-stack">
              {dueContacts.map(c => {
                const overdue = isOverdue(c.followup_date);
                const daysOverdue = getOverdueDays(c.followup_date);

                return (
                  <div key={c.id} className="crm-mobile-card">
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-title">{c.name}</div>
                        <div className="mobile-card-sub">{c.company}</div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="mobile-card-phone-row">
                      <a href={`tel:${c.phone}`} className="phone-action-link" style={{ fontSize: '14px' }}>
                        <Phone size={14} />
                        <span>{c.phone}</span>
                      </a>
                    </div>

                    <div className="mobile-card-metadata">
                      <div>
                        <span style={{ color: '#64748b' }}>Due: </span>
                        <span className={overdue ? 'due-indicator' : 'today-indicator'}>
                          {overdue ? `${formatDate(c.followup_date)} (${daysOverdue}d overdue)` : 'Today'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Action: </span>
                        <span>{c.next_action || 'Call again'}</span>
                      </div>
                    </div>

                    {/* Quick Reschedule Row on Mobile */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748b', alignSelf: 'center' }}>Reschedule:</span>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleReschedule(c, 1)}
                      >
                        +1 Day
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleReschedule(c, 3)}
                      >
                        +3 Days
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleReschedule(c, 7)}
                      >
                        +1 Week
                      </button>
                    </div>

                    <div className="mobile-card-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => handleOpenCall(c)}
                      >
                        <PhoneCall size={14} />
                        <span>Log Call</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
