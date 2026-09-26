import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface StaggerListProps {
  children: React.ReactNode[];
  staggerIntervalMs?: number;
  maxStaggerMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  staggerIntervalMs = 35,
  maxStaggerMs = 140,
  className = '',
  style,
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className={className} style={style}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        if (reducedMotion) {
          return child;
        }

        const delay = Math.min(index * staggerIntervalMs, maxStaggerMs);

        return (
          <div
            key={child.key || index}
            style={{
              animation: `itemFadeIn var(--motion-slow) var(--ease-enter) ${delay}ms forwards`,
              opacity: 0,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
