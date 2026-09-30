import React from 'react';
import { Modal } from '../ui/Modal';
import { VERSION_HISTORY } from '../../config/versionHistory';
import { Check, Sparkles } from 'lucide-react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExplore: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  onExplore,
}) => {
  const currentRelease = VERSION_HISTORY[0] || {
    version: 'V3.3.1',
    title: 'Mobile Experience & Notifications',
    date: '30 September 2026',
    features: ['Improved mobile notifications', 'Better responsive layouts', 'New update summary experience'],
    fixes: ['Fixed transaction type selector shaking', 'Fixed mobile layout issues'],
  };

  const features = currentRelease.features || currentRelease.highlights || [];
  const fixes = currentRelease.fixes || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="What's New in Spendly"
      subtitle={`${currentRelease.version} • ${currentRelease.title}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Release Header Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(32, 196, 232, 0.08)',
            border: '1px solid var(--accent-cyan-border)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-cyan-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {currentRelease.version}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {currentRelease.date}
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {currentRelease.title}
            </p>
          </div>
        </div>

        {/* Features Section */}
        {features.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: 'var(--accent-emerald)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              NEW FEATURES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.86rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.4',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--accent-emerald)',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Check size={16} />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fixes Section */}
        {fixes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              BUGS FIXED
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fixes.map((fix, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.86rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.4',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--accent-cyan)',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Check size={16} />
                  </div>
                  <span>{fix}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <button
            type="button"
            onClick={onExplore}
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.86rem', minHeight: '44px' }}
          >
            Explore Update
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.86rem', minHeight: '44px' }}
          >
            Got It
          </button>
        </div>
      </div>
    </Modal>
  );
};
