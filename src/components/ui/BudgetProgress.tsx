import React from 'react';

interface BudgetProgressProps {
  categoryName: string;
  categoryColor?: string;
  spent: number;
  limit: number;
  hideBalances?: boolean;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  categoryName,
  categoryColor = 'var(--accent-emerald)',
  spent,
  limit,
  hideBalances = false,
}) => {
  const remaining = limit - spent;
  const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const isOver = spent > limit;
  const isWarning = percentage >= 80 && !isOver;

  let statusBadge = (
    <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
      ON TRACK
    </span>
  );
  let barColor = categoryColor;

  if (isOver) {
    statusBadge = (
      <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>
        OVER BUDGET
      </span>
    );
    barColor = 'var(--status-danger)';
  } else if (isWarning) {
    statusBadge = (
      <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
        80% REACHED
      </span>
    );
    barColor = 'var(--status-warning)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: categoryColor }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{categoryName}</span>
        </div>
        {statusBadge}
      </div>

      {/* Progress Bar Container */}
      <div
        style={{
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-glass)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }} className="tabular-nums">
        <span>
          Spent: <strong style={{ color: isOver ? 'var(--status-danger)' : 'var(--text-primary)' }}>{hideBalances ? '₹•••••' : `₹${spent.toLocaleString()}`}</strong>
        </span>
        <span>
          Limit: {hideBalances ? '₹•••••' : `₹${limit.toLocaleString()}`} ({hideBalances ? '•••' : `₹${Math.abs(remaining).toLocaleString()}`} {isOver ? 'over' : 'left'})
        </span>
      </div>
    </div>
  );
};
