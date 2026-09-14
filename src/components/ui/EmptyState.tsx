import React from 'react';
import { GlassCard } from './GlassCard';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <GlassCard
      elevated
      style={{
        textAlign: 'center',
        padding: '36px 24px',
        maxWidth: '520px',
        margin: '24px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent-emerald-subtle)',
          color: 'var(--accent-emerald)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px',
          border: '1px solid var(--accent-emerald-border)',
        }}
      >
        {icon}
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '420px' }}>
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
          {actionText && onAction && (
            <button onClick={onAction} className="btn btn-primary">
              {actionText}
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button onClick={onSecondaryAction} className="btn btn-secondary">
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
};
