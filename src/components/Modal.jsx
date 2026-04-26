import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 700 }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(6,6,20,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#0C0C22', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, width: '100%', maxWidth,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          animation: 'fadeUp 0.25s ease',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#F0EFFF' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '6px', cursor: 'pointer',
              color: '#9090B8', display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#F0EFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9090B8'; }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
