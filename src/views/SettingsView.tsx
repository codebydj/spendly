import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StorageEngine } from '../db/storage';
import type { BackupData } from '../types/finance';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Sparkles,
  LogOut,
  Bell,
  Moon,
  Info,
  CheckCircle2,
  User,
  Key,
  Code2,
  Volume2,
  VolumeX,
  CloudSync,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';

import { ChangePasswordModal } from '../components/forms/ChangePasswordModal';

export const SettingsView: React.FC = () => {
  const {
    user,
    userProfile,
    logout,
    settings,
    toggleHideBalances,
    setPinCode,
    importBackupData,
    resetLocalData,
    resetAllData,
    loadDemoData,
    isOffline,
    syncStatus,
    triggerManualSync,
    soundEnabled,
    toggleSoundEnabled,
    showToast,
    updateProfileName,
  } = useApp();

  const [pinInput, setPinInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'profile' | 'appearance' | 'notifications' | 'data' | 'security' | 'info'>('all');
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userEmail = userProfile?.email || user?.email || 'user@spendly.app';
  const existingName = userProfile?.fullName || user?.user_metadata?.full_name || userNameFromEmail(userEmail);
  const [fullNameInput, setFullNameInput] = useState(existingName);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  function userNameFromEmail(email: string) {
    return email.split('@')[0];
  }

  useEffect(() => {
    const currentName = userProfile?.fullName || user?.user_metadata?.full_name || userNameFromEmail(userEmail);
    if (currentName) {
      setFullNameInput(currentName);
    }
  }, [userProfile?.fullName, user?.user_metadata?.full_name, userEmail]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) return;
    setIsUpdatingProfile(true);
    await updateProfileName(fullNameInput.trim());
    setIsUpdatingProfile(false);
  };

  const handleManualSyncClick = async () => {
    setIsSyncingManual(true);
    await triggerManualSync();
    setIsSyncingManual(false);
  };

  // JSON Export Backup
  const handleExportJSON = () => {
    const backup = StorageEngine.exportFullBackup(user?.id);
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported full JSON backup', 'info');
  };

  // JSON Restore Import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed: BackupData = JSON.parse(evt.target?.result as string);
        if (importBackupData(parsed)) {
          showToast('Data restored successfully', 'success');
        }
      } catch {
        showToast('Invalid backup file format', 'danger');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Hidden File Input for Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Profile Card Header */}
      <div className="card-level-3 hero-emerald-glow" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-violet-subtle)',
                border: '2px solid var(--accent-violet-border)',
                color: 'var(--accent-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.3rem',
              }}
            >
              {(existingName || userEmail).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {existingName}
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>{userEmail}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-violet">Verified Account</span>
            <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Section Navigation Filter Pills */}
      <div className="desktop-only" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: 'All Settings' },
          { id: 'profile', label: 'Profile' },
          { id: 'appearance', label: 'Appearance' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'data', label: 'Data & Sync' },
          { id: 'security', label: 'Security' },
          { id: 'info', label: 'App Info' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="btn"
            style={{
              padding: '6px 14px',
              minHeight: '36px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: activeTab === tab.id ? 'var(--accent-violet)' : 'var(--bg-surface)',
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab.id ? 'transparent' : 'var(--border-color)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grouped Settings Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 0. PROFILE EDIT & PASSWORD CHANGE */}
        {(activeTab === 'all' || activeTab === 'profile') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={18} color="var(--accent-violet)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                User Profile & Credentials
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {/* Full Name Edit Form */}
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Display Name</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Update your account display name.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="Your Full Name"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Update Name'}
                  </button>
                </div>
              </form>

              {/* Change Password Modal Trigger */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={16} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Account Password</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Change your cloud authentication password.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                >
                  <Key size={15} color="var(--accent-cyan)" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Change Password Modal */}
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />

        {/* 1. APPEARANCE & AUDIO */}
        {(activeTab === 'all' || activeTab === 'appearance') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Moon size={18} color="var(--accent-violet)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Appearance & Audio Controls
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              {/* Mask Balances */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Hide Financial Balances</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Mask balances with ₹••••• across all screens.</p>
                </div>
                <button
                  onClick={toggleHideBalances}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                >
                  {settings.hideBalances ? <EyeOff size={15} color="var(--accent-cyan)" /> : <Eye size={15} />}
                  <span>{settings.hideBalances ? 'Masked' : 'Visible'}</span>
                </button>
              </div>

              {/* Transaction Sound Effects Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Transaction Sound Effects</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Synthesized digital chime on saving transactions & syncing.</p>
                </div>
                <button
                  onClick={toggleSoundEnabled}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                >
                  {soundEnabled ? <Volume2 size={15} color="var(--accent-cyan)" /> : <VolumeX size={15} color="var(--text-muted)" />}
                  <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
                </button>
              </div>

              {/* Currency Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Primary Currency</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Default financial symbol throughout the app.</p>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                  ₹ (INR)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. NOTIFICATIONS */}
        {(activeTab === 'all' || activeTab === 'notifications') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Notifications & Reminders
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              {/* Daily Expense Reminder */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Daily Expense Reminder</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Daily evening prompt ("Quick money check").</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="time"
                    defaultValue="20:00"
                    style={{ padding: '4px 8px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
                  />
                  <button
                    onClick={() => {
                      setNotificationsEnabled(!notificationsEnabled);
                      showToast(notificationsEnabled ? 'Daily reminder muted' : 'Daily reminder enabled', 'info');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                  >
                    {notificationsEnabled ? <CheckCircle2 size={15} color="var(--accent-cyan)" /> : <Bell size={15} />}
                    <span>{notificationsEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Budget & Recurring Alerts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Budget & Recurring Reminders</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Intelligent warnings at 75%, 90%, 100% and bill due alerts.</p>
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Active</span>
              </div>

              {/* Weekly & Monthly Summaries */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Weekly & Monthly Summaries</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Sunday 7 PM & End of month spending recap.</p>
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Active</span>
              </div>

              {/* Test Notification Button */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Test Android Notifications</span>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>Schedule a real test notification 1 minute from now.</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const { scheduleTestNotification } = await import('../services/nativeNotifications');
                    const ok = await scheduleTestNotification();
                    if (ok) {
                      showToast('Test notification scheduled for 1 minute from now!', 'success');
                    } else {
                      showToast('Spendly test reminder: Notifications active', 'info');
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                >
                  <Bell size={14} color="var(--accent-cyan)" />
                  <span>Test notification</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. DATA AND MANUAL SUPABASE SYNC */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Data & Cloud Synchronization
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              {/* Interactive Manual Sync Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CloudSync size={18} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Supabase Cloud Synchronization</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {isOffline
                      ? 'Working offline using IndexedDB storage.'
                      : `Sync status: ${syncStatus}. ${settings.lastSyncedAt ? 'Last synced: ' + new Date(settings.lastSyncedAt).toLocaleTimeString() : ''}`}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={handleManualSyncClick}
                    disabled={isSyncingManual || isOffline}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', minHeight: '40px', fontSize: '0.84rem' }}
                  >
                    <RefreshCw size={15} style={{ animation: isSyncingManual ? 'spin 1.5s linear infinite' : 'none' }} />
                    <span>{isSyncingManual ? 'Syncing...' : 'Sync now'}</span>
                  </button>
                </div>
              </div>

              {/* Backup & Import Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
                <button onClick={handleExportJSON} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                  <Download size={15} /> Export JSON Backup
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                  <Upload size={15} /> Restore Backup File
                </button>
                <button
                  onClick={() => {
                    if (confirm('Load sample data?\nThis will add demo accounts, transactions, budgets and example content to your current workspace.')) {
                      loadDemoData();
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                >
                  <Sparkles size={15} color="var(--accent-cyan)" /> Load Sample Data
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear local device dataset?\nYour local cached data will be cleared, but cloud data in Supabase will be preserved.')) {
                      resetLocalData();
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem', color: 'var(--status-warning)' }}
                >
                  <RefreshCw size={15} /> Reset Local Data
                </button>
                <button
                  onClick={() => {
                    if (confirm('DANGER: Permanently delete ALL financial records from cloud and local device?\nThis will clear your accounts, transactions, budgets, recurring bills, and notifications. This cannot be undone.')) {
                      resetAllData();
                    }
                  }}
                  className="btn btn-danger"
                  style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                >
                  <Trash2 size={15} /> Reset All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. SECURITY */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} color="var(--accent-violet)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Security & App Lock
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>4-Digit PIN Lock</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {settings.pinEnabled ? 'PIN lock active.' : 'Require PIN code to open Spendly.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    style={{ width: '90px', textAlign: 'center', letterSpacing: '0.2em', padding: '6px 8px', fontSize: '0.88rem' }}
                  />
                  <button
                    onClick={() => {
                      if (pinInput.length === 4) {
                        setPinCode(pinInput);
                        setPinInput('');
                      } else if (pinInput.length === 0) {
                        setPinCode('');
                      } else {
                        showToast('PIN must be 4 digits', 'warning');
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                  >
                    <Lock size={14} /> {settings.pinEnabled ? 'Update' : 'Set PIN'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. APP INFORMATION */}
        {/* 5. APP INFORMATION */}
        {(activeTab === 'all' || activeTab === 'info') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Application Information
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Application</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Spendly Personal Finance</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Version</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>3.0.0</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Build</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>3.0.0</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Web / Android</span>
              </div>

              {/* Accordion: Version History */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsVersionHistoryOpen(!isVersionHistoryOpen)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    padding: '6px 0',
                  }}
                >
                  <span>Version History</span>
                  {isVersionHistoryOpen ? <ChevronDown size={16} color="var(--accent-cyan)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                </button>

                {isVersionHistoryOpen && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: 'rgba(10, 14, 26, 0.6)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>V3.0.0 — Final V3 Refinement</div>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <li>Deep indigo & cyan visual identity with glassmorphism</li>
                        <li>Header top-right notification bell with unread count badge</li>
                        <li>Top-right modern compact toast popups</li>
                        <li>Enhanced Leaflet location place search (colleges, banks, hospitals, custom manual place add)</li>
                        <li>Clustered map pins, Map/List view toggle & location search</li>
                        <li>Auto-updating transaction date/time & custom Other category inputs</li>
                        <li>Persistent Supabase session authentication & Remember Me support</li>
                        <li>Native Capacitor Android push notifications integration</li>
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-lavender)' }}>V2.0.0 — Major UI and Architecture Update</div>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <li>Modern fintech interface with offline-first architecture</li>
                        <li>Supabase PostgreSQL persistence & hydration</li>
                        <li>Capacitor Android foundation</li>
                        <li>Improved dashboard, accounts & transaction tracking</li>
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>V1.0.0 — Initial Spendly Release</div>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <li>Authentication & profile setup</li>
                        <li>Accounts, transactions, budgets & basic analytics</li>
                        <li>PWA offline support</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Developer Attribution */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  marginTop: '6px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Developer
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    Dhanunjaya <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>@codebydj</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    © 2026 Dhanunjaya. All rights reserved.
                  </div>
                </div>

                <a
                  href="https://github.com/codebydj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                  }}
                >
                  <Code2 size={14} color="var(--accent-cyan)" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
