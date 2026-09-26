import React from 'react';

interface ProgressBarProps {
  percentage: number;
  height?: string;
  isGoal?: boolean;
  customColor?: string;
  showGlow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  height = '8px',
  isGoal = false,
  customColor,
  className = '',
  style,
}) => {
  const clamped = Math.min(Math.max(0, percentage), 100);

  let fillColor = customColor || 'var(--accent-cyan)';
  if (!customColor && !isGoal) {
    if (percentage >= 100) {
      fillColor = 'var(--status-danger)';
    } else if (percentage >= 80) {
      fillColor = 'var(--status-warning)';
    } else {
      fillColor = 'var(--accent-cyan)';
    }
  }

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height,
        backgroundColor: 'rgba(15, 21, 42, 0.8)',
        borderRadius: '999px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        ...style,
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: '999px',
          transition: 'width var(--motion-slow) var(--ease-spring), background-color var(--motion-normal) var(--ease-standard)',
        }}
      />
    </div>
  );
};
