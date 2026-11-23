import React, { useState, useEffect } from 'react';
import { useContacts } from '../../context/ContactsContext';
import { OUTCOMES } from '../../lib/constants';
import { addDays, todayISO } from '../../lib/dates';
import { X, PhoneCall, Calendar } from 'lucide-react';

export default function CallModal({ isOpen, onClose, contact = null }) {
  const { logCall } = useContacts();

  const [outcome, setOutcome] = useState('Connected');
  const [notes, setNotes] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOutcome('Connected');
      setNotes('');
      // Default follow-up date: today + 3 days
      setFollowupDate(addDays(3));
      setError('');
    }
  }, [isOpen, contact]);

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

  if (!isOpen || !contact) return null;

  const handleShortcutDate = (days) => {
    if (days === null) {
      setFollowupDate('');
    } else {
      setFollowupDate(addDays(days));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await logCall({
        contactId: contact.id,
        outcome,
        notes: notes.trim(),
        followupDate: followupDate || null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to log call.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Log Call Outcome</h3>
            <p>
              Calling <strong style={{ color: '#245de8' }}>{contact.name}</strong> at{' '}
              {contact.company} ({contact.phone})
            </p>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label htmlFor="call-outcome">Call Outcome <span className="required">*</span></label>
                <select
                  id="call-outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  required
                >
                  {OUTCOMES.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="call-notes">Discussion Notes</label>
                <textarea
                  id="call-notes"
                  placeholder="What was discussed? CTC range, interview rounds, email sent, callbacks requested…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="call-followup">Next Follow-up Date</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ padding: '2px 7px', fontSize: '11px' }}
                      onClick={() => handleShortcutDate(1)}
                    >
                      +1d
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ padding: '2px 7px', fontSize: '11px' }}
                      onClick={() => handleShortcutDate(3)}
                    >
                      +3d
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ padding: '2px 7px', fontSize: '11px' }}
                      onClick={() => handleShortcutDate(7)}
                    >
                      +1w
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ padding: '2px 7px', fontSize: '11px' }}
                      onClick={() => handleShortcutDate(null)}
                    >
                      None
                    </button>
                  </div>
                </div>
                <input
                  id="call-followup"
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <PhoneCall size={14} />
              <span>{submitting ? 'Saving…' : 'Save Call & Update Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

