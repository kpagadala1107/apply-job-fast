import { Link, useNavigate } from 'react-router-dom';
import { Wand2, CheckCircle2, TrendingUp, Briefcase, ArrowRight, Send, LayoutDashboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MOCK_JOBS, getMatchColor } from '../data/mockData';

export default function Dashboard() {
  const { tailoredResumes, appliedJobs, jobs, markApplied } = useApp();
  const navigate = useNavigate();

  const tailoredIds = Object.keys(tailoredResumes);
  const tailoredJobs = tailoredIds
    .map((id) => {
      const job = MOCK_JOBS.find((j) => j.id === id);
      const data = tailoredResumes[id];
      return job ? { job, data } : null;
    })
    .filter(Boolean);

  const appliedJobsList = appliedJobs
    .map((id) => MOCK_JOBS.find((j) => j.id === id))
    .filter(Boolean);

  const avgMatch = tailoredJobs.length
    ? Math.round(tailoredJobs.reduce((s, { data }) => s + (data?.estimatedScore || 0), 0) / tailoredJobs.length)
    : 0;

  const STATS = [
    {
      label: 'Resumes Tailored',
      value: tailoredJobs.length,
      icon: Wand2,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.12)',
    },
    {
      label: 'Jobs Applied',
      value: appliedJobs.length,
      icon: Send,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      label: 'Avg. Match Score',
      value: avgMatch ? `${avgMatch}%` : '—',
      icon: TrendingUp,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.12)',
    },
    {
      label: 'Jobs Tracked',
      value: jobs.length,
      icon: Briefcase,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
    },
  ];

  if (tailoredJobs.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LayoutDashboard size={28} color="#A78BFA" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Your Dashboard</h2>
          <p style={{ color: '#9090B8', lineHeight: 1.7 }}>
            Once you tailor your resume for jobs, they&apos;ll appear here.
            Start by browsing matched jobs and clicking &ldquo;Tailor Resume&rdquo;.
          </p>
        </div>

        <div className="grid-cols-2-stats" style={{ marginBottom: 28 }}>
          {STATS.map(({ label, value, icon: Icon, color, bg }) => (
            <StatCard key={label} label={label} value={value} Icon={Icon} color={color} bg={bg} />
          ))}
        </div>

        <button className="btn btn-primary btn-lg" onClick={() => navigate('/jobs')}>
          Browse Jobs <ArrowRight size={17} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Dashboard</h2>
        <p style={{ color: '#9090B8', fontSize: '0.875rem' }}>
          Track your tailored applications and job progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid-cols-4" style={{ marginBottom: 32 }}>
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <StatCard key={label} label={label} value={value} Icon={Icon} color={color} bg={bg} />
        ))}
      </div>

      {/* Tailored jobs */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Tailored Resumes</h3>
        <Link to="/jobs" className="btn btn-ghost btn-sm">
          Find more jobs <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tailoredJobs.map(({ job, data }, i) => {
          const isApplied = appliedJobs.includes(job.id);
          const scoreColor = getMatchColor(data?.estimatedScore || job.matchScore);

          return (
            <div
              key={job.id}
              className="card card-glow animate-fade-up"
              style={{ padding: '18px 22px', animationDelay: `${i * 0.05}s` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Company avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: job.companyData.bg || 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, color: job.companyData.color, flexShrink: 0,
                }}>
                  {job.companyData.initial}
                </div>

                {/* Job info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, color: '#F0EFFF', fontSize: '0.95rem' }}>{job.title}</span>
                    <span className="badge badge-purple" style={{ gap: 4 }}>
                      <Wand2 size={10} /> Tailored
                    </span>
                    {isApplied && (
                      <span className="badge badge-green" style={{ gap: 4 }}>
                        <CheckCircle2 size={10} /> Applied
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#9090B8', fontSize: '0.82rem' }}>
                    {job.company} · {job.location} · {job.salary}
                  </div>
                </div>

                {/* Match improvement */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: scoreColor, letterSpacing: '-0.02em' }}>
                    {data?.estimatedScore || job.matchScore}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#55557A' }}>
                    ↑ from {job.matchScore}%
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link to={`/tailor/${job.id}`} className="btn btn-secondary btn-sm">
                    Edit
                  </Link>
                  {!isApplied && (
                    <button className="btn btn-primary btn-sm" onClick={() => markApplied(job.id)}>
                      <Send size={12} /> Apply
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Applied jobs section */}
      {appliedJobsList.length > 0 && (
        <>
          <div style={{ margin: '28px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Applied Jobs</h3>
            <span className="badge badge-green">{appliedJobsList.length} applications</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appliedJobsList.map((job, i) => (
              <div
                key={job.id}
                className="card animate-fade-up"
                style={{ padding: '14px 20px', animationDelay: `${i * 0.05}s` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: job.companyData.bg, border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, color: job.companyData.color,
                  }}>
                    {job.companyData.initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F0EFFF' }}>{job.title}</div>
                    <div style={{ color: '#9090B8', fontSize: '0.8rem' }}>{job.company} · {job.location}</div>
                  </div>
                  <span className="badge badge-green">
                    <CheckCircle2 size={12} /> Applied
                  </span>
                  <span style={{ color: '#9090B8', fontSize: '0.78rem' }}>via {job.portal === 'linkedin' ? 'LinkedIn' : 'Indeed'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, Icon, color, bg }) {
  return (
    <div className="card animate-fade-up" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#F0EFFF', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ color: '#9090B8', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
    </div>
  );
}
