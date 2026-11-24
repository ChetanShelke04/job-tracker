import React from 'react';
import { useContacts } from '../../context/ContactsContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useContacts();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-shelf" aria-live="polite">
      {toasts.map(toast => {
        let IconComponent = Info;
        let toastClass = '';

        if (toast.type === 'success') {
          IconComponent = CheckCircle2;
          toastClass = 'toast-success';
        } else if (toast.type === 'error') {
          IconComponent = AlertCircle;
          toastClass = 'toast-error';
        }

        return (
          <div key={toast.id} className={`toast-item ${toastClass}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconComponent size={16} />
              <span>{toast.message}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {toast.undoAction && (
                <button
                  type="button"
                  className="toast-undo-action"
                  onClick={() => {
                    toast.undoAction();
                    removeToast(toast.id);
                  }}
                >
                  Undo
                </button>
              )}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  opacity: 0.8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
