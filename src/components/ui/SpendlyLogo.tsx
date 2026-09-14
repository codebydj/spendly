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
  if (type === 'full') {
    return (
      <img
        src="/spendly-logo.png"
        alt="Spendly"
        className={className}
        style={{
          height: `${height}px`,
          width: 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src="/spendly-icon.png"
      alt="Spendly"
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        borderRadius: '22%',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
};
