import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from '../ui/BottomSheet';
import { CloudCheck, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';

interface SyncBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncBottomSheet: React.FC<SyncBottomSheetProps> = ({ isOpen, onClose }) => {
  const {
    isOffline,
    syncStatus,
    pendingOpsCount,
    lastSyncTime,
    lastSyncError,
    triggerManualSync,
    user,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await triggerManualSync();
    setIsSyncing(false);
  };

  const getStatusDisplay = () => {
    if (isOffline || syncStatus === 'OFFLINE') {
      return {
        title: 'Working Offline',
        desc: 'Changes are safely stored on this device and will sync when internet reconnects.',
        icon: <WifiOff size={22} color="var(--status-warning)" />,
        badgeClass: 'badge-warning',
      };
    }
    if (syncStatus === 'SYNCING') {
      return {
        title: 'Synchronizing Cloud Data',
        desc: 'Sending local changes and fetching latest account updates from Supabase.',
        icon: <RefreshCw size={22} color="var(--accent-blue)" style={{ animation: 'spin 1.5s linear infinite' }} />,
        badgeClass: 'badge-blue',
      };
    }
    if (syncStatus === 'SYNC_FAILED') {
      return {
        title: 'Synchronization Issue',
        desc: lastSyncError || 'Unable to sync with Supabase cloud server. Tap Retry below.',
        icon: <AlertTriangle size={22} color="var(--status-danger)" />,
        badgeClass: 'badge-danger',
      };
    }
    if (pendingOpsCount > 0 || syncStatus === 'LOCAL_CHANGES') {
      return {
        title: 'Local Changes Pending',
        desc: `${pendingOpsCount} change${pendingOpsCount === 1 ? '' : 's'} waiting to upload to Supabase cloud.`,
        icon: <RefreshCw size={22} color="var(--accent-cyan)" />,
        badgeClass: 'badge-cyan',
      };
    }
    return {
      title: 'Cloud Data Synced',
      desc: 'All accounts, transactions, and categories are fully up to date on Supabase.',
      icon: <CloudCheck size={22} color="var(--accent-cyan)" />,
      badgeClass: 'badge-cyan',
    };
  };

  const statusInfo = getStatusDisplay();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Cloud Synchronization">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Status Header Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-solid-dark)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {statusInfo.icon}
          </div>
          <div>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {statusInfo.title}
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
              {statusInfo.desc}
            </p>
          </div>
        </div>

        {/* Metric Details List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(15, 21, 42, 0.6)',
            border: '1px solid var(--border-color)',
            fontSize: '0.84rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status</span>
            <span className={`badge ${statusInfo.badgeClass}`}>{syncStatus}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Last Sync</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {lastSyncTime || 'Just now'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Pending Changes</span>
            <span style={{ fontWeight: 700, color: pendingOpsCount > 0 ? 'var(--status-warning)' : 'var(--accent-cyan)' }}>
              {pendingOpsCount}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Connection</span>
            <span style={{ fontWeight: 600, color: isOffline ? 'var(--status-warning)' : 'var(--accent-emerald)' }}>
              {isOffline ? 'Offline' : 'Online'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Account</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
              {user?.email || 'Guest User'}
            </span>
          </div>
        </div>

        {/* Sync Now / Retry Action Button */}
        <button
          type="button"
          onClick={handleSyncClick}
          disabled={isSyncing || isOffline}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px 18px',
            minHeight: '44px',
            fontSize: '0.9rem',
            justifyContent: 'center',
          }}
        >
          <RefreshCw size={16} style={{ animation: isSyncing ? 'spin 1.5s linear infinite' : 'none' }} />
          <span>{isSyncing ? 'Syncing...' : syncStatus === 'SYNC_FAILED' ? 'Retry Sync' : 'Sync Now'}</span>
        </button>
      </div>
    </BottomSheet>
  );
};
