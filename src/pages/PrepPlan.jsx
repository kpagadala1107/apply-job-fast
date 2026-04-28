import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Loader2, ChevronDown, ChevronUp,
  ExternalLink, Target, Code2, MessageSquare, Building2,
  Calendar, GraduationCap, FileText, GitBranch, Globe, Play,
  BookMarked, Wand2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MOCK_JOBS } from '../data/mockData';
import { generatePrepPlan, isLLMEnabled } from '../services/openai';

const DIFF_BADGE = { easy: 'badge-green', medium: 'badge-amber', hard: 'badge-red' };
const PRIORITY_BADGE = { 'must-read': 'badge-purple', recommended: 'badge-blue', bonus: 'badge-gray' };
const TYPE_ICON = {
  documentation: FileText, course: GraduationCap, book: BookMarked,
  video: Play, practice: Code2, github: GitBranch, blog: Globe,
};

export default function PrepPlan() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { jobs } = useApp();
  const job = jobs.find((j) => j.id === jobId) ?? MOCK_JOBS.find((j) => j.id === jobId);

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openTech, setOpenTech] = useState(new Set());
  const [openScenario, setOpenScenario] = useState(new Set());
  const [openCompany, setOpenCompany] = useState(new Set());

  const handleGenerate = async () => {
    setLoading(true);
    setPlan(null);
    setOpenTech(new Set());
    setOpenScenario(new Set());
    setOpenCompany(new Set());
    const result = await generatePrepPlan(job);
    setPlan(result);
    setLoading(false);
  };

  const toggle = (setter, idx) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  if (!job) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-2)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 8 }}>Job not found</div>
        <Link to="/jobs" className="btn btn-secondary">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={15} /> Back to Jobs
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <BookOpen size={20} color="#8B5CF6" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Interview Prep Plan</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{job.title}</span>
              <span style={{ color: 'var(--text-3)' }}>·</span>
              <span style={{ color: 'var(--text-2)' }}>{job.company}</span>
              {job.location && (
                <><span style={{ color: 'var(--text-3)' }}>·</span>
                  <span style={{ color: 'var(--text-2)' }}>{job.location}</span></>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link to={`/tailor/${jobId}`} className="btn btn-secondary btn-sm">
              <Wand2 size={13} /> Tailor Resume
            </Link>
            {plan && (
              <button className="btn btn-secondary btn-sm" onClick={handleGenerate} disabled={loading}>
                Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty state — prompt to generate */}
      {!plan && !loading && (
        <div className="card animate-fade-up" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={28} color="#A78BFA" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
            Ready to ace your {job.company} interview?
          </h3>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
            {isLLMEnabled
              ? `Get a personalized plan with role-specific technical questions, STAR behavioral prompts, curated resources, and a 3-week study timeline tailored to ${job.title} at ${job.company}.`
              : `Get a comprehensive prep plan with technical questions, behavioral prompts, curated resources, and a study timeline. Add VITE_OPENAI_API_KEY for a fully personalized plan.`}
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleGenerate} style={{ margin: '0 auto' }}>
            <BookOpen size={17} /> Generate Prep Plan
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 0' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Building your prep plan…</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
              Generating tailored questions, resources, and study timeline for {job.title} at {job.company}
            </div>
          </div>
        </div>
      )}

      {/* Full plan */}
      {plan && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Role overview + key topics */}
          <div className="card animate-fade-up" style={{ padding: '24px' }}>
            <SectionHeader icon={Target} title="Role Overview" />
            <p style={{ color: 'var(--text-2)', lineHeight: 1.8, fontSize: '0.875rem', marginBottom: 16 }}>
              {plan.roleOverview}
            </p>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: 8 }}>
              KEY TOPICS TO MASTER
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(plan.keyTopics ?? []).map((topic) => (
                <span key={topic} className="badge badge-purple" style={{ fontSize: '0.72rem' }}>{topic}</span>
              ))}
            </div>
          </div>

          {/* Technical questions */}
          <div className="card animate-fade-up" style={{ padding: '24px' }}>
            <SectionHeader icon={Code2} title="Technical Questions" count={plan.technicalQuestions?.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(plan.technicalQuestions ?? []).map((q, i) => (
                <QuestionCard
                  key={i}
                  open={openTech.has(i)}
                  onToggle={() => toggle(setOpenTech, i)}
                  question={q.question}
                  hint={q.hint}
                  hintLabel="Key Concepts & Approach"
                  meta={
                    <>
                      <span className={`badge ${DIFF_BADGE[q.difficulty] ?? 'badge-gray'}`}>{q.difficulty}</span>
                      <span className="badge badge-gray">{q.category}</span>
                    </>
                  }
                />
              ))}
            </div>
          </div>

          {/* Scenario / behavioral */}
          <div className="card animate-fade-up" style={{ padding: '24px' }}>
            <SectionHeader icon={MessageSquare} title="Scenario-Based Questions" count={plan.scenarioQuestions?.length} />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 14 }}>
              Answer using the STAR method — Situation → Task → Action → Result
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(plan.scenarioQuestions ?? []).map((q, i) => (
                <QuestionCard
                  key={i}
                  open={openScenario.has(i)}
                  onToggle={() => toggle(setOpenScenario, i)}
                  question={q.question}
                  hint={q.starGuide}
                  hintLabel="STAR Guide"
                  meta={<span className="badge badge-blue">{q.competency}</span>}
                />
              ))}
            </div>
          </div>

          {/* Company questions */}
          <div className="card animate-fade-up" style={{ padding: '24px' }}>
            <SectionHeader icon={Building2} title="Company & Fit Questions" count={plan.companyQuestions?.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(plan.companyQuestions ?? []).map((q, i) => (
                <QuestionCard
                  key={i}
                  open={openCompany.has(i)}
                  onToggle={() => toggle(setOpenCompany, i)}
                  question={q.question}
                  hint={q.tip}
                  hintLabel="Research Tip"
                />
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="card animate-fade-up" style={{ padding: '24px' }}>
            <SectionHeader icon={GraduationCap} title="Resources & Links" count={plan.resources?.length} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 12 }}>
              {(plan.resources ?? []).map((r, i) => (
                <ResourceCard key={i} resource={r} />
              ))}
            </div>
          </div>

          {/* Study timeline */}
          <div className="card animate-fade-up" style={{ padding: '24px' }}>
            <SectionHeader icon={Calendar} title="Study Timeline" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Week 1', text: plan.studyPlan?.week1, color: '#3B82F6' },
                { label: 'Week 2', text: plan.studyPlan?.week2, color: '#8B5CF6' },
                { label: 'Week 3', text: plan.studyPlan?.week3, color: '#10B981' },
                { label: 'Day Before', text: plan.studyPlan?.dayBefore, color: '#F59E0B' },
              ].map((step, i, arr) => (
                <div key={step.label} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: `${step.color}18`, border: `2px solid ${step.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: step.color }}>{i + 1}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 20, margin: '4px 0' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 20 : 0, flex: 1, paddingTop: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: step.color, marginBottom: 4 }}>{step.label}</div>
                    <div style={{ color: 'var(--text-2)', fontSize: '0.82rem', lineHeight: 1.75 }}>{step.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isLLMEnabled && (
            <div style={{
              padding: '12px 16px', borderRadius: 9,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              color: '#FDE68A', fontSize: '0.8rem',
            }}>
              Demo mode — add a <strong>VITE_OPENAI_API_KEY</strong> to generate a fully personalized plan tailored to this exact job description.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <Icon size={16} color="#8B5CF6" />
      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
      {count > 0 && (
        <span style={{
          background: 'rgba(139,92,246,0.15)', color: '#C4B5FD',
          borderRadius: 99, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function QuestionCard({ question, meta, hint, hintLabel, open, onToggle }) {
  return (
    <div style={{ borderRadius: 9, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '12px 14px', background: open ? 'var(--card-hover)' : 'transparent',
          border: 'none', display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 12, cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.55, marginBottom: meta ? 7 : 0 }}>
            {question}
          </div>
          {meta && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{meta}</div>}
        </div>
        <div style={{ flexShrink: 0, color: 'var(--text-3)', marginTop: 2 }}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>
      {open && hint && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--card-hover)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 6 }}>
            {(hintLabel ?? 'HINT').toUpperCase()}
          </div>
          <div style={{
            fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.8,
            paddingLeft: 12, borderLeft: '2px solid rgba(139,92,246,0.35)',
          }}>
            {hint}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }) {
  const Icon = TYPE_ICON[resource.type] ?? Globe;
  const priorityBadge = PRIORITY_BADGE[resource.priority] ?? 'badge-gray';

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, padding: '14px',
        borderRadius: 9, background: 'var(--card)', border: '1px solid var(--border)',
        textDecoration: 'none', transition: 'all 0.15s', cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)';
        e.currentTarget.style.background = 'var(--card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--card)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: 'var(--gradient-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={13} color="#A78BFA" />
          </div>
          <span className={`badge ${priorityBadge}`} style={{ fontSize: '0.65rem' }}>{resource.priority}</span>
        </div>
        <ExternalLink size={13} color="var(--text-3)" />
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.3 }}>
        {resource.title}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
        {resource.description}
      </div>
    </a>
  );
}
