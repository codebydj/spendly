import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  style,
}) => {
  return (
    <div
      className="skeleton-box"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Net Worth Card Skeleton */}
      <div
        className="card-level-3"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          minHeight: '140px',
        }}
      >
        <Skeleton width="120px" height="16px" />
        <Skeleton width="220px" height="40px" />
        <div style={{ display: 'flex', gap: '16px', paddingTop: '8px' }}>
          <Skeleton width="100px" height="14px" />
          <Skeleton width="100px" height="14px" />
        </div>
      </div>

      {/* 3 Metrics Cards Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-level-2" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton width="80px" height="14px" />
            <Skeleton width="140px" height="28px" />
          </div>
        ))}
      </div>

      {/* Recent Transactions List Skeleton */}
      <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="160px" height="20px" />
          <Skeleton width="60px" height="14px" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton width="40px" height="40px" borderRadius="12px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skeleton width="140px" height="16px" />
                <Skeleton width="90px" height="12px" />
              </div>
            </div>
            <Skeleton width="80px" height="20px" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const AccountsSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="120px" height="18px" />
            <Skeleton width="60px" height="20px" borderRadius="6px" />
          </div>
          <Skeleton width="160px" height="32px" />
          <Skeleton width="100%" height="8px" borderRadius="4px" />
        </div>
      ))}
    </div>
  );
};

export const TransactionsSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Skeleton width="100%" height="44px" borderRadius="12px" />
        <Skeleton width="120px" height="44px" borderRadius="12px" />
      </div>
      <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
        {[1, 2, 3, 5, 6].map((i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton width="42px" height="42px" borderRadius="12px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skeleton width="150px" height="16px" />
                <Skeleton width="100px" height="12px" />
              </div>
            </div>
            <Skeleton width="90px" height="20px" />
          </div>
        ))}
      </div>
    </div>
  );
};
