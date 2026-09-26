import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FadeInProps {
  children: React.ReactNode;
  delayMs?: number;
  durationMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delayMs = 0,
  durationMs = 240,
  className = '',
  style,
}) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className} style={style}>{children}</div>;
  }

  return (
    <div
      className={className}
      style={{
        animation: `itemFadeIn ${durationMs}ms var(--ease-enter) ${delayMs}ms forwards`,
        opacity: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
