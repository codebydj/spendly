import React from 'react';
import { Modal } from '../ui/Modal';
import { Download, Sparkles, Clock, ArrowRight } from 'lucide-react';
import type { AppVersionManifest } from '../../types/finance';
import { APP_VERSION, ANDROID_APK_DOWNLOAD_URL } from '../../config/appVersion';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: AppVersionManifest | null;
  onLater: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, manifest, onLater }) => {
  if (!manifest) return null;

  const latestVersion = manifest.version ? `V${manifest.version.replace(/^v/i, '')}` : `V${APP_VERSION}`;
  const currentVersion = `V${APP_VERSION}`;
  const title = manifest.title || `Spendly ${latestVersion} Released`;
  const buildDate = manifest.buildDate || manifest.releaseDate || '16-09-2026';
  const downloadUrl = manifest.downloadUrl || ANDROID_APK_DOWNLOAD_URL;
  const message = manifest.message || 'New improvements, automatic sync enhancements, and stability fixes are available.';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" subtitle="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '4px' }}>
        {/* Header Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              backgroundColor: 'var(--accent-cyan-subtle)',
              border: '1px solid var(--accent-cyan-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: 'var(--accent-cyan)',
                  color: '#000000',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                NEW UPDATE AVAILABLE
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{buildDate}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              Spendly Update
            </h2>
          </div>
        </div>

        {/* Version Comparison Badge Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(17, 21, 46, 0.7)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '12px 16px',
            textAlign: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Version
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px' }}>
              {currentVersion}
            </div>
          </div>

          <div style={{ color: 'var(--accent-cyan)', opacity: 0.8 }}>
            <ArrowRight size={18} />
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Latest Version
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
              {latestVersion}
            </div>
          </div>
        </div>

        {/* Update Summary / Release Message */}
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</p>
          <p>{message}</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onLater}
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Clock size={16} /> Later
          </button>

          <button
            type="button"
            onClick={() => {
              window.open(downloadUrl, '_blank');
              onClose();
            }}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} /> View Update
          </button>
        </div>
      </div>
    </Modal>
  );
};

