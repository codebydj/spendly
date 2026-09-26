import React from 'react';
import { GlassCard } from './GlassCard';
import { AnimatedNumber } from '../motion/AnimatedNumber';

interface StatCardProps {
  label: string;
  amount: number;
  icon?: React.ReactNode;
  accentColor?: string;
  hideBalances?: boolean;
  currency?: string;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  amount,
  icon,
  accentColor = 'var(--text-primary)',
  hideBalances = false,
  subtext,
}) => {
  return (
    <GlassCard className="card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {label}
        </span>
        {icon && <div style={{ opacity: 0.9 }}>{icon}</div>}
      </div>

      <div
        style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1.2,
        }}
        className="tabular-nums"
      >
        <AnimatedNumber value={amount} isMasked={hideBalances} />
      </div>

      {subtext && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {subtext}
        </span>
      )}
    </GlassCard>
  );
};
