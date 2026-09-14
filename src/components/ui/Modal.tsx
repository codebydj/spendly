import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMobile = window.innerWidth <= 768;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(8, 11, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '520px',
          maxHeight: isMobile ? '92vh' : '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-color)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          borderBottomLeftRadius: isMobile ? 0 : 'var(--radius-xl)',
          borderBottomRightRadius: isMobile ? 0 : 'var(--radius-xl)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 16px)' : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)' }} />
          </div>
        )}

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: 'var(--text-muted)', marginTop: '-4px' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
};
