import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PhoneCall,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Users
} from 'lucide-react';

export default function Register() {
  const { register, checkUsernameAvailable, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' | 'hr'

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Username validation state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available' | 'taken' | 'invalid'

  useEffect(() => {
    const clean = username.trim();
    if (!clean) {
      setUsernameStatus(null);
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('too-short');
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const available = await checkUsernameAvailable(clean);
        setUsernameStatus(available ? 'available' : 'taken');
      } catch (e) {
        setUsernameStatus(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailable]);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2 || score === 3) return { score: 2, label: 'Moderate', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('This username is already taken. Please choose another.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        role
      });

      if (result.needsEmailVerification) {
        setSuccessInfo({
          email: email.trim(),
          message: 'Account created successfully! Please check your inbox and verify your email before logging in.'
        });
      } else {
        // Logged in immediately (if email confirmation is turned off in Supabase)
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
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
      padding: '32px 16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        border: '1px solid #e2e8f0',
        padding: '36px 32px'
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
            marginBottom: '12px'
          }}>
            <PhoneCall size={22} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
            Create Tracker Account
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
            Choose your account role and setup your personal profile
          </p>
        </div>

        {/* Success / Verification Required View */}
        {successInfo ? (
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
              Verify Your Email Address
            </h3>
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
              We sent a confirmation link to <strong style={{ color: '#0f172a' }}>{successInfo.email}</strong>. Please check your inbox and click the verification link to activate your account.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/verify-email" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Go to Email Verification Page
              </Link>
              <Link to="/login" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Error banner */}
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Account Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Account Type <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setRole('user')}
                    style={{
                      border: role === 'user' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: role === 'user' ? '#eff6ff' : '#ffffff',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Briefcase size={16} style={{ color: role === 'user' ? '#2563eb' : '#64748b' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: role === 'user' ? '#1e40af' : '#0f172a' }}>
                        User
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Job Seeker</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setRole('hr')}
                    style={{
                      border: role === 'hr' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: role === 'hr' ? '#eff6ff' : '#ffffff',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Users size={16} style={{ color: role === 'hr' ? '#2563eb' : '#64748b' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: role === 'hr' ? '#1e40af' : '#0f172a' }}>
                        HR Recruiter
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>CRM & Outreach</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="reg-fullname" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  placeholder="e.g. Chetan Shelke"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Username with Availability Indicator */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label htmlFor="reg-username" style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                    Username <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  {usernameChecking && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Checking…</span>
                  )}
                  {!usernameChecking && usernameStatus === 'available' && (
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>✓ Available</span>
                  )}
                  {!usernameChecking && usernameStatus === 'taken' && (
                    <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>✗ Already taken</span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-username"
                    type="text"
                    required
                    placeholder="e.g. Chetan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px 0 34px',
                      border: usernameStatus === 'taken' ? '1px solid #f87171' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                  <User size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: '#94a3b8' }} />
                </div>
              </div>

              {/* Real Email */}
              <div>
                <label htmlFor="reg-email" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Email Address <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="e.g. chetan@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px 0 34px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                  <Mail size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: '#94a3b8' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Real address required for verification link and password recovery.
                </span>
              </div>

              {/* Password with Strength Indicator */}
              <div>
                <label htmlFor="reg-password" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 38px 0 34px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                  <Lock size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: '#94a3b8' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {password && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Strength:</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                      <div style={{ flex: 1, borderRadius: '2px', background: strength.score >= 1 ? strength.color : '#e2e8f0' }} />
                      <div style={{ flex: 1, borderRadius: '2px', background: strength.score >= 2 ? strength.color : '#e2e8f0' }} />
                      <div style={{ flex: 1, borderRadius: '2px', background: strength.score >= 3 ? strength.color : '#e2e8f0' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirm-password" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 38px 0 34px',
                      border: confirmPassword && confirmPassword !== password ? '1px solid #f87171' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                  <Lock size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: '#94a3b8' }} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px', display: 'block' }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isConfigured || usernameStatus === 'taken'}
                className="btn btn-primary"
                style={{
                  height: '44px',
                  marginTop: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating Account…' : 'Register Account'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div style={{
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              fontSize: '13px',
              color: '#64748b'
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
