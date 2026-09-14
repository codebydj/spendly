import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" role="status">
      {toasts.map((toast) => {
        let border = 'var(--border-color)';
        let bg = 'var(--bg-surface-elevated)';
        let icon = <CheckCircle2 size={18} color="var(--accent-emerald)" />;

        if (toast.type === 'warning') {
          border = 'rgba(245, 158, 11, 0.35)';
          icon = <AlertCircle size={18} color="var(--status-warning)" />;
        } else if (toast.type === 'danger') {
          border = 'rgba(239, 68, 68, 0.35)';
          icon = <AlertCircle size={18} color="var(--status-danger)" />;
        } else if (toast.type === 'info') {
          border = 'rgba(59, 130, 246, 0.35)';
          icon = <Info size={18} color="var(--accent-blue)" />;
        }

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: bg,
              border: `1px solid ${border}`,
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</div>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn-icon"
              style={{ padding: '4px', minHeight: '32px', minWidth: '32px', color: 'var(--text-muted)' }}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
