import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PhoneCall, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login, register, resetPassword, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!usernameOrEmail.trim()) {
      setError('Please enter your username or email.');
      return;
    }

    if (mode !== 'forgot' && !password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(usernameOrEmail, password);
        navigate(from, { replace: true });
      } else if (mode === 'register') {
        await register(usernameOrEmail, password);
        setInfoMessage('Account created! You can now log in.');
        setMode('login');
      } else if (mode === 'forgot') {
        await resetPassword(usernameOrEmail);
        setInfoMessage('Password reset instructions sent to your email.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
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
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        border: '1px solid #e2e8f0',
        padding: '32px 28px'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#2563eb',
            color: '#ffffff',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            marginBottom: '12px'
          }}>
            <PhoneCall size={20} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
            Job Tracker
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            {mode === 'login' && 'Sign in to access your CRM'}
            {mode === 'register' && 'Create your tracker account'}
            {mode === 'forgot' && 'Reset your account password'}
          </p>
        </div>

        {/* Supabase Not Configured Notice */}
        {!isConfigured && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '18px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            <strong>Supabase Setup Required:</strong> Please configure your Supabase credentials in <code>.env</code>.
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            color: '#dc2626',
            fontSize: '12.5px'
          }}>
            <AlertCircle size={15} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#059669',
            fontSize: '12.5px'
          }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group-item">
              <label htmlFor="login-username">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-username"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. chetan or friend1"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                />
                <User size={15} style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
              </div>
              <span className="field-hint">
                Type your username (e.g. chetan) or your full email.
              </span>
            </div>

            {mode !== 'forgot' && (
              <div className="form-group-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="login-password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); }}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '34px', paddingRight: '34px' }}
                  />
                  <Lock size={15} style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !isConfigured}
              style={{ width: '100%', marginTop: '6px' }}
            >
              <span>
                {loading
                  ? 'Processing…'
                  : mode === 'login'
                  ? 'Sign In to Tracker'
                  : mode === 'register'
                  ? 'Create Account'
                  : 'Send Reset Link'}
              </span>
              {!loading && <ArrowRight size={15} />}
            </button>
          </div>
        </form>

        {/* Footer links */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b'
        }}>
          {mode === 'login' ? (
            <p>
              New user?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
              >
                Register an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
