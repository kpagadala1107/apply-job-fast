import { MapPin, Clock, Briefcase, ArrowRight, CheckCircle2, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MatchRing from './MatchRing';
import { getWorkModeColor } from '../data/mockData';

const PORTAL_BADGE = {
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  indeed: { label: 'Indeed', color: '#003A9B' },
  glassdoor: { label: 'Glassdoor', color: '#0CAA41' },
  ziprecruiter: { label: 'ZipRecruiter', color: '#4C86A8' },
  dice: { label: 'Dice', color: '#C2001F' },
  monster: { label: 'Monster', color: '#7B5EA7' },
  simplyhired: { label: 'SimplyHired', color: '#0948B5' },
};

export default function JobCard({ job, view = 'grid' }) {
  const { tailoredResumes, appliedJobs } = useApp();
  const isTailored = !!tailoredResumes[job.id];
  const isApplied = appliedJobs.includes(job.id);
  const portal = PORTAL_BADGE[job.portal] ?? { label: job.portal, color: '#9090B8' };

  // Match score is revealed only after the user has tailored this job's resume
  const revealedScore = isTailored
    ? (tailoredResumes[job.id]?.estimatedScore ?? job.matchScore)
    : null;

  if (view === 'list') {
    return (
      <div className="card card-glow animate-fade-up" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CompanyAvatar company={job.companyData} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#F0EFFF', fontSize: '0.95rem' }}>{job.title}</span>
              {isTailored && <span className="badge badge-purple"><Wand2 size={10} /> Tailored</span>}
              {isApplied && <span className="badge badge-green"><CheckCircle2 size={10} /> Applied</span>}
            </div>
            <div style={{ color: '#9090B8', fontSize: '0.82rem', marginTop: 2 }}>
              {job.company} · {job.location} · {job.salary}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            {revealedScore !== null ? (
              <MatchRing score={revealedScore} size={52} strokeWidth={4} />
            ) : (
              <TailorPromptBadge />
            )}
            <Link to={`/tailor/${job.id}`} className="btn btn-primary btn-sm">
              {isTailored ? 'Edit' : 'Tailor'} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-glow animate-fade-up" style={{
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
          <CompanyAvatar company={job.companyData} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: '#F0EFFF', fontSize: '0.95rem', lineHeight: 1.3, marginBottom: 2 }}>
              {job.title}
            </div>
            <div style={{ color: '#9090B8', fontSize: '0.82rem' }}>{job.company}</div>
          </div>
        </div>
        {revealedScore !== null ? (
          <MatchRing score={revealedScore} size={58} strokeWidth={5} showLabel />
        ) : (
          <TailorPromptBadge />
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9090B8', fontSize: '0.78rem' }}>
          <MapPin size={12} color="#55557A" /> {job.location}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9090B8', fontSize: '0.78rem' }}>
          <Briefcase size={12} color="#55557A" /> {job.type}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9090B8', fontSize: '0.78rem' }}>
          <Clock size={12} color="#55557A" /> {job.postedDays}d ago
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span className={`badge ${getWorkModeColor(job.workMode)}`}>{job.workMode}</span>
        <span className="badge badge-gray" style={{ background: `${portal.color}18`, color: portal.color, border: `1px solid ${portal.color}30`, fontSize: '0.7rem' }}>
          {portal.label}
        </span>
        {job.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="badge badge-gray">{tag}</span>
        ))}
        {job.tags.length > 2 && (
          <span className="badge badge-gray">+{job.tags.length - 2}</span>
        )}
      </div>

      {job.salary && (
        <div style={{ color: '#A78BFA', fontSize: '0.83rem', fontWeight: 500 }}>
          {job.salary}
        </div>
      )}

      <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
        <Link
          to={`/tailor/${job.id}`}
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Wand2 size={14} />
          {isTailored ? 'Edit Tailoring' : 'Tailor Resume'}
        </Link>
        {isApplied ? (
          <span className="badge badge-green" style={{ padding: '8px 12px', borderRadius: 8 }}>
            <CheckCircle2 size={13} /> Applied
          </span>
        ) : null}
      </div>

      {(isTailored || isApplied) && (
        <div style={{ display: 'flex', gap: 6 }}>
          {isTailored && <span className="badge badge-purple"><Wand2 size={10} /> Tailored</span>}
          {isApplied && <span className="badge badge-green"><CheckCircle2 size={10} /> Applied</span>}
        </div>
      )}
    </div>
  );
}

function TailorPromptBadge() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: 58, height: 58, borderRadius: '50%',
      border: '2px dashed rgba(139,92,246,0.3)',
      color: '#55557A', fontSize: '0.6rem', fontWeight: 600,
      textAlign: 'center', lineHeight: 1.3, padding: 4, flexShrink: 0,
    }}>
      <Wand2 size={12} color="#55557A" style={{ marginBottom: 2 }} />
      Tailor to see match
    </div>
  );
}

function CompanyAvatar({ company, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.25),
      background: company.bg || 'rgba(139,92,246,0.15)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38,
      color: company.color || '#F0EFFF', flexShrink: 0,
      letterSpacing: '-0.5px',
    }}>
      {company.initial}
    </div>
  );
}
