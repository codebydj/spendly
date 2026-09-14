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
        let icon = <Sparkles size={18} color="var(--accent-emerald)" />;
        let borderColor = 'var(--accent-emerald-border)';

        if (item.type === 'WARNING') {
          icon = <AlertCircle size={18} color="var(--status-warning)" />;
          borderColor = 'rgba(245, 158, 11, 0.25)';
        } else if (item.type === 'POSITIVE') {
          icon = <TrendingDown size={18} color="var(--accent-emerald)" />;
        } else {
          icon = <Calendar size={18} color="var(--accent-blue)" />;
          borderColor = 'rgba(59, 130, 246, 0.25)';
        }

        return (
          <GlassCard
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              borderLeft: `3px solid ${borderColor}`,
              padding: '14px 16px',
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>{icon}</div>
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
