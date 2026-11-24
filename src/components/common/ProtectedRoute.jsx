import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isEmailVerified, role, loading } = useAuth();
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
          Verifying security credentials…
        </p>
      </div>
    );
  }

  // 1. Must be logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Must be email verified
  if (!isEmailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // 3. Role authorization check (e.g. HR-only routes like /contacts, /follow-ups)
  if (requiredRole && role !== requiredRole) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <ShieldAlert size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            HR Access Required
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
            Your account is currently registered with the <strong>User (Job Seeker)</strong> role. This section contains HR Recruiter calling directories and outreach tools reserved for HR accounts.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <a href="/applications" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Go to My Job Applications
            </a>
            <a href="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
