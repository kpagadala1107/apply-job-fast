import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, Home, FileText, ChevronRight,
  Settings, Zap, Menu, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/jobs', label: 'Find Jobs', icon: Search },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const BREADCRUMBS = {
  '/': 'Home',
  '/jobs': 'Find Jobs',
  '/dashboard': 'Dashboard',
  '/tailor': 'Tailor Resume',
};

export default function Layout() {
  const { resume, jobs, tailoredResumes, searchQuery, searchLocation } = useApp();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const tailoredCount = Object.keys(tailoredResumes).length;

  const breadcrumb = Object.entries(BREADCRUMBS).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  );

  const closeMenu = () => setMenuOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

      {/* Backdrop overlay (mobile only) */}
      <div
        className={`sidebar-backdrop ${menuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        {/* Logo + close button row */}
        <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139,92,246,0.35)',
              flexShrink: 0,
            }}>
              <Zap size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F0EFFF', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                ApplyFast
              </div>
              <div style={{ fontSize: '0.68rem', color: '#55557A', letterSpacing: '0.05em' }}>AI JOB ASSISTANT</div>
            </div>
          </div>
          {/* Close button — visible only on mobile via CSS */}
          <button
            className="hamburger-btn"
            onClick={closeMenu}
            aria-label="Close menu"
            style={{ marginLeft: 8 }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 8, padding: '0 8px', color: '#55557A', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em' }}>
            NAVIGATION
          </div>
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={closeMenu}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, marginBottom: 2,
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                color: isActive ? '#F0EFFF' : '#9090B8',
                background: isActive ? 'linear-gradient(90deg, rgba(139,92,246,0.18), rgba(59,130,246,0.08))' : 'transparent',
                borderLeft: isActive ? '2px solid #8B5CF6' : '2px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} color={isActive ? '#A78BFA' : '#55557A'} />
                  {label}
                  {label === 'Find Jobs' && jobs.length > 0 && (
                    <span style={{
                      marginLeft: 'auto', background: 'rgba(139,92,246,0.2)',
                      color: '#C4B5FD', borderRadius: 99, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {jobs.length}
                    </span>
                  )}
                  {label === 'Dashboard' && tailoredCount > 0 && (
                    <span style={{
                      marginLeft: 'auto', background: 'rgba(16,185,129,0.18)',
                      color: '#6EE7B7', borderRadius: 99, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {tailoredCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Resume status */}
          <div style={{ marginTop: 24, marginBottom: 8, padding: '0 8px', color: '#55557A', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em' }}>
            RESUME
          </div>
          <div style={{
            padding: '10px 12px', borderRadius: 9,
            background: resume ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${resume ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} color={resume ? '#10B981' : '#55557A'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 500, color: resume ? '#6EE7B7' : '#55557A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {resume ? resume.name : 'No resume'}
                </div>
                {resume && (
                  <div style={{ fontSize: '0.68rem', color: '#55557A', marginTop: 1 }}>
                    Ready for matching
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Last search */}
          {jobs.length > 0 && searchQuery && (
            <>
              <div style={{ marginTop: 16, marginBottom: 8, padding: '0 8px', color: '#55557A', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em' }}>
                LAST SEARCH
              </div>
              <div style={{
                padding: '10px 12px', borderRadius: 9,
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.15)',
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#C4B5FD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {searchQuery}
                </div>
                {searchLocation && (
                  <div style={{ fontSize: '0.68rem', color: '#55557A', marginTop: 2 }}>{searchLocation}</div>
                )}
                <div style={{ fontSize: '0.68rem', color: '#55557A', marginTop: 4 }}>
                  {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, color: '#55557A' }}>
            <Settings size={15} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          {/* Hamburger button — hidden on desktop via CSS */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <span style={{ color: '#55557A', fontSize: '0.82rem' }}>ApplyFast</span>
          <ChevronRight size={14} color="#55557A" />
          <span style={{ color: '#9090B8', fontSize: '0.82rem' }}>{breadcrumb?.[1] || 'Page'}</span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {resume && (
              <span className="badge badge-green hide-mobile" style={{ gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                Resume ready
              </span>
            )}
            {jobs.length > 0 && (
              <span className="badge badge-purple hide-mobile">
                {jobs.length} jobs
              </span>
            )}
            {/* Mobile status dot */}
            {resume && (
              <div
                className="hamburger-btn"
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', padding: 0, cursor: 'default', flexShrink: 0 }}
                title="Resume ready"
              />
            )}
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
