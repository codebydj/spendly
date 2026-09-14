import React from 'react';
import { GlassCard } from './GlassCard';
import { Sparkles, TrendingDown, AlertCircle, Calendar } from 'lucide-react';

export interface InsightItem {
  id: string;
  type: 'POSITIVE' | 'NEUTRAL' | 'WARNING';
  title: string;
  message: string;
}

interface InsightCardProps {
  insights: InsightItem[];
}

export const InsightCard: React.FC<InsightCardProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return (
      <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
        <Sparkles size={18} color="var(--accent-emerald)" />
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Add a few transactions to unlock spending insights and savings suggestions.
        </p>
      </GlassCard>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      {insights.map((item) => {
        let icon = <Sparkles size={18} color="var(--accent-violet)" />;
        let iconBg = 'rgba(139, 92, 246, 0.14)';
        let borderGradient = 'rgba(139, 92, 246, 0.35)';

        if (item.type === 'WARNING') {
          icon = <AlertCircle size={18} color="var(--status-warning)" />;
          iconBg = 'rgba(245, 158, 11, 0.14)';
          borderGradient = 'rgba(245, 158, 11, 0.35)';
        } else if (item.type === 'POSITIVE') {
          icon = <TrendingDown size={18} color="var(--accent-cyan)" />;
          iconBg = 'rgba(34, 211, 238, 0.14)';
          borderGradient = 'rgba(34, 211, 238, 0.35)';
        } else if (item.title.toLowerCase().includes('top category')) {
          icon = <Sparkles size={18} color="var(--accent-cyan)" />;
          iconBg = 'rgba(34, 211, 238, 0.14)';
          borderGradient = 'rgba(34, 211, 238, 0.35)';
        } else {
          icon = <Calendar size={18} color="var(--accent-blue)" />;
          iconBg = 'rgba(96, 165, 250, 0.14)';
          borderGradient = 'rgba(96, 165, 250, 0.35)';
        }

        return (
          <GlassCard
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              borderLeft: `4px solid ${borderGradient}`,
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${borderGradient}`,
              }}
            >
              {icon}
            </div>
            <div>
              <h5 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h5>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {item.message}
              </p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
