import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * PageTransition wrapper for content views.
 * Applies subtle opacity (0 -> 1) and translateY (6px -> 0) entrance transition over ~280ms.
 * Keeps shell (header, sidebar, mobile nav) completely stable.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '', style }) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className} style={style}>{children}</div>;
  }

  return (
    <div
      className={`page-enter ${className}`.trim()}
      style={{
        width: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
