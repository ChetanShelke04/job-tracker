import React, { useState } from 'react';
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
  Menu,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function Navbar() {
  const { user, username, logout } = useAuth();
  const { contacts, applications, trashContacts, trashApplications, saveStatus } = useContacts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Count due or overdue follow-ups
  const dueCount = contacts.filter(
    c => c.followup_date && (isDueToday(c.followup_date) || isOverdue(c.followup_date))
  ).length;

  // Count trash items
  const trashTotal = trashContacts.length + trashApplications.length;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="navbar">
        <div className="brand-section">
          <NavLink to="/" className="brand-section" style={{ textDecoration: 'none' }}>
            <div className="brand-logo">
              <PhoneCall size={20} />
            </div>
            <div className="brand-info">
              <h1>Job Tracker</h1>
              <span>HR Calling CRM</span>
            </div>
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/contacts"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Users size={16} />
            <span>HR Contacts</span>
          </NavLink>

          <NavLink
            to="/follow-ups"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <CalendarClock size={16} />
            <span>Follow-ups</span>
            {dueCount > 0 && <span className="nav-badge">{dueCount}</span>}
          </NavLink>

          <NavLink
            to="/applications"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Briefcase size={16} />
            <span>Applications</span>
          </NavLink>

          <NavLink
            to="/import-export"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FileSpreadsheet size={16} />
            <span>Import / Export</span>
          </NavLink>

          <NavLink
            to="/trash"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Trash2 size={16} />
            <span>Trash</span>
            {trashTotal > 0 && (
              <span className="nav-badge" style={{ background: '#64748b' }}>
                {trashTotal}
              </span>
            )}
          </NavLink>
        </nav>

        {/* User & Actions Section */}
        <div className="nav-actions">
          {/* Sync indicator */}
          <div className={`sync-status ${saveStatus}`}>
            {saveStatus === 'saving' && (
              <>
                <RefreshCw size={12} className="spin" />
                <span>Saving…</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 size={12} />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle size={12} />
                <span>Sync Error</span>
              </>
            )}
          </div>

          {/* User badge */}
          <div className="user-badge" title={`Signed in as ${user?.email}`}>
            <div className="user-avatar">{username.charAt(0).toUpperCase()}</div>
            <span>{username}</span>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-sm btn-danger"
            title="Sign out"
            style={{ padding: '6px 10px' }}
          >
            <LogOut size={14} />
            <span className="hide-on-mobile">Logout</span>
          </button>

          {/* Mobile hamburger menu button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav className="mobile-nav-drawer" style={{ display: 'flex' }}>
          <NavLink
            to="/"
            end
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/contacts"
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Users size={16} />
            <span>HR Contacts</span>
          </NavLink>

          <NavLink
            to="/follow-ups"
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <CalendarClock size={16} />
            <span>Follow-ups ({dueCount})</span>
          </NavLink>

          <NavLink
            to="/applications"
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Briefcase size={16} />
            <span>Job Applications</span>
          </NavLink>

          <NavLink
            to="/import-export"
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FileSpreadsheet size={16} />
            <span>Import / Export</span>
          </NavLink>

          <NavLink
            to="/trash"
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Trash2 size={16} />
            <span>Trash ({trashTotal})</span>
          </NavLink>
        </nav>
      )}
    </>
  );
}

