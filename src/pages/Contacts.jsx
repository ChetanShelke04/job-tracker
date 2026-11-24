import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContacts } from '../context/ContactsContext';
import { STATUSES } from '../lib/constants';
import { formatDate, isOverdue, isDueToday } from '../lib/dates';
import { exportToCsv } from '../lib/csv';
import StatusBadge from '../components/common/StatusBadge';
import ContactModal from '../components/contacts/ContactModal';
import CallModal from '../components/calls/CallModal';
import HistoryModal from '../components/calls/HistoryModal';
import BulkModal from '../components/contacts/BulkModal';
import {
  Search,
  Phone,
  PhoneCall,
  History,
  Edit2,
  Trash2,
  Plus,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  RotateCcw,
  Clock
} from 'lucide-react';

export default function Contacts() {
  const { contacts, softDeleteContact } = useContacts();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [sortOption, setSortOption] = useState('overdue_first');

  const chipParam = searchParams.get('filter') || 'all';

  // Modals state
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistoryContact, setActiveHistoryContact] = useState(null);

  // Distinct list of companies
  const companies = useMemo(() => {
    const set = new Set();
    contacts.forEach(c => {
      if (c.company) set.add(c.company.trim());
    });
    return Array.from(set).sort();
  }, [contacts]);

  // Filtered & Sorted Contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        (c.next_action && c.next_action.toLowerCase().includes(q))
      );
    }

    // 2. Status Dropdown
    if (selectedStatus !== 'ALL') {
      result = result.filter(c => c.status === selectedStatus);
    }

    // 3. Company Dropdown
    if (selectedCompany !== 'ALL') {
      result = result.filter(c => c.company === selectedCompany);
    }

    // 4. Quick Filter Chips
    if (chipParam === 'due') {
      result = result.filter(c => c.followup_date && (isDueToday(c.followup_date) || isOverdue(c.followup_date)));
    } else if (chipParam === 'never-called') {
      result = result.filter(c => c.status === 'Not Called' && !c.last_call_at);
    } else if (chipParam === 'connected') {
      result = result.filter(c => ['Connected', 'Resume Requested', 'Opportunity Shared'].includes(c.status));
    } else if (chipParam === 'interviews') {
      result = result.filter(c => c.status === 'Interview Scheduled' || Boolean(c.interview_date));
    } else if (chipParam === 'dnc') {
      result = result.filter(c => c.status === 'Do Not Contact');
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortOption === 'overdue_first') {
        const aOverdue = a.followup_date && isOverdue(a.followup_date);
        const bOverdue = b.followup_date && isOverdue(b.followup_date);

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        if (a.followup_date && b.followup_date) {
          return a.followup_date.localeCompare(b.followup_date);
        }
        if (a.followup_date) return -1;
        if (b.followup_date) return 1;
        return (b.created_at || '').localeCompare(a.created_at || '');
      }

      if (sortOption === 'created_desc') {
        return (b.created_at || '').localeCompare(a.created_at || '');
      }

      if (sortOption === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }

      if (sortOption === 'company_asc') {
        return (a.company || '').localeCompare(b.company || '');
      }

      return 0;
    });

    return result;
  }, [contacts, searchQuery, selectedStatus, selectedCompany, chipParam, sortOption]);

  const handleChipChange = (chipKey) => {
    if (chipKey === 'all') {
      searchParams.delete('filter');
    } else {
      searchParams.set('filter', chipKey);
    }
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedCompany('ALL');
    searchParams.delete('filter');
    setSearchParams(searchParams);
  };

  const handleExportCsv = () => {
    if (filteredContacts.length === 0) return;
    exportToCsv(
      `job-tracker-contacts-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredContacts,
      ['name', 'company', 'phone', 'status', 'followup_date', 'interview_date', 'next_action', 'notes']
    );
  };

  const handleOpenEdit = (contact) => {
    setContactToEdit(contact);
    setContactModalOpen(true);
  };

  const handleOpenCall = (contact) => {
    setActiveCallContact(contact);
    setCallModalOpen(true);
  };

  const handleOpenHistory = (contact) => {
    setActiveHistoryContact(contact);
    setHistoryModalOpen(true);
  };

  const handleDelete = async (contact) => {
    if (window.confirm(`Move "${contact.name}" (${contact.company}) to Trash?`)) {
      await softDeleteContact(contact.id);
    }
  };

  return (
    <div>
      {/* Banner */}
      <div className="page-title-banner">
        <div>
          <h2>HR & Recruiter Directory</h2>
          <p>
            Showing {filteredContacts.length} of {contacts.length} total contacts
          </p>
        </div>
        <div className="page-banner-actions">
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleExportCsv}
            title="Export contacts to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
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
            onClick={() => {
              setContactToEdit(null);
              setContactModalOpen(true);
            }}
          >
            <Plus size={14} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Main CRM Panel */}
      <section className="panel">
        {/* Toolbar */}
        <div className="crm-toolbar">
          <div className="search-input-wrap">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by name, company, phone, notes…"
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
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="toolbar-select"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            aria-label="Filter company"
          >
            <option value="ALL">All Companies ({companies.length})</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="toolbar-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            aria-label="Sort order"
          >
            <option value="overdue_first">Sort: Overdue & Upcoming First</option>
            <option value="created_desc">Sort: Newest Added First</option>
            <option value="name_asc">Sort: Name (A to Z)</option>
            <option value="company_asc">Sort: Company (A to Z)</option>
          </select>

          {(searchQuery || selectedStatus !== 'ALL' || selectedCompany !== 'ALL' || chipParam !== 'all') && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleClearFilters}
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Filter Chips Bar */}
        <div className="filter-chips-bar">
          <button
            type="button"
            className={`filter-chip ${chipParam === 'all' ? 'active' : ''}`}
            onClick={() => handleChipChange('all')}
          >
            All Contacts
          </button>
          <button
            type="button"
            className={`filter-chip ${chipParam === 'due' ? 'active' : ''}`}
            onClick={() => handleChipChange('due')}
          >
            Follow-ups Due
          </button>
          <button
            type="button"
            className={`filter-chip ${chipParam === 'never-called' ? 'active' : ''}`}
            onClick={() => handleChipChange('never-called')}
          >
            Never Called
          </button>
          <button
            type="button"
            className={`filter-chip ${chipParam === 'connected' ? 'active' : ''}`}
            onClick={() => handleChipChange('connected')}
          >
            Connected
          </button>
          <button
            type="button"
            className={`filter-chip ${chipParam === 'interviews' ? 'active' : ''}`}
            onClick={() => handleChipChange('interviews')}
          >
            Interviews
          </button>
          <button
            type="button"
            className={`filter-chip ${chipParam === 'dnc' ? 'active' : ''}`}
            onClick={() => handleChipChange('dnc')}
          >
            Do Not Contact
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="table-container desktop-table-view">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>HR Name & Company</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Last Call</th>
                <th>Next Follow-up</th>
                <th>Next Action</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((c, index) => {
                const overdue = isOverdue(c.followup_date);
                const dueToday = isDueToday(c.followup_date);

                return (
                  <tr key={c.id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{index + 1}</td>
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
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatDate(c.last_call_at)}
                    </td>
                    <td>
                      {c.followup_date ? (
                        <span className={overdue ? 'due-indicator' : dueToday ? 'today-indicator' : ''}>
                          {overdue && <AlertTriangle size={12} />}
                          {formatDate(c.followup_date)}
                          {overdue && ' (Due)'}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>
                      {c.next_action || '—'}
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
                          <span>Call</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-ghost"
                          onClick={() => handleOpenHistory(c)}
                          title="Call History"
                        >
                          <History size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-ghost"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Contact"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-danger"
                          onClick={() => handleDelete(c)}
                          title="Move to Trash"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Touch Cards View (Touch-optimized, min 44px buttons, zero horizontal scroll) */}
        <div className="mobile-card-stack">
          {filteredContacts.map(c => {
            const overdue = isOverdue(c.followup_date);
            const dueToday = isDueToday(c.followup_date);

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
                    <span style={{ color: '#64748b' }}>Follow-up: </span>
                    <span className={overdue ? 'due-indicator' : dueToday ? 'today-indicator' : ''}>
                      {formatDate(c.followup_date)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Action: </span>
                    <span>{c.next_action || '—'}</span>
                  </div>
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
                    onClick={() => handleOpenHistory(c)}
                    title="History"
                  >
                    <History size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon"
                    onClick={() => handleOpenEdit(c)}
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-danger"
                    onClick={() => handleDelete(c)}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <div className="empty-view-state">
            <div className="empty-view-icon">🔍</div>
            <h4>No contacts match your filters</h4>
            <p>Try clearing your search query or status filter.</p>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleClearFilters}>
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Modals */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setContactToEdit(null);
        }}
        contactToEdit={contactToEdit}
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

      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setActiveHistoryContact(null);
        }}
        contact={activeHistoryContact}
        onLogNewCall={(c) => handleOpenCall(c)}
      />
    </div>
  );
}
