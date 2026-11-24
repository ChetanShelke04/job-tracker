import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PhoneCall, Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const { user, isEmailVerified, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(user?.email || '');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Check if hash contains confirmation callback parameters
  const [verifiedSuccess, setVerifiedSuccess] = useState(isEmailVerified);

  useEffect(() => {
    if (isEmailVerified) {
      setVerifiedSuccess(true);
    }

    // Listen for auth state change triggered when Supabase parses confirmation URL token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email_confirmed_at) {
        setVerifiedSuccess(true);
      }
    });

    return () => subscription?.unsubscribe();
  }, [isEmailVerified]);

  const handleResend = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess(false);

    if (cooldown > 0) return;

    const targetEmail = email.trim();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setError('Please provide a valid registered email address.');
      return;
    }

    setResending(true);

    try {
      await resendVerificationEmail(targetEmail);
      setResendSuccess(true);
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
      setError(err.message || 'Could not resend verification email.');
    } finally {
      setResending(false);
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
        maxWidth: '440px',
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
            Email Verification
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
            {verifiedSuccess ? 'Account confirmed' : 'Confirm your email to access your workspace'}
          </p>
        </div>

        {verifiedSuccess ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Your email has been verified successfully!
            </h3>
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '22px' }}>
              You can now access all features of your Job Tracker CRM application.
            </p>
            <Link
              to="/"
              className="btn btn-primary"
              style={{
                textDecoration: 'none',
                height: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                fontWeight: 600
              }}
            >
              Continue to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <Mail size={18} style={{ color: '#2563eb', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
                A confirmation link was dispatched to your email during registration. Please open your email client and click the verification link.
              </div>
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

            {resendSuccess && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#059669',
                fontSize: '13px'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>New confirmation link sent! Please check your inbox.</span>
              </div>
            )}

            {/* Resend Form */}
            <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="verify-email-input" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Resend Verification Email
                </label>
                <input
                  id="verify-email-input"
                  type="email"
                  required
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={resending || cooldown > 0}
                className="btn btn-primary"
                style={{
                  height: '42px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: resending || cooldown > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {resending && <RefreshCw size={14} className="spin" />}
                {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
              </button>
            </form>

            <div style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              fontSize: '13px',
              color: '#64748b'
            }}>
              Already verified?{' '}
              <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
