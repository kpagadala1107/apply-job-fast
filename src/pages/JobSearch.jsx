import { useState, useMemo } from 'react';
import {
  Search, SlidersHorizontal, Grid, List, X,
  Loader2, MapPin, Calendar, RefreshCw, Radio, Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import JobCard from '../components/JobCard';

const SORT_OPTIONS = [
  { value: 'match', label: 'Best Match' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'salary', label: 'Highest Salary' },
];

const WORK_MODES = ['All', 'Remote', 'Hybrid', 'Onsite'];

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '3days', label: 'Last 3 days' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: 'all', label: 'All time' },
];

const DATE_RANGE_DAYS = { today: 1, '3days': 3, week: 7, month: 30, all: Infinity };

export default function JobSearch() {
  const { jobs, loadingJobs, searchJobs, refreshJobs, searchQuery, searchLocation, dateRange, lastFetched, isLive, jobsError } = useApp();
  const navigate = useNavigate();

  // Local filter state (filters already-loaded results, does NOT hit the API)
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [workMode, setWorkMode] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Re-search form state (hits the API with a new query)
  const [showSearchEdit, setShowSearchEdit] = useState(false);
  const [editQuery, setEditQuery] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDateRange, setEditDateRange] = useState('month');

  const openSearchEdit = () => {
    setEditQuery(searchQuery);
    setEditLocation(searchLocation);
    setEditDateRange(dateRange || 'month');
    setShowSearchEdit(true);
  };

  const handleReSearch = () => {
    if (!editQuery.trim()) return;
    searchJobs({ query: editQuery.trim(), location: editLocation.trim(), dateRange: editDateRange });
    setShowSearchEdit(false);
  };

  const filtered = useMemo(() => {
    let result = [...jobs];
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      result = result.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (workMode !== 'All') result = result.filter((j) => j.workMode === workMode);
    if (dateFilter !== 'all') {
      const maxDays = DATE_RANGE_DAYS[dateFilter] ?? Infinity;
      result = result.filter((j) => j.postedDays <= maxDays);
    }
    if (sortBy === 'match') result.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'recent') result.sort((a, b) => a.postedDays - b.postedDays);
    else if (sortBy === 'salary') {
      result.sort((a, b) => {
        const n = (s) => parseInt(s?.replace(/[^0-9]/g, '') || '0');
        return n(b.salary) - n(a.salary);
      });
    }
    return result;
  }, [jobs, filterText, sortBy, workMode, dateFilter]);

  const activeFilterCount = [workMode !== 'All', dateFilter !== 'all'].filter(Boolean).length;

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!jobs.length && !loadingJobs) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Search size={28} color="#A78BFA" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Search for Jobs</h2>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.7, fontSize: '0.9rem' }}>
            Enter a job title or keywords and we'll pull live postings from LinkedIn, Indeed, Glassdoor, and more.
          </p>
          {jobsError && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', fontSize: '0.8rem' }}>
              {jobsError}
            </div>
          )}
        </div>
        <InlineSearchForm searchJobs={searchJobs} initialQuery={searchQuery} initialLocation={searchLocation} initialDateRange={dateRange} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ color: 'var(--text-3)' }}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Loading overlay ────────────────────────────────────────────────────────

  if (loadingJobs) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 0', color: 'var(--text-2)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Fetching live job listings…</div>
          <div style={{ fontSize: '0.82rem' }}>
            Searching for <strong style={{ color: '#C4B5FD' }}>{searchQuery || 'jobs'}</strong>
            {searchLocation ? ` in ${searchLocation}` : ''}
          </div>
        </div>
      </div>
    );
  }

  // ── Results view ───────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Active search bar ── */}
      <div className="card animate-fade-up" style={{ padding: '14px 18px', marginBottom: 20 }}>
        {!showSearchEdit ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {searchQuery || 'All jobs'}
                </span>
                {searchLocation && (
                  <span style={{ color: 'var(--text-2)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={12} /> {searchLocation}
                  </span>
                )}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 600,
                  background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)',
                  color: isLive ? '#6EE7B7' : '#C4B5FD',
                  border: `1px solid ${isLive ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)'}`,
                }}>
                  <Radio size={9} />
                  {isLive ? 'Live' : 'Demo'}
                </span>
                {lastFetched && (
                  <span style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>
                    · {timeSince(lastFetched)}
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 2 }}>
                {filtered.length} of {jobs.length} results
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={openSearchEdit}>
                <Edit2 size={13} /> Edit search
              </button>
              {isLive && (
                <button className="btn btn-secondary btn-sm" onClick={refreshJobs} disabled={loadingJobs} title="Fetch a fresh page of results">
                  <RefreshCw size={13} /> Refresh
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Inline re-search form */
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 160, position: 'relative' }}>
                <Search size={14} color="var(--text-3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  placeholder="Job title or keywords"
                  value={editQuery}
                  onChange={(e) => setEditQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReSearch()}
                  style={{ paddingLeft: 32, padding: '7px 10px 7px 32px' }}
                  autoFocus
                />
              </div>
              <div style={{ flex: 1, minWidth: 120, position: 'relative' }}>
                <MapPin size={13} color="var(--text-3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  placeholder="Location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReSearch()}
                  style={{ paddingLeft: 30, padding: '7px 10px 7px 30px' }}
                />
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Calendar size={13} color="var(--text-3)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <select
                  className="input"
                  value={editDateRange}
                  onChange={(e) => setEditDateRange(e.target.value)}
                  style={{ paddingLeft: 28, width: 136, padding: '7px 10px 7px 28px' }}
                >
                  {DATE_RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleReSearch} disabled={!editQuery.trim()}>
                <Search size={13} /> Search
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSearchEdit(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Local filter bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <Search size={15} color="var(--text-3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Filter by title, company, or skill…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
          {filterText && (
            <button onClick={() => setFilterText('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 156 }}>
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
            <button key={mode} className={`btn ${viewMode === mode ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 10px' }} onClick={() => setViewMode(mode)}>
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="card animate-fade-up" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <FilterGroup label="Work Mode" options={WORK_MODES} value={workMode} onChange={setWorkMode} />
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 8 }}>DATE POSTED</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DATE_RANGE_OPTIONS.concat([{ value: 'all', label: 'All time' }]).map((opt) => (
                <button key={opt.value} onClick={() => setDateFilter(opt.value)} className={`btn btn-sm ${dateFilter === opt.value ? 'btn-primary' : 'btn-secondary'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── No results ── */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-2)' }}>
          <Search size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 500 }}>No jobs match your filters</div>
          <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Try clearing filters or editing the search query above</div>
        </div>
      )}

      {/* ── Job grid / list ── */}
      {filtered.length > 0 && (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: 16,
        }}>
          {filtered.map((job) => <JobCard key={job.id} job={job} view={viewMode} />)}
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

function InlineSearchForm({ searchJobs, initialQuery = '', initialLocation = '', initialDateRange = 'month' }) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [dr, setDr] = useState(initialDateRange || 'month');

  const handleSearch = () => {
    if (!query.trim()) return;
    searchJobs({ query: query.trim(), location: location.trim(), dateRange: dr });
  };

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} color="var(--text-3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          className="input"
          placeholder="Job title or keywords, e.g. Senior React Developer"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ paddingLeft: 38 }}
          autoFocus
        />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140, position: 'relative' }}>
          <MapPin size={13} color="var(--text-3)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Calendar size={13} color="var(--text-3)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select className="input" value={dr} onChange={(e) => setDr(e.target.value)} style={{ paddingLeft: 28, width: 140 }}>
            {DATE_RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <button
        className="btn btn-primary"
        style={{ justifyContent: 'center' }}
        onClick={handleSearch}
        disabled={!query.trim()}
      >
        <Search size={15} /> Find Jobs
      </button>
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button key={opt} onClick={() => onChange(opt)} className={`btn btn-sm ${value === opt ? 'btn-primary' : 'btn-secondary'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
