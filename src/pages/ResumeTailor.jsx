import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Wand2, Download, Eye, Check, Loader2,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MOCK_JOBS, getMatchColor } from '../data/mockData';
import { analyzeResumeMatch, generateTailoredResume, formatTailoredResumeAsText } from '../services/openai';
import MatchRing from '../components/MatchRing';
import Modal from '../components/Modal';

export default function ResumeTailor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { resume, jobs, tailoredResumes, saveTailoredResume, markApplied, appliedJobs } = useApp();

  // Look in live jobs first (JSearch), then fall back to mock data
  const job = jobs.find((j) => j.id === jobId) ?? MOCK_JOBS.find((j) => j.id === jobId);
  const resumeText = resume?.text || '';
  const existing = tailoredResumes[jobId];

  const [tab, setTab] = useState(existing ? 'tailored' : 'original');
  const [analysis, setAnalysis] = useState(null);
  const [tailored, setTailored] = useState(existing || null);
  const [editedText, setEditedText] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingTailor, setLoadingTailor] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showJD, setShowJD] = useState(true);
  const [applied, setApplied] = useState(appliedJobs.includes(jobId));

  useEffect(() => {
    if (!job) return;
    setLoadingAnalysis(true);
    analyzeResumeMatch(resumeText, job).then((result) => {
      setAnalysis(result);
      setLoadingAnalysis(false);
    });
  }, [job, resumeText]);

  useEffect(() => {
    if (tailored) {
      setEditedText(formatTailoredResumeAsText(tailored));
      setTab('tailored');
    }
  }, [tailored]);

  if (!job) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-2)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 8 }}>Job not found</div>
        <Link to="/jobs" className="btn btn-secondary">Back to Jobs</Link>
      </div>
    );
  }

  const handleGenerateTailored = async () => {
    setLoadingTailor(true);
    const result = await generateTailoredResume(resumeText, job);
    setTailored(result);
    saveTailoredResume(jobId, result);
    setLoadingTailor(false);
  };

  const handleApply = () => {
    markApplied(jobId);
    setApplied(true);
  };

  const handleDownload = () => {
    const text = editedText || (tailored ? formatTailoredResumeAsText(tailored) : resumeText);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_${job.company}_${job.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const portal = job.portal;
  const matchColor = getMatchColor(job.matchScore);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={15} /> Back to Jobs
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>{job.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-2)' }}>{job.company}</span>
              <span style={{ color: 'var(--text-3)' }}>·</span>
              <span style={{ color: 'var(--text-2)' }}>{job.location}</span>
              <span style={{ color: 'var(--text-3)' }}>·</span>
              <span style={{ color: '#A78BFA', fontWeight: 500 }}>{job.salary}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MatchRing score={tailored ? tailored.estimatedScore : job.matchScore} size={64} strokeWidth={5} showLabel />
            <div style={{ display: 'flex', gap: 8 }}>
              {tailored && (
                <>
                  <button className="btn btn-secondary" onClick={() => setPreviewOpen(true)}>
                    <Eye size={15} /> Preview
                  </button>
                  <button className="btn btn-secondary" onClick={handleDownload}>
                    <Download size={15} /> Download
                  </button>
                </>
              )}
              {applied ? (
                <span className="badge badge-green" style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.875rem' }}>
                  <CheckCircle2 size={15} /> Applied
                </span>
              ) : (
                <button className="btn btn-primary" onClick={handleApply} disabled={!tailored}>
                  <Send size={14} />
                  Apply on {portal.charAt(0).toUpperCase() + portal.slice(1)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="tailor-grid">

        {/* Left: Job description + AI analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Job description */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <button
              onClick={() => setShowJD(!showJD)}
              style={{
                width: '100%', padding: '16px 20px', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', color: 'var(--text)',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Job Description</span>
              {showJD ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
            </button>
            {showJD && (
              <div style={{
                padding: '0 20px 20px',
                maxHeight: 320, overflowY: 'auto',
                color: 'var(--text-2)', fontSize: '0.82rem', lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
              }}>
                {job.description}
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>AI Match Analysis</div>

            {loadingAnalysis ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)', fontSize: '0.85rem' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing your resume...
              </div>
            ) : analysis ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    flex: 1, height: 6, borderRadius: 99,
                    background: 'var(--bg-3)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${analysis.score}%`,
                      background: `linear-gradient(90deg, ${matchColor}90, ${matchColor})`,
                      borderRadius: 99, transition: 'width 1s ease',
                    }} />
                  </div>
                  <span style={{ color: matchColor, fontWeight: 700, fontSize: '0.9rem', minWidth: 36 }}>
                    {analysis.score}%
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 8 }}>
                    STRENGTHS
                  </div>
                  {analysis.strengths.map((s) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.82rem', color: '#6EE7B7' }}>
                      <CheckCircle2 size={13} /> {s}
                    </div>
                  ))}
                </div>

                {analysis.gaps.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 8 }}>
                      GAPS TO ADDRESS
                    </div>
                    {analysis.gaps.map((g) => (
                      <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.82rem', color: '#FCA5A5' }}>
                        <XCircle size={13} /> {g}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 8 }}>
                    AI SUGGESTIONS
                  </div>
                  {analysis.suggestions.map((s, i) => (
                    <div key={i} style={{
                      fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 6,
                      paddingLeft: 12, borderLeft: '2px solid rgba(139,92,246,0.3)',
                    }}>
                      {s}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Generate button */}
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center', padding: '12px 24px', fontSize: '0.95rem' }}
            onClick={handleGenerateTailored}
            disabled={loadingTailor}
          >
            {loadingTailor ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Generating tailored resume...
              </>
            ) : tailored ? (
              <>
                <Wand2 size={16} />
                Regenerate Tailored Resume
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Generate AI-Tailored Resume
              </>
            )}
          </button>

          {tailored && (
            <div style={{
              padding: '10px 14px', borderRadius: 9,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.82rem', color: '#6EE7B7',
            }}>
              <Check size={15} />
              Tailored resume generated · est. match {tailored.estimatedScore}%
            </div>
          )}
        </div>

        {/* Right: Resume editor */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', borderBottom: '1px solid var(--border)',
            padding: '0 20px',
          }}>
            {[
              { id: 'original', label: 'Original Resume' },
              { id: 'tailored', label: 'Tailored Resume', disabled: !tailored },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => !t.disabled && setTab(t.id)}
                disabled={t.disabled}
                style={{
                  padding: '14px 16px', background: 'none', border: 'none',
                  fontSize: '0.875rem', fontWeight: 500, cursor: t.disabled ? 'not-allowed' : 'pointer',
                  color: tab === t.id ? 'var(--text)' : 'var(--text-3)',
                  borderBottom: tab === t.id ? '2px solid #8B5CF6' : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.15s', opacity: t.disabled ? 0.4 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {t.label}
                {t.id === 'tailored' && tailored && (
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                    +{tailored.estimatedScore - job.matchScore}%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Editor area */}
          <div style={{ padding: '4px', flex: 1 }}>
            {loadingTailor ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 32px', color: 'var(--text-2)' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  border: '3px solid rgba(139,92,246,0.2)',
                  borderTop: '3px solid #8B5CF6',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>AI is tailoring your resume</div>
                  <div style={{ fontSize: '0.82rem' }}>Optimizing for {job.title} at {job.company}</div>
                </div>
              </div>
            ) : tab === 'tailored' && tailored ? (
              <textarea
                className="input"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', minHeight: 520,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem',
                  lineHeight: 1.8, padding: '16px 20px', resize: 'vertical',
                  borderRadius: 0,
                }}
              />
            ) : resume?.parsing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--text-2)', fontSize: '0.85rem' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                Parsing resume...
              </div>
            ) : resumeText ? (
              <div style={{
                padding: '16px 20px', minHeight: 520,
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem',
                lineHeight: 1.8, color: 'var(--text-2)', whiteSpace: 'pre-wrap',
                overflowY: 'auto',
              }}>
                {resumeText}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', color: 'var(--text-3)', fontSize: '0.85rem', textAlign: 'center' }}>
                No resume uploaded yet.{' '}
                <Link to="/" style={{ color: '#A78BFA' }}>Upload one</Link> to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title={`Resume Preview — ${job.company}`} maxWidth={760}>
        <ResumePreview tailored={tailored} onDownload={handleDownload} />
      </Modal>
    </div>
  );
}

function ResumePreview({ tailored, onDownload }) {
  if (!tailored) return null;
  const { name, contact, summary, experience, skills, education, projects } = tailored;

  const s = {
    section: { marginBottom: 20 },
    heading: { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#8B5CF6', textTransform: 'uppercase', borderBottom: '1px solid rgba(139,92,246,0.2)', paddingBottom: 4, marginBottom: 10 },
    expHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
    expTitle: { fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' },
    expPeriod: { color: 'var(--text-2)', fontSize: '0.8rem' },
    bullet: { color: 'var(--text-2)', fontSize: '0.82rem', lineHeight: 1.7, paddingLeft: 16, position: 'relative' },
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{name}</div>
        <div style={{ color: 'var(--text-2)', fontSize: '0.82rem', marginTop: 4 }}>{contact}</div>
        {tailored.tailoredFor && (
          <div style={{ marginTop: 8 }}>
            <span className="badge badge-purple">Tailored for {tailored.tailoredFor}</span>
          </div>
        )}
      </div>

      <div style={s.section}>
        <div style={s.heading}>Summary</div>
        <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.7 }}>{summary}</p>
      </div>

      <div style={s.section}>
        <div style={s.heading}>Experience</div>
        {experience.map((e, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={s.expHeader}>
              <span style={s.expTitle}>{e.role} · {e.company}</span>
              <span style={s.expPeriod}>{e.period}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {e.bullets.map((b, j) => (
                <li key={j} style={{ ...s.bullet, marginBottom: 4 }}>
                  <span style={{ position: 'absolute', left: 4, color: '#8B5CF6' }}>·</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.heading}>Skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[...skills.languages, ...skills.frameworks, ...skills.tools].slice(0, 12).map((sk) => (
            <span key={sk} className="badge badge-purple">{sk}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button className="btn btn-primary" onClick={onDownload}>
          <Download size={15} /> Download as TXT
        </button>
      </div>
    </div>
  );
}
