import React from 'react';
import { SpendlyLogo } from '../ui/SpendlyLogo';

interface BootstrapLoaderProps {
  message?: string;
}

export const BootstrapLoader: React.FC<BootstrapLoaderProps> = ({
  message = 'Preparing your finances...',
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#080B1A',
        backgroundImage:
          'radial-gradient(circle at 50% 40%, rgba(86, 133, 255, 0.15) 0%, transparent 60%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: '24px',
        padding: '24px',
      }}
    >
      <div className="pulse-subtle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpendlyLogo type="full" size={48} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2.5px solid var(--border-glass)',
            borderTopColor: 'var(--accent-cyan)',
          }}
          className="spin-slow"
        />
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.02em', marginTop: '4px' }}>
          {message}
        </p>
      </div>
    </div>
  );
};
