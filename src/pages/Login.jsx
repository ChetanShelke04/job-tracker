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
      background: 'linear-gradient(135deg, #f4f7fb 0%, #e8f0fe 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(20, 38, 75, 0.08)',
        border: '1px solid #dfe6f0',
        padding: '36px 32px'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#245de8',
            color: '#ffffff',
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(36, 93, 232, 0.3)',
            marginBottom: '12px'
          }}>
            <PhoneCall size={26} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#182238', letterSpacing: '-0.5px' }}>
            Job Tracker
          </h2>
          <p style={{ fontSize: '13px', color: '#66748b', marginTop: '4px' }}>
            {mode === 'login' && 'Sign in to access your HR Calling CRM'}
            {mode === 'register' && 'Create your personal tracker account'}
            {mode === 'forgot' && 'Reset your account password'}
          </p>
        </div>

        {/* Supabase Not Configured Notice */}
        {!isConfigured && (
          <div style={{
            background: '#fff9e9',
            border: '1px solid #f0d49d',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#78500b'
          }}>
            <strong>Supabase Setup Required:</strong> Please configure your Supabase project credentials in <code>.env</code> (<code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>).
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div style={{
            background: '#ffebe9',
            border: '1px solid #fecdca',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            color: '#b42318',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div style={{
            background: '#e1f7e9',
            border: '1px solid #b7ebca',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#137a45',
            fontSize: '13px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
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
                  style={{ paddingLeft: '36px' }}
                />
                <User size={16} style={{
                  position: 'absolute',
                  left: '11px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
              </div>
              <span className="hint">
                Type your username (e.g. chetan) or your full email.
              </span>
            </div>

            {mode !== 'forgot' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="login-password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); }}
                      style={{ background: 'none', border: 'none', color: '#245de8', fontSize: '11px', cursor: 'pointer', padding: 0 }}
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
                    style={{ paddingLeft: '36px', paddingRight: '36px' }}
                  />
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '11px',
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
                      padding: '4px'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </form>

        {/* Mode Toggle Links */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #dfe6f0',
          textAlign: 'center',
          fontSize: '12px',
          color: '#66748b'
        }}>
          {mode === 'login' ? (
            <p>
              New user?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#245de8', fontWeight: 600, cursor: 'pointer' }}
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
                style={{ background: 'none', border: 'none', color: '#245de8', fontWeight: 600, cursor: 'pointer' }}
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

