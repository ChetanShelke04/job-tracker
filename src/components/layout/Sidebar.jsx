import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../context/ContactsContext';
import { isDueToday, isOverdue } from '../../lib/dates';
import {
  PhoneCall,
  LayoutDashboard,
  Users,
  CalendarClock,
  Briefcase,
  FileSpreadsheet,
  Trash2,
  LogOut,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';

export default function Sidebar({ onItemClick = null, isMobileDrawer = false }) {
  const { user, username, logout } = useAuth();
  const { contacts, applications, trashContacts, trashApplications, saveStatus } = useContacts();
  const navigate = useNavigate();

  // Due or overdue count
  const dueCount = contacts.filter(
    c => c.followup_date && (isDueToday(c.followup_date) || isOverdue(c.followup_date))
  ).length;

  const totalTrash = trashContacts.length + trashApplications.length;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/contacts', label: 'HR Contacts', icon: Users, badge: contacts.length },
    { to: '/follow-ups', label: 'Follow-ups', icon: CalendarClock, badge: dueCount, badgeClass: dueCount > 0 ? 'due' : 'neutral' },
    { to: '/applications', label: 'Job Applications', icon: Briefcase, badge: applications.length },
    { to: '/import-export', label: 'Import / Export', icon: FileSpreadsheet },
    { to: '/trash', label: 'Trash', icon: Trash2, badge: totalTrash > 0 ? totalTrash : null }
  ];

  return (
    <>
      <div className="sidebar-header">
        <NavLink to="/" className="brand-link" onClick={onItemClick}>
          <div className="brand-icon-box">
            <PhoneCall size={17} />
          </div>
          <span className="brand-title">Job Tracker</span>
        </NavLink>

        {isMobileDrawer && (
          <button
            type="button"
            className="btn btn-sm btn-icon btn-ghost"
            onClick={onItemClick}
            aria-label="Close Navigation"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-title">Workspace</span>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onItemClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <div className="sidebar-link-content">
                <Icon size={16} />
                <span>{link.label}</span>
              </div>
              {link.badge != null && link.badge !== 0 && (
                <span className={`count-badge ${link.badgeClass || 'neutral'}`}>
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {/* Sync status */}
        <div className={`sync-status-indicator ${saveStatus}`}>
          {saveStatus === 'saving' && (
            <>
              <RefreshCw size={12} className="spin-loader" />
              <span>Syncing…</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 size={12} />
              <span>All changes saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle size={12} />
              <span>Sync error</span>
            </>
          )}
          {saveStatus === 'idle' && (
            <>
              <CheckCircle2 size={12} style={{ opacity: 0.6 }} />
              <span>Cloud connected</span>
            </>
          )}
        </div>

        {/* User profile row */}
        <div className="user-profile-row">
          <div className="user-info-box" title={user?.email || username}>
            <div className="avatar-circle">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="user-meta-text">
              <div className="user-meta-name">{username}</div>
              <div className="user-meta-role">Active Account</div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            title="Sign out"
            style={{ padding: '6px' }}
          >
            <LogOut size={15} style={{ color: '#64748b' }} />
          </button>
        </div>
      </div>
    </>
  );
}
