import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StorageEngine } from '../db/storage';
import type { BackupData } from '../types/finance';
import { GlassCard } from '../components/ui/GlassCard';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
  Sparkles,
  LogOut,
  Bell,
  Moon,
  Info,
  CheckCircle2,
  User,
  Key,
  Code2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    user,
    logout,
    settings,
    toggleHideBalances,
    setPinCode,
    importBackupData,
    resetAllData,
    loadDemoData,
    isOffline,
    syncStatus,
    showToast,
    updateProfileName,
    updateUserPassword,
  } = useApp();

  const [pinInput, setPinInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'profile' | 'appearance' | 'notifications' | 'data' | 'security' | 'info'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userEmail = user?.email || 'user@spendly.app';
  const existingName = user?.user_metadata?.full_name || userNameFromEmail(userEmail);
  const [fullNameInput, setFullNameInput] = useState(existingName);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  function userNameFromEmail(email: string) {
    return email.split('@')[0];
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) return;
    setIsUpdatingProfile(true);
    await updateProfileName(fullNameInput.trim());
    setIsUpdatingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      showToast('Passwords do not match', 'danger');
      return;
    }
    setIsChangingPassword(true);
    const success = await updateUserPassword(newPasswordInput);
    setIsChangingPassword(false);
    if (success) {
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    }
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
      <GlassCard elevated style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-emerald-subtle)',
                border: '2px solid var(--accent-emerald-border)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
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
            <span className="badge badge-emerald">Verified Account</span>
            <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </GlassCard>

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
              backgroundColor: activeTab === tab.id ? 'var(--accent-emerald)' : 'var(--bg-surface)',
              color: activeTab === tab.id ? '#042f2e' : 'var(--text-secondary)',
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
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={18} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                User Profile & Credentials
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {/* Full Name Edit Form */}
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Full Name</span>
                <div style={{ display: 'flex', gap: '10px', maxWidth: '500px' }}>
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

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={16} color="var(--accent-blue)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Change Account Password</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
                  <input
                    type="password"
                    className="input-field"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="New Password (min 6 characters)"
                    style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                  <input
                    type="password"
                    className="input-field"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirm New Password"
                    style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                  <div>
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                    >
                      {isChangingPassword ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </GlassCard>
        )}

        {/* 1. APPEARANCE & PRIVACY */}
        {(activeTab === 'all' || activeTab === 'appearance') && (
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Moon size={18} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Appearance & Privacy
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
                  {settings.hideBalances ? <EyeOff size={15} color="var(--accent-emerald)" /> : <Eye size={15} />}
                  <span>{settings.hideBalances ? 'Masked' : 'Visible'}</span>
                </button>
              </div>

              {/* Currency Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Primary Currency</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Default financial symbol throughout the app.</p>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                  ₹ (INR)
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        {/* 2. NOTIFICATIONS */}
        {(activeTab === 'all' || activeTab === 'notifications') && (
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Notifications & Reminders
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Push & Budget Alerts</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Receive notifications for budget warnings & recurring bills.</p>
                </div>
                <button
                  onClick={() => {
                    setNotificationsEnabled(!notificationsEnabled);
                    showToast(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled', 'info');
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                >
                  {notificationsEnabled ? <CheckCircle2 size={15} color="var(--accent-emerald)" /> : <Bell size={15} />}
                  <span>{notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* 3. DATA AND SYNC */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone size={18} color="var(--status-warning)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Data & Storage
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              {/* Sync Status Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cloud Sync & Offline State</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {isOffline ? 'Working offline using IndexedDB local storage.' : `Sync status: ${syncStatus}`}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                  {isOffline ? <WifiOff size={15} color="var(--status-warning)" /> : <Wifi size={15} color="var(--accent-emerald)" />}
                  <span style={{ color: isOffline ? 'var(--status-warning)' : 'var(--accent-emerald)' }}>
                    {isOffline ? 'Offline' : 'Synchronized'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
                <button onClick={handleExportJSON} className="btn btn-primary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                  <Download size={15} /> Export JSON Backup
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                  <Upload size={15} /> Restore Backup File
                </button>
                <button onClick={loadDemoData} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                  <Sparkles size={15} color="var(--accent-emerald)" /> Load Sample Data
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your local dataset? Cloud data is preserved.')) {
                      resetAllData();
                    }
                  }}
                  className="btn btn-danger"
                  style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                >
                  <RefreshCw size={15} /> Reset Local Data
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* 4. SECURITY */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} color="var(--accent-emerald)" />
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
          </GlassCard>
        )}

        {/* 5. APP INFORMATION */}
        {(activeTab === 'all' || activeTab === 'info') && (
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={18} color="var(--text-muted)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Application Information
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>App Version</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1.0.1 (Build 2026.09)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Architecture</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Local-First PWA + Supabase Cloud Sync</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Storage Engine</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>IndexedDB + Supabase PostgreSQL</span>
              </div>

              {/* Developer Attribution */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code2 size={16} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Developer Attribution</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Developed by <strong style={{ color: 'var(--text-primary)' }}>Dhanunjaya</strong>
                </p>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  GitHub: <a href="https://github.com/codebydj" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-emerald)', textDecoration: 'none', fontWeight: 600 }}>github.com/codebydj</a>
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  © 2026 Dhanunjaya. All rights reserved.
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

