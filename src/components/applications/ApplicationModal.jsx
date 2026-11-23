import React, { useState, useEffect, useRef } from 'react';
import { useContacts } from '../../context/ContactsContext';
import { APPLICATION_STATUSES } from '../../lib/constants';
import { todayISO } from '../../lib/dates';
import { X, Briefcase } from 'lucide-react';

export default function ApplicationModal({ isOpen, onClose, appToEdit = null }) {
  const { addApplication, updateApplication } = useContacts();

  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [applicationDate, setApplicationDate] = useState(todayISO());
  const [expectedCtc, setExpectedCtc] = useState('');
  const [offeredCtc, setOfferedCtc] = useState('');
  const [status, setStatus] = useState('Applied');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const companyInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (appToEdit) {
        setCompanyName(appToEdit.company_name || '');
        setJobTitle(appToEdit.job_title || '');
        setLocation(appToEdit.location || '');
        setJobUrl(appToEdit.job_url || '');
        setApplicationDate(appToEdit.application_date || todayISO());
        setExpectedCtc(appToEdit.expected_ctc ?? '');
        setOfferedCtc(appToEdit.offered_ctc ?? '');
        setStatus(appToEdit.application_status || 'Applied');
        setRecruiterName(appToEdit.recruiter_name || '');
        setRecruiterPhone(appToEdit.recruiter_phone || '');
        setNotes(appToEdit.notes || '');
      } else {
        setCompanyName('');
        setJobTitle('');
        setLocation('');
        setJobUrl('');
        setApplicationDate(todayISO());
        setExpectedCtc('');
        setOfferedCtc('');
        setStatus('Applied');
        setRecruiterName('');
        setRecruiterPhone('');
        setNotes('');
      }
      setError('');
      setTimeout(() => companyInputRef.current?.focus(), 60);
    }
  }, [isOpen, appToEdit]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim() || !jobTitle.trim()) {
      setError('Company Name and Job Title are required.');
      return;
    }

    setSaving(true);
    const payload = {
      company_name: companyName.trim(),
      job_title: jobTitle.trim(),
      location: location.trim() || null,
      job_url: jobUrl.trim() || null,
      application_date: applicationDate || null,
      expected_ctc: expectedCtc ? Number(expectedCtc) : null,
      offered_ctc: offeredCtc ? Number(offeredCtc) : null,
      application_status: status,
      recruiter_name: recruiterName.trim() || null,
      recruiter_phone: recruiterPhone.trim() || null,
      notes: notes.trim() || null
    };

    try {
      if (appToEdit) {
        await updateApplication(appToEdit.id, payload);
      } else {
        await addApplication(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save application.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{appToEdit ? 'Edit Job Application' : 'Add Job Application'}</h3>
            <p>Track job listings, interview rounds, and salary offers</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-icon"
            onClick={onClose}
            aria-label="Close"
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
                fontSize: '13px'
              }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="app-company">Company Name <span className="required">*</span></label>
                <input
                  id="app-company"
                  ref={companyInputRef}
                  type="text"
                  required
                  placeholder="e.g. Swiggy / Google"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="app-title">Job Title <span className="required">*</span></label>
                <input
                  id="app-title"
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="app-status">Application Status</label>
                <select
                  id="app-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {APPLICATION_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="app-date">Date Applied</label>
                <input
                  id="app-date"
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="app-location">Location</label>
                <input
                  id="app-location"
                  type="text"
                  placeholder="e.g. Bengaluru / Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="app-url">Job Posting URL</label>
                <input
                  id="app-url"
                  type="url"
                  placeholder="https://..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="app-expected-ctc">Expected CTC (₹ / annum)</label>
                <input
                  id="app-expected-ctc"
                  type="number"
                  placeholder="e.g. 1800000"
                  value={expectedCtc}
                  onChange={(e) => setExpectedCtc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="app-offered-ctc">Offered CTC (₹ / annum)</label>
                <input
                  id="app-offered-ctc"
                  type="number"
                  placeholder="e.g. 2100000"
                  value={offeredCtc}
                  onChange={(e) => setOfferedCtc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="app-recruiter-name">Recruiter Name</label>
                <input
                  id="app-recruiter-name"
                  type="text"
                  placeholder="e.g. Ananya Roy"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="app-recruiter-phone">Recruiter Phone</label>
                <input
                  id="app-recruiter-phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={recruiterPhone}
                  onChange={(e) => setRecruiterPhone(e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="app-notes">Notes & Interview Details</label>
                <textarea
                  id="app-notes"
                  placeholder="Tech stack, assignment details, interviewers, feedback, notice period discussed…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Briefcase size={14} />
              <span>{saving ? 'Saving…' : appToEdit ? 'Save Changes' : 'Save Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

