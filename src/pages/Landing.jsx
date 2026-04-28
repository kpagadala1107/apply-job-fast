import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, Wand2, BarChart3, CheckCircle2, Search, MapPin, Calendar, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ResumeUpload from '../components/ResumeUpload';

const FEATURES = [
  { icon: Target, label: 'Smart Matching', desc: 'AI scores every job against your resume' },
  { icon: Wand2, label: 'Auto-Tailor', desc: 'Rewrites your resume for each job' },
  { icon: BarChart3, label: 'Apply Tracking', desc: 'Dashboard for all tailored applications' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '3days', label: 'Last 3 days' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: 'all', label: 'All time' },
];

export default function Landing() {
  const { resume, jobs, searchJobs, searchQuery, searchLocation, dateRange, loadingJobs, isLive } = useApp();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [localDateRange, setLocalDateRange] = useState('month');

  // Pre-fill query from resume role when it becomes available
  useEffect(() => {
    if (resume?.role && !query) setQuery(resume.role);
  }, [resume?.role]);

  // Sync local fields from context on mount (if user already searched before)
  useEffect(() => {
    if (searchQuery) setQuery(searchQuery);
    if (searchLocation) setLocation(searchLocation);
    if (dateRange) setLocalDateRange(dateRange);
  }, []); // intentionally runs once on mount

  const hasJobs = jobs.length > 0;

  const handleSearch = async () => {
    if (!query.trim()) return;
    await searchJobs({ query: query.trim(), location: location.trim(), dateRange: localDateRange });
    navigate('/jobs');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Hero */}
      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 99,
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
          fontSize: '0.78rem', fontWeight: 500, color: '#C4B5FD',
          marginBottom: 20,
        }}>
          <Sparkles size={12} />
          Powered by GPT-4o
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
          Land your dream job{' '}
          <span className="gradient-text">10x faster</span>
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
          Upload your resume, search for jobs, and let AI tailor your application for every opportunity.
        </p>

        {hasJobs && (
          <button
            className="btn btn-primary btn-lg"
            style={{ marginTop: 28 }}
            onClick={() => navigate('/jobs')}
          >
            Browse {jobs.length} Matched Jobs <ArrowRight size={18} />
          </button>
        )}
      </div>

      {/* Feature pills */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 48 }}>
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--gradient-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={15} color="#A78BFA" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Resume upload card */}
      <div className="card animate-fade-up" style={{ padding: '28px', marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
            {resume ? 'Resume Uploaded' : 'Upload Your Resume'}
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {resume
              ? 'Your resume is parsed and ready for AI matching.'
              : 'PDF, DOC, or DOCX. Our AI will extract and analyze your experience.'}
          </p>
        </div>

        <ResumeUpload />

        {resume && !resume.parsing && (
          <div className="animate-fade-up" style={{ marginTop: 16 }}>
            <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: '0.78rem', color: '#6EE7B7', fontWeight: 600 }}>
                  ✓ {resume.skills?.length || 0} skills extracted
                </div>
                {resume.role && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-2)' }}>
                    Detected role:
                    <span style={{
                      background: 'rgba(139,92,246,0.15)', color: '#C4B5FD',
                      border: '1px solid rgba(139,92,246,0.25)',
                      borderRadius: 6, padding: '1px 8px', fontWeight: 600,
                    }}>
                      {resume.role}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(resume.skills || []).slice(0, 10).map((skill) => (
                  <span key={skill} className="badge badge-green" style={{ fontSize: '0.7rem' }}>{skill}</span>
                ))}
                {resume.skills?.length > 10 && (
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>+{resume.skills.length - 10} more</span>
                )}
              </div>
            </div>
          </div>
        )}

        {resume?.parsing && (
          <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10B981', animation: 'spin 0.8s linear infinite' }} />
            Extracting skills from resume...
          </div>
        )}
      </div>

      {/* Job search form */}
      <div className="card animate-fade-up" style={{ padding: '28px' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Find Jobs</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Edit the search query, set your location and date range, then fetch live job listings.
            {!isLive && <span style={{ color: '#F59E0B' }}> (Demo mode — add a RapidAPI key for live results)</span>}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Query */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="var(--text-3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              className="input"
              placeholder="Job title or keywords, e.g. Senior React Developer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ paddingLeft: 38 }}
            />
          </div>

          {/* Location + Date range row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
              <MapPin size={14} color="var(--text-3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="input"
                placeholder="Location (or leave blank for all)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ paddingLeft: 34 }}
              />
            </div>

            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Calendar size={14} color="var(--text-3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select
                className="input"
                value={localDateRange}
                onChange={(e) => setLocalDateRange(e.target.value)}
                style={{ paddingLeft: 30, width: 148 }}
              >
                {DATE_RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search button */}
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center', padding: '11px 24px', fontSize: '0.95rem' }}
            onClick={handleSearch}
            disabled={!query.trim() || loadingJobs}
          >
            {loadingJobs ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Fetching jobs...
              </>
            ) : (
              <>
                <Search size={16} />
                {hasJobs ? 'Re-search Jobs' : 'Find Jobs'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="animate-fade-up" style={{ marginTop: 56 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>How it works</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Three steps to your next job</p>
        </div>
        <div className="grid-cols-3">
          {[
            { step: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX. AI parses your skills, experience, and role.' },
            { step: '02', title: 'Search Jobs', desc: 'Edit the query, set a date range, and fetch live postings from LinkedIn, Indeed, Glassdoor and more.' },
            { step: '03', title: 'Apply Tailored', desc: 'Tailor your resume for each job with AI, then apply directly.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{
              padding: '24px', borderRadius: 14,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -8, right: 12,
                fontSize: '3.5rem', fontWeight: 900, color: 'rgba(139,92,246,0.07)',
                letterSpacing: '-0.05em', lineHeight: 1,
              }}>
                {step}
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 8, marginBottom: 12,
                background: 'var(--gradient-subtle)', border: '1px solid rgba(139,92,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#A78BFA',
              }}>
                {step}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{title}</div>
              <div style={{ color: 'var(--text-2)', fontSize: '0.82rem', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA if jobs found */}
      {hasJobs && (
        <div className="animate-fade-up" style={{
          marginTop: 40, padding: '28px 32px', borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.08) 100%)',
          border: '1px solid rgba(139,92,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <CheckCircle2 size={18} color="#10B981" />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Jobs ready!</span>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
              Found <strong style={{ color: '#A78BFA' }}>{jobs.length} jobs</strong> for "{searchQuery}". Start tailoring your resume.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
            View Jobs <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
