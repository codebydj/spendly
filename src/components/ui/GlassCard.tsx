import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  elevated = false,
  interactive = false,
  className = '',
  style = {},
  onClick,
}) => {
  const baseClass = elevated ? 'glass-surface-elevated' : 'glass-surface';
  const interactiveClass = interactive ? 'glass-surface-interactive' : '';

  return (
    <div
      className={`${baseClass} ${interactiveClass} ${className}`}
      style={{
        cursor: onClick || interactive ? 'pointer' : 'default',
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
