import React, { useState } from 'react';

export interface CategoryData {
  categoryId: string;
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

interface DonutChartProps {
  data: CategoryData[];
  totalAmount: number;
  currency?: string;
  hideBalances?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, totalAmount, currency = '₹', hideBalances }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryData | null>(null);

  if (data.length === 0 || totalAmount === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
        No expense data recorded for this period.
      </div>
    );
  }

  // SVG Geometry
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercentage = 0;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
          />
          {/* Slices */}
          {data.map((cat) => {
            const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);
            accumulatedPercentage += cat.percentage;

            const isHovered = activeCategory?.categoryId === cat.categoryId;

            return (
              <circle
                key={cat.categoryId}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={cat.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${center} ${center})`}
                style={{
                  transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                  cursor: 'pointer',
                  opacity: activeCategory && !isHovered ? 0.6 : 1,
                }}
                onMouseEnter={() => setActiveCategory(cat)}
                onMouseLeave={() => setActiveCategory(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
            padding: '12px',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {activeCategory ? activeCategory.name : 'TOTAL EXPENSE'}
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }} className="tabular-nums">
            {hideBalances
              ? '•••••'
              : `${currency}${(activeCategory ? activeCategory.amount : totalAmount).toLocaleString()}`}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {activeCategory ? `${activeCategory.percentage}%` : `${data.length} categories`}
          </span>
        </div>
      </div>

      {/* Category breakdown legend */}
      <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map((cat) => (
          <div
            key={cat.categoryId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeCategory?.categoryId === cat.categoryId ? 'var(--bg-surface-hover)' : 'transparent',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setActiveCategory(cat)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: cat.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{cat.percentage}%</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="tabular-nums">
                {hideBalances ? '•••••' : `${currency}${cat.amount.toLocaleString()}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BarChartProps {
  items: { label: string; income: number; expense: number }[];
  currency?: string;
  hideBalances?: boolean;
}

export const IncomeExpenseBarChart: React.FC<BarChartProps> = ({ items, currency = '₹' }) => {
  const maxVal = Math.max(...items.flatMap((i) => [i.income, i.expense]), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent-emerald)', borderRadius: '2px' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Income</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--status-danger)', borderRadius: '2px' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Expenses</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '12px',
          height: '180px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px',
        }}
      >
        {items.map((item, idx) => {
          const incHeight = (item.income / maxVal) * 100;
          const expHeight = (item.expense / maxVal) * 100;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%', width: '100%', justifyContent: 'center' }}>
                {/* Income Bar */}
                <div
                  style={{
                    width: '35%',
                    maxWidth: '20px',
                    height: `${Math.max(incHeight, 4)}%`,
                    backgroundColor: 'var(--accent-emerald)',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                  title={`Income: ${currency}${item.income.toLocaleString()}`}
                />
                {/* Expense Bar */}
                <div
                  style={{
                    width: '35%',
                    maxWidth: '20px',
                    height: `${Math.max(expHeight, 4)}%`,
                    backgroundColor: 'var(--status-danger)',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                  title={`Expenses: ${currency}${item.expense.toLocaleString()}`}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
