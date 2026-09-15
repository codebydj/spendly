import React from 'react';
import { Modal } from '../ui/Modal';
import { Download, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import type { AppVersionManifest } from '../../types/finance';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: AppVersionManifest | null;
  onLater: () => void;
}

import { ANDROID_APK_DOWNLOAD_URL } from '../../config/appVersion';

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, manifest, onLater }) => {
  if (!manifest) return null;

  const title = manifest.title || `Spendly V${manifest.version}`;
  const releaseDate = manifest.releaseDate || '15 September 2026';
  const downloadUrl = manifest.downloadUrl || ANDROID_APK_DOWNLOAD_URL;

  const notes = manifest.releaseNotes || [
    'Added notifications when a new Spendly app version is available',
    'Improved offline data reliability and synchronization',
    'Improved application stability and update handling',
    'Added clearer version and release information',
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" subtitle="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '4px' }}>
        {/* Header Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              backgroundColor: 'var(--accent-violet-subtle)',
              border: '1px solid var(--accent-violet-border)',
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
              <span style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'var(--accent-cyan)', color: '#000000', padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.04em' }}>
                NEW UPDATE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{releaseDate}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {title}
            </h2>
          </div>
        </div>

        {/* Message */}
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {manifest.message || 'Spendly V3.1.2 is now available with automatic realtime cloud synchronization and improvements.'}
        </p>

        {/* Release Notes List */}
        <div
          style={{
            backgroundColor: 'rgba(17, 21, 46, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <h4 style={{ fontSize: '0.84rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            What's New in {title}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notes.map((note, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px', flexWrap: 'wrap' }}>
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
            <Download size={16} /> Download Latest APK
          </button>
        </div>
      </div>
    </Modal>
  );
};
