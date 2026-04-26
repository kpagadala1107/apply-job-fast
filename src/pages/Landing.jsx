import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, Wand2, BarChart3, CheckCircle2, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ResumeUpload from '../components/ResumeUpload';
import PortalConnect from '../components/PortalConnect';

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
  const { resume, jobs, dateRange, setDateRange } = useApp();
  const navigate = useNavigate();
  const hasJobs = jobs.length > 0;

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
        <p style={{ color: '#9090B8', fontSize: '1.1rem', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
          Upload your resume, connect job portals, and let AI match and tailor your application for every opportunity.
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
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F0EFFF' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: '#9090B8' }}>{desc}</div>
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
          <p style={{ color: '#9090B8', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {resume
              ? 'Your resume is parsed and ready for AI matching.'
              : 'PDF, DOC, or DOCX. Our AI will extract and analyze your experience.'}
          </p>
        </div>

        <ResumeUpload />

        {resume && (
          <div className="animate-fade-up" style={{ marginTop: 16 }}>
            <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(16,185,129,0.15)' }}>
              {resume.parsing ? (
                <div style={{ fontSize: '0.78rem', color: '#9090B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10B981', animation: 'spin 0.8s linear infinite' }} />
                  Extracting skills from resume...
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.78rem', color: '#6EE7B7', fontWeight: 600 }}>
                      ✓ {resume.skills?.length || 0} skills extracted
                    </div>
                    {resume.role && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#9090B8' }}>
                        Searching as
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
                    {(resume.skills?.length ? resume.skills : []).slice(0, 10).map((skill) => (
                      <span key={skill} className="badge badge-green" style={{ fontSize: '0.7rem' }}>{skill}</span>
                    ))}
                    {resume.skills?.length > 10 && (
                      <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>+{resume.skills.length - 10} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Job sources card — below the resume upload widget */}
      <div className="card animate-fade-up" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
              Connect Job Sources
            </h2>
            <p style={{ color: '#9090B8', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Connect any source below to pull matching jobs into your feed.
            </p>
          </div>

          {/* Date range picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Calendar size={14} color="#55557A" />
            <span style={{ fontSize: '0.78rem', color: '#9090B8', whiteSpace: 'nowrap' }}>Jobs posted:</span>
            <select
              className="input"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ width: 140, padding: '6px 10px', fontSize: '0.8rem' }}
            >
              {DATE_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <PortalConnect />
      </div>

      {/* How it works */}
      <div className="animate-fade-up" style={{ marginTop: 56 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>How it works</h2>
          <p style={{ color: '#9090B8', fontSize: '0.9rem' }}>Three steps to your next job</p>
        </div>
        <div className="grid-cols-3">
          {[
            { step: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX. AI parses your skills, experience, and achievements.' },
            { step: '02', title: 'Match Jobs', desc: 'Connect any job source. AI scores every job against your profile in real time.' },
            { step: '03', title: 'Apply Tailored', desc: 'Generate a custom resume for each job, preview it, and apply directly.' },
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
              <div style={{ fontWeight: 600, marginBottom: 6, color: '#F0EFFF' }}>{title}</div>
              <div style={{ color: '#9090B8', fontSize: '0.82rem', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA if ready */}
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
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>You&apos;re all set!</span>
            </div>
            <p style={{ color: '#9090B8', fontSize: '0.875rem' }}>
              Found <strong style={{ color: '#A78BFA' }}>{jobs.length} matching jobs</strong>. Start tailoring your resume.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/jobs')}
          >
            View Matched Jobs <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
