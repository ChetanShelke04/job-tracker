import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PhoneCall, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, Mail } from 'lucide-react';

export default function Login() {
  const { login, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnconfirmedEmail(false);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your username or email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      await login(cleanId, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Login failed.';
      setError(msg);
      if (msg.toLowerCase().includes('email confirmation') || msg.toLowerCase().includes('not confirmed')) {
        setUnconfirmedEmail(true);
      }
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
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            Job Tracker CRM
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
            Sign in with your username or registered email
          </p>
        </div>

        {/* Supabase Not Configured Warning */}
        {!isConfigured && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            <strong>Configuration Notice:</strong> Please check your Supabase credentials in <code>.env</code>.
          </div>
        )}

        {/* Error Alert */}
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
            <div>
              <div>{error}</div>
              {unconfirmedEmail && (
                <div style={{ marginTop: '8px' }}>
                  <Link
                    to="/verify-email"
                    style={{
                      color: '#2563eb',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      fontSize: '12.5px'
                    }}
                  >
                    Go to Verification & Resend Email →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="login-identifier"
              style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
            >
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                required
                placeholder="e.g. chetan or user@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px 0 36px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
              />
              <User
                size={16}
                style={{ position: 'absolute', left: '11px', top: '13px', color: '#94a3b8' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="login-password"
                style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 40px 0 36px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
              />
              <Lock
                size={16}
                style={{ position: 'absolute', left: '11px', top: '13px', color: '#94a3b8' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '11px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '2px'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="btn btn-primary"
            style={{
              height: '44px',
              marginTop: '8px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Footer links */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '13px',
          color: '#64748b'
        }}>
          Don't have an account yet?{' '}
          <Link
            to="/register"
            style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
