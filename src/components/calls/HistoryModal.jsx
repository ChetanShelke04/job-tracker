import React, { useState, useEffect } from 'react';
import { useContacts } from '../../context/ContactsContext';
import { formatDateTime, formatDate } from '../../lib/dates';
import StatusBadge from '../common/StatusBadge';
import { X, PhoneCall, Clock, Calendar } from 'lucide-react';

export default function HistoryModal({ isOpen, onClose, contact = null, onLogNewCall = null }) {
  const { fetchContactCalls } = useContacts();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && contact) {
      setLoading(true);
      fetchContactCalls(contact.id).then(data => {
        setCalls(data);
        setLoading(false);
      });
    }
  }, [isOpen, contact, fetchContactCalls]);

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

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Call History: {contact.name}</h3>
            <p>{contact.company} · {contact.phone}</p>
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

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#66748b' }}>
              Loading call logs…
            </div>
          ) : calls.length === 0 ? (
            <div className="empty-state">
              <Clock size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
              <h4>No calls logged yet</h4>
              <p>You haven't recorded any conversations with this HR contact yet.</p>
              {onLogNewCall && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onClose();
                    onLogNewCall(contact);
                  }}
                >
                  <PhoneCall size={14} />
                  <span>Log First Call</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {calls.map((call, idx) => (
                <div
                  key={call.id || idx}
                  style={{
                    background: '#f8faff',
                    border: '1px solid #dfe6f0',
                    borderRadius: '8px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StatusBadge status={call.outcome} />
                      <span style={{ fontSize: '12px', color: '#66748b', fontWeight: 500 }}>
                        {formatDateTime(call.called_at)}
                      </span>
                    </div>

                    {call.followup_date && (
                      <span style={{
                        fontSize: '12px',
                        color: '#6941c6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600
                      }}>
                        <Calendar size={12} />
                        Next: {formatDate(call.followup_date)}
                      </span>
                    )}
                  </div>

                  <p style={{
                    fontSize: '13px',
                    color: call.notes ? '#182238' : '#94a3b8',
                    fontStyle: call.notes ? 'normal' : 'italic',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {call.notes || 'No discussion notes logged.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {onLogNewCall && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onLogNewCall(contact);
                }}
              >
                <PhoneCall size={14} />
                <span>Log New Call</span>
              </button>
            )}
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

