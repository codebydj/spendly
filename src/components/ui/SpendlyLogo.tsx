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
  size = 36,
  height = 36,
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
        gap: `${Math.max(8, height * 0.28)}px`,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {iconElement}
      <span
        style={{
          fontSize: `${height * 0.58}px`,
          fontWeight: 800,
          letterSpacing: '-0.02em',
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
