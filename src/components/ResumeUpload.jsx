import { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ACCEPTED = ['.pdf', '.doc', '.docx'];
const MAX_MB = 10;

function formatSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

export default function ResumeUpload({ compact = false }) {
  const { resume, uploadResume } = useApp();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const validate = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) return `Only ${ACCEPTED.join(', ')} files are supported`;
    if (file.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB}MB`;
    return null;
  };

  const handleFile = (file) => {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError('');
    setUploading(true);
    setTimeout(() => {
      uploadResume(file);
      setUploading(false);
    }, 900);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  if (resume && !compact) {
    return (
      <div className="card animate-fade-up" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <FileText size={22} color="#A78BFA" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: '#F0EFFF', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resume.name}
            </div>
            <div style={{ color: '#9090B8', fontSize: '0.8rem', marginTop: 2 }}>
              {formatSize(resume.size)} · Uploaded just now
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="badge badge-green" style={{ gap: 5 }}>
              <CheckCircle2 size={11} />
              Parsed
            </span>
            <button
              onClick={() => inputRef.current?.click()}
              className="btn btn-secondary btn-sm"
            >
              Replace
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} style={{ display: 'none' }} onChange={onInputChange} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 16,
          padding: compact ? '32px 24px' : '48px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, cursor: uploading ? 'wait' : 'pointer',
          background: dragging ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s',
          textAlign: 'center',
        }}
        onMouseEnter={(e) => { if (!dragging) e.currentTarget.style.background = 'rgba(139,92,246,0.04)'; }}
        onMouseLeave={(e) => { if (!dragging) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
      >
        {uploading ? (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              border: '3px solid rgba(139,92,246,0.2)',
              borderTop: '3px solid #8B5CF6',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div>
              <div style={{ fontWeight: 500, color: '#F0EFFF' }}>Parsing resume...</div>
              <div style={{ color: '#9090B8', fontSize: '0.82rem', marginTop: 4 }}>Extracting your experience and skills</div>
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <UploadCloud size={26} color="#A78BFA" />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#F0EFFF', fontSize: '1rem' }}>
                Drop your resume here
              </div>
              <div style={{ color: '#9090B8', fontSize: '0.85rem', marginTop: 6 }}>
                or <span style={{ color: '#A78BFA', textDecoration: 'underline' }}>browse files</span>
              </div>
              <div style={{ color: '#55557A', fontSize: '0.78rem', marginTop: 8 }}>
                PDF, DOC, DOCX · Max {MAX_MB}MB
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#FCA5A5', fontSize: '0.82rem',
          background: 'rgba(239,68,68,0.08)', padding: '8px 12px',
          borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} style={{ display: 'none' }} onChange={onInputChange} />
    </div>
  );
}
