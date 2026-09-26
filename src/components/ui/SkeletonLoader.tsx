import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  style,
  className = '',
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'rgba(19, 26, 52, 0.85)',
        ...style,
      }}
    />
  );
};

export const SkeletonText: React.FC<{ width?: string; height?: string; style?: React.CSSProperties }> = ({
  width = '120px',
  height = '14px',
  style,
}) => <Skeleton width={width} height={height} borderRadius="4px" style={style} />;

export const SkeletonCard: React.FC<{ height?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  height = '120px',
  children,
  style,
}) => (
  <div
    className="card-level-2"
    style={{
      padding: '20px',
      height,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '12px',
      ...style,
    }}
  >
    {children || (
      <>
        <SkeletonText width="40%" height="14px" />
        <Skeleton width="70%" height="28px" />
      </>
    )}
  </div>
);

export const SkeletonTransaction: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Skeleton width="42px" height="42px" borderRadius="12px" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SkeletonText width="140px" height="15px" />
        <SkeletonText width="90px" height="12px" />
      </div>
    </div>
    <Skeleton width="80px" height="20px" borderRadius="6px" />
  </div>
);

export const SkeletonAccount: React.FC = () => (
  <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SkeletonText width="110px" height="16px" />
      <Skeleton width="60px" height="20px" borderRadius="6px" />
    </div>
    <Skeleton width="150px" height="32px" />
    <Skeleton width="100%" height="8px" borderRadius="4px" />
  </div>
);

export const SkeletonBudget: React.FC = () => (
  <div className="card-level-2" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SkeletonText width="120px" height="16px" />
      <SkeletonText width="80px" height="14px" />
    </div>
    <Skeleton width="100%" height="10px" borderRadius="6px" />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SkeletonText width="90px" height="12px" />
      <SkeletonText width="60px" height="12px" />
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ height?: string }> = ({ height = '260px' }) => (
  <div className="card-level-2" style={{ padding: '24px', height, display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SkeletonText width="140px" height="18px" />
      <SkeletonText width="80px" height="14px" />
    </div>
    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '16px', paddingTop: '16px' }}>
      {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
        <Skeleton key={i} width="100%" height={`${h}%`} borderRadius="6px 6px 0 0" />
      ))}
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Net Worth Card Skeleton */}
      <div className="card-level-3" style={{ padding: '24px', minHeight: '140px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SkeletonText width="120px" height="16px" />
        <Skeleton width="220px" height="40px" />
        <div style={{ display: 'flex', gap: '16px', paddingTop: '8px' }}>
          <SkeletonText width="110px" height="14px" />
          <SkeletonText width="110px" height="14px" />
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Chart & Transactions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <SkeletonChart />
        <div className="card-level-2" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <SkeletonText width="150px" height="18px" />
            <SkeletonText width="60px" height="14px" />
          </div>
          <SkeletonTransaction />
          <SkeletonTransaction />
          <SkeletonTransaction />
          <SkeletonTransaction />
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton = SkeletonDashboard;
export const AccountsSkeleton: React.FC = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
    <SkeletonAccount />
    <SkeletonAccount />
    <SkeletonAccount />
    <SkeletonAccount />
  </div>
);

export const TransactionsSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ display: 'flex', gap: '12px' }}>
      <Skeleton width="100%" height="44px" borderRadius="12px" />
      <Skeleton width="120px" height="44px" borderRadius="12px" />
    </div>
    <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
      <SkeletonTransaction />
      <SkeletonTransaction />
      <SkeletonTransaction />
      <SkeletonTransaction />
      <SkeletonTransaction />
      <SkeletonTransaction />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonTransaction key={i} />
    ))}
  </div>
);
