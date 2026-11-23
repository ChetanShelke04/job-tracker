import React, { useState, useEffect, useRef } from 'react';
import { useContacts } from '../../context/ContactsContext';
import { STATUSES, NEXT_ACTIONS } from '../../lib/constants';
import { X, AlertCircle } from 'lucide-react';

export default function ContactModal({ isOpen, onClose, contactToEdit = null }) {
  const { addContact, updateContact, checkDuplicatePhone } = useContacts();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Not Called');
  const [followupDate, setFollowupDate] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (contactToEdit) {
        setName(contactToEdit.name || '');
        setCompany(contactToEdit.company || '');
        setPhone(contactToEdit.phone || '');
        setEmail(contactToEdit.email || '');
        setStatus(contactToEdit.status || 'Not Called');
        setFollowupDate(contactToEdit.followup_date || '');
        setInterviewDate(contactToEdit.interview_date || '');
        setInterviewTime(contactToEdit.interview_time || '');
        setNextAction(contactToEdit.next_action || '');
        setNotes(contactToEdit.notes || '');
      } else {
        setName('');
        setCompany('');
        setPhone('');
        setEmail('');
        setStatus('Not Called');
        setFollowupDate('');
        setInterviewDate('');
        setInterviewTime('');
        setNextAction('');
        setNotes('');
      }
      setError('');
      setDuplicateWarning(null);
      setTimeout(() => nameInputRef.current?.focus(), 60);
    }
  }, [isOpen, contactToEdit]);

  // Live duplicate checking on phone input
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    if (val.trim().length >= 6) {
      const dup = checkDuplicatePhone(val, contactToEdit?.id);
      if (dup) {
        setDuplicateWarning(`Already saved as ${dup.name} (${dup.company})`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !company.trim() || !phone.trim()) {
      setError('Name, Company, and Phone number are required.');
      return;
    }

    if (duplicateWarning) {
      setError('Please resolve the duplicate phone number before saving.');
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      status,
      followup_date: followupDate || null,
      interview_date: interviewDate || null,
      interview_time: interviewTime.trim() || null,
      next_action: nextAction || null,
      notes: notes.trim() || null
    };

    try {
      if (contactToEdit) {
        await updateContact(contactToEdit.id, payload);
      } else {
        await addContact(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{contactToEdit ? 'Edit HR Contact' : 'Add New HR Contact'}</h3>
            <p>Required fields are marked with *</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: '#ffebe9',
                color: '#b42318',
                border: '1px solid #fecdca',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="hr-name">HR Name <span className="required">*</span></label>
                <input
                  id="hr-name"
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Company <span className="required">*</span></label>
                <input
                  id="company"
                  type="text"
                  required
                  placeholder="e.g. Infosys / Tech Mahindra"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={handlePhoneChange}
                />
                {duplicateWarning && (
                  <span style={{ color: '#b42318', fontSize: '11px', fontWeight: 600 }}>
                    ⚠️ {duplicateWarning}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. priya@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Current Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="next-action">Suggested Next Action</label>
                <select
                  id="next-action"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                >
                  <option value="">Not Set</option>
                  {NEXT_ACTIONS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="followup-date">Next Follow-up Date</label>
                <input
                  id="followup-date"
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="interview-date">Interview Date</label>
                <input
                  id="interview-date"
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">Notes / Background</label>
                <textarea
                  id="notes"
                  placeholder="Role discussed, experience required, tech stack, job portal link, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || Boolean(duplicateWarning)}
            >
              {saving ? 'Saving…' : contactToEdit ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

