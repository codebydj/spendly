import React from 'react';

interface SpendlyLogoProps {
  type?: 'icon' | 'symbol' | 'full';
  size?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const SpendlyLogo: React.FC<SpendlyLogoProps> = ({
  type = 'full',
  size = 44,
  height = 44,
  className,
  style,
}) => {
  const iconSize = type === 'full' ? height : size;

  const iconElement = (
    <img
      src="/spendly-icon.png"
      alt="Spendly"
      style={{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        objectFit: 'contain',
        borderRadius: '22%',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: 'drop-shadow(0 4px 10px rgba(139, 92, 246, 0.4))',
      }}
    />
  );

  if (type === 'icon' || type === 'symbol') {
    return (
      <div className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        {iconElement}
      </div>
    );
  }

  // Full brand logo: Icon + SPENDLY name
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${Math.max(10, height * 0.28)}px`,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {iconElement}
      <span
        style={{
          fontSize: `${height * 0.62}px`,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: 'var(--text-primary)',
          fontFamily: "'Manrope', 'Inter', sans-serif",
          lineHeight: 1,
        }}
      >
        spendly
      </span>
    </div>
  );
};
