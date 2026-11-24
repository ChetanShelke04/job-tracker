import React from 'react';
import { STATUS_COLORS, APPLICATION_STATUS_COLORS } from '../../lib/constants';

export default function StatusBadge({ status, type = 'contact' }) {
  const palette = type === 'application' ? APPLICATION_STATUS_COLORS : STATUS_COLORS;
  const config = palette[status] || {
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1'
  };

  return (
    <span
      className="status-pill"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border || 'transparent'}`
      }}
    >
      <span className="status-dot" style={{ backgroundColor: config.text }} />
      <span>{status || 'Not Set'}</span>
    </span>
  );
}
