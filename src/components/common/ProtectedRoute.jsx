import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '12px',
        background: '#f4f7fb'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          border: '3px solid #dfe6f0',
          borderTopColor: '#245de8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#66748b', fontSize: '13px', fontWeight: 500 }}>
          Loading your session…
        </p>
      </div>
    );
  }

  if (!user) {
    // Preserve current location so user can be redirected back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

