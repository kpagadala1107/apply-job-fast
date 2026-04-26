import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Grid, List, X, Loader2, Briefcase, RefreshCw, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';
import JobCard from '../components/JobCard';
import PortalConnect from '../components/PortalConnect';

const SORT_OPTIONS = [
  { value: 'match', label: 'Best Match' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'salary', label: 'Highest Salary' },
];

const WORK_MODES = ['All', 'Remote', 'Hybrid', 'Onsite'];

const PORTALS = ['All', 'LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Dice', 'Monster', 'SimplyHired'];

const DATE_RANGES = [
  { value: 'all', label: 'All time', days: Infinity },
  { value: 'month', label: 'Last month', days: 30 },
  { value: 'week', label: 'Last week', days: 7 },
  { value: '3days', label: 'Last 3 days', days: 3 },
  { value: 'today', label: 'Today', days: 1 },
];

export default function JobSearch() {
  const { jobs, loadingJobs, portals, refreshJobs, lastFetched, isLive } = useApp();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('match');
  const [workMode, setWorkMode] = useState('All');
  const [portalFilter, setPortalFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const connectedAny = Object.values(portals).some(Boolean);

  const filtered = useMemo(() => {
    let result = [...jobs];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (workMode !== 'All') result = result.filter((j) => j.workMode === workMode);
    if (portalFilter !== 'All') result = result.filter((j) => j.portal === portalFilter.toLowerCase());

    if (dateFilter !== 'all') {
      const maxDays = DATE_RANGES.find((r) => r.value === dateFilter)?.days ?? Infinity;
      result = result.filter((j) => j.postedDays <= maxDays);
    }

    if (sortBy === 'match') result.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'recent') result.sort((a, b) => a.postedDays - b.postedDays);
    else if (sortBy === 'salary') {
      result.sort((a, b) => {
        const toNum = (s) => parseInt(s?.replace(/[^0-9]/g, '') || '0');
        return toNum(b.salary) - toNum(a.salary);
      });
    }

    return result;
  }, [jobs, query, sortBy, workMode, portalFilter, dateFilter]);

  const avgMatch = jobs.length ? Math.round(jobs.reduce((s, j) => s + j.matchScore, 0) / jobs.length) : 0;

  const activeFilterCount = [
    workMode !== 'All',
    portalFilter !== 'All',
    dateFilter !== 'all',
  ].filter(Boolean).length;

  if (!connectedAny) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Briefcase size={28} color="#A78BFA" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Connect a Job Source</h2>
          <p style={{ color: '#9090B8', lineHeight: 1.7 }}>
            Connect LinkedIn, Indeed, Glassdoor, or any other source to start finding jobs that match your resume.
            Upload your resume first on the Home page.
          </p>
        </div>
        <PortalConnect />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Find Jobs</h2>
          {jobs.length > 0 && (
            <span style={{ color: '#9090B8', fontSize: '0.9rem' }}>
              {filtered.length} of {jobs.length} results
            </span>
          )}
          {/* Live / Mock indicator */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
            background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)',
            color: isLive ? '#6EE7B7' : '#C4B5FD',
            border: `1px solid ${isLive ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)'}`,
          }}>
            <Radio size={10} />
            {isLive ? 'Live data' : 'Demo data'}
          </span>
          {/* Refresh button — only when live API is connected */}
          {isLive && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={refreshJobs}
              disabled={loadingJobs}
              title={lastFetched ? `Last fetched: ${new Date(lastFetched).toLocaleTimeString()}` : 'Fetch fresh results'}
              style={{ marginLeft: 'auto' }}
            >
              <RefreshCw size={13} style={loadingJobs ? { animation: 'spin 1s linear infinite' } : undefined} />
              {lastFetched
                ? `Refreshed ${timeSince(lastFetched)}`
                : 'Refresh Jobs'}
            </button>
          )}
        </div>
        <p style={{ color: '#9090B8', fontSize: '0.875rem' }}>
          {isLive
            ? 'Live jobs from job boards, matched against your resume after tailoring'
            : 'Sample jobs — add a RapidAPI key to fetch live results'}
        </p>
      </div>

      {/* Search + controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} color="#55557A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input"
            placeholder="Search by title, company, or skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#55557A', display: 'flex' }}>
              <X size={15} />
            </button>
          )}
        </div>

        <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 160 }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '0 6px', fontSize: '0.72rem' }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        <div style={{ display: 'flex', gap: 4 }}>
          {[['grid', Grid], ['list', List]].map(([mode, Icon]) => (
            <button
              key={mode}
              className={`btn ${viewMode === mode ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 10px' }}
              onClick={() => setViewMode(mode)}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card animate-fade-up" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <FilterGroup label="Work Mode" options={WORK_MODES} value={workMode} onChange={setWorkMode} />
          <FilterGroup label="Source" options={PORTALS} value={portalFilter} onChange={setPortalFilter} />
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#55557A', letterSpacing: '0.08em', marginBottom: 8 }}>
              DATE POSTED
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DATE_RANGES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateFilter(opt.value)}
                  className={`btn btn-sm ${dateFilter === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loadingJobs && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '48px 0', color: '#9090B8' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Fetching and matching jobs...</span>
        </div>
      )}

      {/* Results */}
      {!loadingJobs && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9090B8' }}>
          <Search size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 500 }}>No jobs found</div>
          <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Try adjusting your search or filters</div>
        </div>
      )}

      {!loadingJobs && filtered.length > 0 && (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: 16,
        }}>
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} view={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}

function timeSince(isoString) {
  const secs = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#55557A', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`btn btn-sm ${value === opt ? 'btn-primary' : 'btn-secondary'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
