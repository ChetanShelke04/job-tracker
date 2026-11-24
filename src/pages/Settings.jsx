import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useContacts } from '../context/ContactsContext';
import {
  User,
  Shield,
  Key,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  Users
} from 'lucide-react';

export default function Settings() {
  const { user, profile, username, fullName, role, isHR, changePassword, updateProfile } = useAuth();
  const { showToast } = useContacts();

  // Profile edit state
  const [editName, setEditName] = useState(fullName || '');
  const [editUsername, setEditUsername] = useState(username || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!editName.trim() || !editUsername.trim()) {
      setProfileError('Full name and username cannot be blank.');
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({
        fullName: editName,
        username: editUsername
      });
      setProfileSuccess('Profile details updated successfully!');
      showToast('Profile updated.', 'success');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully! Keep your new password secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Password updated successfully.', 'success');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div className="page-title-banner">
        <div>
          <h2>Account & Security Settings</h2>
          <p>Manage your account profile, role credentials, and password security</p>
        </div>
      </div>

      {/* Legacy Fake Email Warning if applicable */}
      {user?.email?.endsWith('@jobtracker.app') && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={20} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>
              Action Recommended: Set Real Email Address
            </h4>
            <p style={{ fontSize: '13px', color: '#b45309', lineHeight: 1.5 }}>
              Your account currently uses the legacy internal identifier (<code>{user.email}</code>). In order to receive email verification links and password recovery emails, please contact your administrator or update your registered email address.
            </p>
          </div>
        </div>
      )}

      {/* Grid: 2 Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Panel 1: Profile Information */}
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <User size={18} style={{ color: '#2563eb' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Profile Details</h3>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '18px'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: isHR ? '#eff6ff' : '#ecfdf5',
              color: isHR ? '#2563eb' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px'
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                {fullName}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                @{username} · {user?.email}
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: isHR ? '#dbeafe' : '#d1fae5',
                  color: isHR ? '#1e40af' : '#065f46'
                }}>
                  {isHR ? <Users size={11} /> : <Briefcase size={11} />}
                  {isHR ? 'HR Recruiter' : 'Job Seeker (User)'}
                </span>
              </div>
            </div>
          </div>

          {profileError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '14px', color: '#dc2626', fontSize: '12.5px' }}>
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px', marginBottom: '14px', color: '#059669', fontSize: '12.5px' }}>
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Username
              </label>
              <input
                type="text"
                required
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                style={{ width: '100%', height: '38px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Email Address (Managed by Supabase Auth)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                style={{ width: '100%', height: '38px', padding: '0 10px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: '6px' }}
            >
              {profileSaving ? 'Saving…' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Panel 2: Change Password */}
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Key size={18} style={{ color: '#2563eb' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Change Password</h3>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
            To safeguard your data, you must provide your current password before saving a new one.
          </p>

          {passwordError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '14px', color: '#dc2626', fontSize: '12.5px' }}>
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px', marginBottom: '14px', color: '#059669', fontSize: '12.5px' }}>
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 36px 0 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: '8px', top: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 36px 0 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: '8px', top: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Confirm New Password
              </label>
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="Repeat new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: '6px' }}
            >
              {passwordSaving ? 'Verifying & Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
