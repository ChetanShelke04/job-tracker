import React, { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from '../common/Toast';
import { useContacts } from '../../context/ContactsContext';
import { isDueToday, isOverdue } from '../../lib/dates';
import {
  PhoneCall,
  Menu,
  LayoutDashboard,
  Users,
  CalendarClock,
  Briefcase,
  MoreHorizontal
} from 'lucide-react';

export default function AppLayout({ children }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const { contacts } = useContacts();

  // Due count for bottom nav badge
  const dueCount = contacts.filter(
    c => c.followup_date && (isDueToday(c.followup_date) || isOverdue(c.followup_date))
  ).length;

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/contacts': return 'HR Contacts';
      case '/follow-ups': return 'Follow-ups';
      case '/applications': return 'Applications';
      case '/import-export': return 'Import & Export';
      case '/trash': return 'Trash';
      default: return 'Job Tracker';
    }
  };

  const closeDrawer = () => setMobileDrawerOpen(false);

  return (
    <div className="app-layout">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="desktop-sidebar">
        <Sidebar />
      </aside>

      {/* Mobile Top Header (Fixed 54px) */}
      <div className="mobile-topbar">
        <NavLink to="/" className="brand-link" style={{ textDecoration: 'none' }}>
          <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
            <PhoneCall size={14} />
          </div>
          <span className="brand-title" style={{ fontSize: '15px' }}>Job Tracker</span>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            background: 'rgba(37, 99, 235, 0.08)',
            color: '#2563eb',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            {getPageTitle(location.pathname)}
          </span>

          <button
            type="button"
            className="btn btn-sm btn-ghost btn-icon"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <Menu size={19} />
          </button>
        </div>
      </div>

      {/* Mobile Slide Drawer (Single, unified header without duplication) */}
      <div
        className={`mobile-drawer-backdrop ${mobileDrawerOpen ? 'open' : ''}`}
        onClick={closeDrawer}
      >
        <div
          className="mobile-drawer-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar onItemClick={closeDrawer} isMobileDrawer={true} />
        </div>
      </div>

      {/* Main Page Area */}
      <div className="app-main">
        {/* Desktop Top Breadcrumb Header (Hidden on mobile) */}
        <header className="top-header">
          <div className="top-header-left">
            <span className="page-breadcrumb">{getPageTitle(location.pathname)}</span>
          </div>

          <div className="top-header-actions">
            {location.pathname === '/contacts' && (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Press <kbd style={{ padding: '2px 5px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }}>Esc</kbd> to close dialogs
              </span>
            )}
          </div>
        </header>

        <main className="page-content-wrapper">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 1024px) */}
      <nav className="mobile-bottom-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/contacts"
          className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Contacts</span>
        </NavLink>

        <NavLink
          to="/follow-ups"
          className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
        >
          <CalendarClock size={18} />
          <span>Follow-ups</span>
          {dueCount > 0 && <span className="mobile-bottom-badge" />}
        </NavLink>

        <NavLink
          to="/applications"
          className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={18} />
          <span>Pipeline</span>
        </NavLink>

        <button
          type="button"
          className="mobile-bottom-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setMobileDrawerOpen(true)}
        >
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </nav>

      <Toast />
    </div>
  );
}
