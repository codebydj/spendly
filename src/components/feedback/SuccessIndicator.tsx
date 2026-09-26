import React from 'react';

interface SuccessIndicatorProps {
  size?: number;
  message?: string;
}

export const SuccessIndicator: React.FC<SuccessIndicatorProps> = ({
  size = 40,
  message,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="18" stroke="var(--accent-cyan)" strokeWidth="2.5" fill="var(--accent-cyan-subtle)" />
        <path
          d="M12 20.5L17.5 26L28 14"
          stroke="var(--accent-cyan)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-draw"
        />
      </svg>
      {message && (
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {message}
        </span>
      )}
    </div>
  );
};
