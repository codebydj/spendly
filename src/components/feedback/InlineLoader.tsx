import React from 'react';

interface InlineLoaderProps {
  size?: number;
  text?: string;
  color?: string;
  className?: string;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 16,
  text,
  color = 'currentColor',
  className = '',
}) => {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.84rem',
        fontWeight: 600,
        color,
      }}
    >
      <span
        className="spin-slow"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderTopColor: color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {text && <span>{text}</span>}
    </span>
  );
};
