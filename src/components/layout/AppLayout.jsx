import React, { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from '../common/Toast';
import { PhoneCall, Menu, X, Plus } from 'lucide-react';

export default function AppLayout({ children }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  // Determine current page title
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Dashboard Overview';
      case '/contacts': return 'HR & Recruiter Directory';
      case '/follow-ups': return 'Follow-up Manager';
      case '/applications': return 'Job Application Pipeline';
      case '/import-export': return 'Data Backup & Import Center';
      case '/trash': return 'Trash & Archived Records';
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

      {/* Mobile Top Navigation Header */}
      <div className="mobile-topbar">
        <NavLink to="/" className="brand-link" style={{ textDecoration: 'none' }}>
          <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
            <PhoneCall size={15} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Job Tracker</span>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Navigation"
            style={{ padding: '6px' }}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Slide Drawer Backdrop & Panel */}
      <div
        className={`mobile-drawer-backdrop ${mobileDrawerOpen ? 'open' : ''}`}
        onClick={closeDrawer}
      >
        <div
          className="mobile-drawer-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            height: '58px',
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
                <PhoneCall size={16} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Job Tracker</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={closeDrawer}
              aria-label="Close Navigation"
            >
              <X size={18} />
            </button>
          </div>

          <Sidebar onItemClick={closeDrawer} />
        </div>
      </div>

      {/* Main Page Area */}
      <div className="app-main">
        <header className="top-header">
          <div className="top-header-left">
            <span className="page-breadcrumb">{getPageTitle(location.pathname)}</span>
          </div>

          <div className="top-header-actions">
            {/* Quick action button based on page */}
            {location.pathname === '/contacts' && (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Press <kbd style={{ padding: '2px 5px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }}>Esc</kbd> to close modals
              </span>
            )}
          </div>
        </header>

        <main className="page-content-wrapper">
          {children}
        </main>
      </div>

      <Toast />
    </div>
  );
}
