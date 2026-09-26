import React, { useEffect, useState, useRef } from 'react';
import { formatINR, formatINRMasked } from '../../utils/currency';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedNumberProps {
  value: number;
  isMasked?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
  durationMs?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  isMasked = false,
  prefix = '',
  suffix = '',
  className = '',
  style,
  durationMs = 250,
}) => {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion || isMasked) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startValue = prevValueRef.current;
    const endValue = value;
    const diff = endValue - startValue;

    if (Math.abs(diff) < 0.01) {
      setDisplayValue(endValue);
      return;
    }

    const startTime = performance.now();

    const updateStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Fast ease-out easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateStep);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateStep);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, isMasked, durationMs, reducedMotion]);

  if (isMasked) {
    return (
      <span className={`tabular-nums ${className}`.trim()} style={style}>
        {prefix}{formatINRMasked(value, true)}{suffix}
      </span>
    );
  }

  return (
    <span className={`tabular-nums ${className}`.trim()} style={style}>
      {prefix}{formatINR(displayValue)}{suffix}
    </span>
  );
};
