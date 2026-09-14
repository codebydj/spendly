import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  // Maximum visible stacked notifications: 3
  const visibleToasts = toasts.slice(-3);

  return (
    <div className="toast-container" aria-live="polite" role="status">
      {visibleToasts.map((toast) => {
        let border = 'rgba(139, 92, 246, 0.3)';
        let bg = 'rgba(17, 21, 46, 0.96)';
        let icon = <CheckCircle2 size={16} color="var(--accent-emerald)" />;
        let titleText = 'Success';

        if (toast.type === 'warning') {
          border = 'rgba(245, 158, 11, 0.4)';
          icon = <AlertCircle size={16} color="var(--status-warning)" />;
          titleText = 'Notice';
        } else if (toast.type === 'danger') {
          border = 'rgba(239, 68, 68, 0.4)';
          icon = <AlertCircle size={16} color="var(--status-danger)" />;
          titleText = 'Alert';
        } else if (toast.type === 'info') {
          border = 'rgba(34, 211, 238, 0.35)';
          icon = <Info size={16} color="var(--accent-cyan)" />;
          titleText = 'Info';
        }

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: bg,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${border}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {titleText}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {toast.message}
                </div>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn-icon"
              style={{ padding: '2px', minHeight: '28px', minWidth: '28px', color: 'var(--text-muted)', flexShrink: 0 }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
