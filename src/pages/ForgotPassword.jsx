import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PhoneCall, Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cooldown > 0) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please provide a valid registered email address.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(cleanEmail);
      setSent(true);
      // Start 60 second cooldown
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Could not send recovery email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px 16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        border: '1px solid #e2e8f0',
        padding: '36px 30px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: '#2563eb',
            color: '#ffffff',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            marginBottom: '14px'
          }}>
            <PhoneCall size={22} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
            Recover Password
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
            Enter your registered email and we'll send you a password recovery link
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: '#dc2626',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Check Your Inbox
            </h3>
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
              If an account exists for <strong style={{ color: '#0f172a' }}>{email}</strong>, we have sent a secure password reset link. Please click the link to choose a new password.
            </p>

            {cooldown > 0 ? (
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px' }}>
                Resend available in {cooldown}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-sm btn-ghost"
                style={{ marginBottom: '18px' }}
              >
                Resend Email
              </button>
            )}

            <div>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft size={15} />
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="forgot-email" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Registered Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="e.g. chetan@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px 0 36px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '11px', top: '13px', color: '#94a3b8' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isConfigured || cooldown > 0}
              className="btn btn-primary"
              style={{
                height: '44px',
                marginTop: '6px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Sending link…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send Recovery Email'}
              {!loading && cooldown === 0 && <ArrowRight size={16} />}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#64748b',
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft size={15} />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
