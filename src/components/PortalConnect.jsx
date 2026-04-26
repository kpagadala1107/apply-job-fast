import { useState } from 'react';
import { Check, Zap, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PORTALS = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    tagline: 'Professional network',
    color: '#0A66C2',
    bg: 'rgba(10,102,194,0.12)',
    border: 'rgba(10,102,194,0.25)',
    jobCount: '7 jobs found',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    id: 'indeed',
    name: 'Indeed',
    tagline: 'Job search engine',
    color: '#003A9B',
    bg: 'rgba(0,58,155,0.12)',
    border: 'rgba(0,58,155,0.3)',
    jobCount: '5 jobs found',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#003A9B"/>
        <text x="12" y="17" fontSize="12" fontWeight="900" fill="white" fontFamily="Arial" textAnchor="middle">ind</text>
      </svg>
    ),
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    tagline: 'Jobs + company reviews',
    color: '#0CAA41',
    bg: 'rgba(12,170,65,0.12)',
    border: 'rgba(12,170,65,0.3)',
    jobCount: '4 jobs found',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#0CAA41"/>
        <text x="12" y="17" fontSize="14" fontWeight="900" fill="white" fontFamily="Arial" textAnchor="middle">G</text>
      </svg>
    ),
  },
  {
    id: 'ziprecruiter',
    name: 'ZipRecruiter',
    tagline: 'AI-powered job matching',
    color: '#4C86A8',
    bg: 'rgba(76,134,168,0.12)',
    border: 'rgba(76,134,168,0.3)',
    jobCount: '6 jobs found',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#1B2A4A"/>
        <text x="12" y="16" fontSize="10" fontWeight="900" fill="#4FC3F7" fontFamily="Arial" textAnchor="middle">ZIP</text>
      </svg>
    ),
  },
  {
    id: 'dice',
    name: 'Dice',
    tagline: 'Tech careers marketplace',
    color: '#C2001F',
    bg: 'rgba(194,0,31,0.12)',
    border: 'rgba(194,0,31,0.3)',
    jobCount: '3 jobs found',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#C2001F"/>
        <text x="12" y="17" fontSize="14" fontWeight="900" fill="white" fontFamily="Arial" textAnchor="middle">D</text>
      </svg>
    ),
  },
  {
    id: 'monster',
    name: 'Monster',
    tagline: 'Find better jobs faster',
    color: '#7B5EA7',
    bg: 'rgba(123,94,167,0.12)',
    border: 'rgba(123,94,167,0.3)',
    jobCount: '4 jobs found',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#6837B3"/>
        <text x="12" y="17" fontSize="13" fontWeight="900" fill="#A5F3A5" fontFamily="Arial" textAnchor="middle">M</text>
      </svg>
    ),
  },
  {
    id: 'simplyhired',
    name: 'SimplyHired',
    tagline: 'Millions of job listings',
    color: '#0948B5',
    bg: 'rgba(9,72,181,0.12)',
    border: 'rgba(9,72,181,0.3)',
    jobCount: '5 jobs found',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#0948B5"/>
        <text x="12" y="16" fontSize="10" fontWeight="900" fill="white" fontFamily="Arial" textAnchor="middle">SH</text>
      </svg>
    ),
  },
];

function PortalCard({ portal }) {
  const { portals, connectPortal, disconnectPortal, resume } = useApp();
  const [connecting, setConnecting] = useState(false);
  const connected = portals[portal.id];

  const handleConnect = () => {
    if (!resume) return;
    setConnecting(true);
    connectPortal(portal.id);
    setTimeout(() => setConnecting(false), 1400);
  };

  return (
    <div
      className="card card-glow"
      style={{
        padding: '20px',
        transition: 'all 0.25s',
        border: connected ? `1px solid ${portal.border}` : undefined,
        background: connected ? portal.bg : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <portal.icon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: '#F0EFFF' }}>{portal.name}</span>
            {connected && (
              <span className="badge badge-green" style={{ gap: 4 }}>
                <Check size={10} />
                Connected
              </span>
            )}
          </div>
          <div style={{ color: '#9090B8', fontSize: '0.8rem' }}>{portal.tagline}</div>
          {connected && (
            <div style={{ color: '#A78BFA', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
              <Zap size={11} style={{ display: 'inline', marginRight: 3 }} />
              {portal.jobCount}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        {connected ? (
          <>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <ExternalLink size={13} />
              Open Portal
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => disconnectPortal(portal.id)}
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            onClick={handleConnect}
            disabled={connecting || !resume}
            title={!resume ? 'Upload your resume first' : ''}
          >
            {connecting ? (
              <>
                <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.7s linear infinite' }} />
                Connecting...
              </>
            ) : (
              <>
                <Zap size={13} />
                Connect
              </>
            )}
          </button>
        )}
      </div>

      {!resume && !connected && (
        <div style={{ marginTop: 10, color: '#55557A', fontSize: '0.75rem', textAlign: 'center' }}>
          Upload your resume to connect
        </div>
      )}
    </div>
  );
}

export default function PortalConnect({ stacked = false }) {
  return (
    <div className={stacked ? undefined : 'portal-grid'} style={stacked ? { display: 'grid', gridTemplateColumns: '1fr', gap: 12 } : undefined}>
      {PORTALS.map((p) => <PortalCard key={p.id} portal={p} />)}
    </div>
  );
}
