import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StorageEngine } from '../db/storage';
import type { BackupData, Category } from '../types/finance';
import { exportTransactionsCSV, exportJSONBackup } from '../utils/exportUtils';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  LogOut,
  Bell,
  Moon,
  Info,
  CheckCircle2,
  User,
  Key,
  Volume2,
  VolumeX,
  CloudSync,
  Trash2,
  Tag,
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  X,
  Check,
  GripVertical,
  History,
  ChevronRight,
  ArrowLeft,
  Search,
} from 'lucide-react';

const GithubIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

import { ChangePasswordModal } from '../components/forms/ChangePasswordModal';
import { Modal } from '../components/ui/Modal';
import { APP_VERSION, APP_BUILD_DATE, APP_NAME, APP_PACKAGE_ID, ANDROID_APK_DOWNLOAD_URL } from '../config/appVersion';
import { VERSION_HISTORY } from '../config/versionHistory';
import { PageTransition } from '../components/motion/PageTransition';

interface SearchResultItem {
  id: string;
  sectionId: string;
  sectionTitle: string;
  title: string;
  description: string;
  keywords: string[];
}

export const SettingsView: React.FC = () => {
  const {
    user,
    userProfile,
    logout,
    settings,
    categories,
    transactions,
    addCategory,
    editCategory,
    reorderCategories,
    deleteCategory,
    toggleHideBalances,
    toggleNotifyAppUpdates,
    setTimeFormat,
    installedVersion,
    lastCheckResult,
    isCheckingUpdates,
    checkAppUpdates,
    setPinCode,
    validatePin,
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

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Active Subpage / Section State
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // App Lock Modal State
  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [isRemovePinModalOpen, setIsRemovePinModalOpen] = useState(false);
  const [removePinInput, setRemovePinInput] = useState('');
  const [removePinError, setRemovePinError] = useState('');

  const [isForgotLockModalOpen, setIsForgotLockModalOpen] = useState(false);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userEmail = userProfile?.email || user?.email || 'user@spendly.app';
  const existingName = userProfile?.fullName || user?.user_metadata?.full_name || userNameFromEmail(userEmail);
  const [fullNameInput, setFullNameInput] = useState(existingName);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Category Management State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newCatColor, setNewCatColor] = useState('#5685FF');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

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

  // Reorder Categories
  const handleMoveCategory = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    reorderCategories(updated);
  };

  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      iconName: newCatType === 'INCOME' ? 'TrendingUp' : 'Tag',
    });
    setNewCatName('');
    setIsAddCategoryOpen(false);
  };

  const handleDeleteCategoryClick = (cat: Category) => {
    const affectedTxCount = transactions.filter((t) => t.categoryId === cat.id).length;
    if (affectedTxCount > 0) {
      const remainingCats = categories.filter((c) => c.id !== cat.id);
      if (remainingCats.length === 0) {
        showToast('Cannot delete the only category in your workspace.', 'warning');
        return;
      }
      setDeletingCat(cat);
      setReassignTargetId(remainingCats[0].id);
    } else {
      if (confirm(`Delete category "${cat.name}"?`)) {
        deleteCategory(cat.id);
      }
    }
  };

  const handleConfirmReassignAndDelete = () => {
    if (!deletingCat || !reassignTargetId) return;
    deleteCategory(deletingCat.id, reassignTargetId);
    showToast(`Reassigned transactions and deleted category "${deletingCat.name}"`, 'success');
    setDeletingCat(null);
    setReassignTargetId('');
  };

  const handleExportJSON = async () => {
    const backup = StorageEngine.exportFullBackup(user?.id);
    const result = await exportJSONBackup(backup);
    if (result.success) {
      showToast('Exported full JSON backup', 'info');
    } else {
      showToast(result.message || 'Failed to export JSON backup', 'warning');
    }
  };

  const handleExportCSV = async () => {
    const result = await exportTransactionsCSV(transactions, StorageEngine.loadAccounts(user?.id), categories);
    if (result.success) {
      showToast(`Exported ${result.count} transactions to CSV`, 'info');
    } else {
      showToast(result.message || 'No transactions to export', 'warning');
    }
  };

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

  interface SettingsGroupItem {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    isDanger?: boolean;
  }

  // Structured Information Architecture Groups (Req 20)
  const settingsGroups: Array<{ groupTitle: string; items: SettingsGroupItem[] }> = [
    {
      groupTitle: 'ACCOUNT',
      items: [
        {
          id: 'profile',
          title: 'Profile & Account',
          subtitle: `${existingName} • Verified`,
          icon: <User size={18} color="var(--accent-violet)" />,
        },
        {
          id: 'security',
          title: 'Security & App Lock',
          subtitle: settings.pinEnabled ? 'App Lock ON (PIN Passcode)' : 'App Lock Off',
          icon: <Shield size={18} color="var(--accent-violet)" />,
        },
      ],
    },
    {
      groupTitle: 'PERSONALIZATION',
      items: [
        {
          id: 'categories',
          title: 'Categories',
          subtitle: `${categories.length} expense & income categories`,
          icon: <Tag size={18} color="var(--accent-cyan)" />,
        },
        {
          id: 'appearance',
          title: 'Appearance & Audio',
          subtitle: `${settings.hideBalances ? 'Balances Masked' : 'Balances Visible'} • ${soundEnabled ? 'Sound On' : 'Muted'}`,
          icon: <Moon size={18} color="var(--accent-blue)" />,
        },
      ],
    },
    {
      groupTitle: 'NOTIFICATIONS',
      items: [
        {
          id: 'notifications',
          title: 'Notifications & Reminders',
          subtitle: notificationsEnabled ? 'Daily Prompts & Alerts ON' : 'Notifications Muted',
          icon: <Bell size={18} color="var(--accent-violet)" />,
        },
      ],
    },
    {
      groupTitle: 'DATA',
      items: [
        {
          id: 'data',
          title: 'Data & Cloud Sync',
          subtitle: isOffline ? 'Working Offline' : syncStatus === 'SYNCED' ? 'Synced with Supabase' : syncStatus,
          icon: <CloudSync size={18} color="var(--accent-cyan)" />,
        },
      ],
    },
    {
      groupTitle: 'APP',
      items: [
        {
          id: 'download',
          title: 'Download & Updates',
          subtitle: `Spendly V${APP_VERSION} APK`,
          icon: <Download size={18} color="var(--accent-cyan)" />,
        },
        {
          id: 'info',
          title: 'App Information',
          subtitle: `V${installedVersion || APP_VERSION} (${APP_BUILD_DATE})`,
          icon: <Info size={18} color="var(--accent-blue)" />,
        },
        {
          id: 'history',
          title: 'Version History',
          subtitle: `${VERSION_HISTORY.length} release notes`,
          icon: <History size={18} color="var(--accent-violet)" />,
        },
      ],
    },
    {
      groupTitle: 'ADVANCED',
      items: [
        {
          id: 'danger',
          title: 'Danger Zone',
          subtitle: 'Reset local data or wipe workspace',
          icon: <Trash2 size={18} color="var(--status-expense)" />,
          isDanger: true,
        },
      ],
    },
  ];

  // Deep Search Index (Reqs 24, 25, 26, 27)
  const searchIndex: SearchResultItem[] = [
    { id: 'profile-name', sectionId: 'profile', sectionTitle: 'Profile & Account', title: 'Display Name', description: 'Change display name and user profile', keywords: ['display name', 'name', 'profile', 'full name', 'account'] },
    { id: 'profile-password', sectionId: 'profile', sectionTitle: 'Profile & Account', title: 'Change Password', description: 'Update cloud authentication password', keywords: ['password', 'change password', 'credentials', 'login password'] },
    { id: 'security-pin', sectionId: 'security', sectionTitle: 'Security & App Lock', title: '4-Digit PIN Passcode', description: 'Enable or disable 4-digit app lock passcode', keywords: ['pin', 'passcode', 'app lock', 'lock', 'security', 'forgot pin'] },
    { id: 'categories-manage', sectionId: 'categories', sectionTitle: 'Categories', title: 'Category Management', description: 'Add, edit, reorder expense and income categories', keywords: ['category', 'categories', 'expense category', 'income category', 'custom category', 'reorder'] },
    { id: 'appearance-hide', sectionId: 'appearance', sectionTitle: 'Appearance & Audio', title: 'Hide Balances', description: 'Mask account balances with ₹•••••', keywords: ['balance', 'hide balance', 'privacy', 'mask'] },
    { id: 'appearance-sound', sectionId: 'appearance', sectionTitle: 'Appearance & Audio', title: 'Sound Effects', description: 'Transaction and sync chime sounds', keywords: ['sound', 'audio', 'chime', 'mute'] },
    { id: 'appearance-currency', sectionId: 'appearance', sectionTitle: 'Appearance & Audio', title: 'Currency', description: 'Default currency symbol (INR ₹)', keywords: ['currency', 'inr', 'rupee', 'symbol'] },
    { id: 'appearance-time', sectionId: 'appearance', sectionTitle: 'Appearance & Audio', title: 'Time Display Format', description: 'Toggle 12-hour (AM/PM) or 24-hour clock', keywords: ['time', 'time format', '12hr', '24hr', 'clock'] },
    { id: 'notif-daily', sectionId: 'notifications', sectionTitle: 'Notifications & Reminders', title: 'Daily Expense Reminder', description: 'Daily evening prompt to add expenses', keywords: ['reminder', 'daily reminder', 'expense reminder', 'prompt time', 'daily prompt'] },
    { id: 'notif-update', sectionId: 'notifications', sectionTitle: 'Notifications & Reminders', title: 'App Update Notifications', description: 'Notify when a new Spendly release is ready', keywords: ['update notification', 'update alert', 'app update'] },
    { id: 'notif-test', sectionId: 'notifications', sectionTitle: 'Notifications & Reminders', title: 'Test Android Notification', description: 'Send a scheduled test notification', keywords: ['test notification', 'test alert'] },
    { id: 'data-sync', sectionId: 'data', sectionTitle: 'Data & Cloud Sync', title: 'Supabase Cloud Sync', description: 'Manual cloud sync and status', keywords: ['sync', 'cloud', 'supabase', 'manual sync', 'offline'] },
    { id: 'data-backup', sectionId: 'data', sectionTitle: 'Data & Cloud Sync', title: 'Export & Restore Backup', description: 'CSV export, JSON backup, and restore file', keywords: ['backup', 'export csv', 'export json', 'restore', 'download backup'] },
    { id: 'data-demo', sectionId: 'data', sectionTitle: 'Data & Cloud Sync', title: 'Load Sample Data', description: 'Load demo transactions and accounts', keywords: ['sample data', 'demo', 'demo data'] },
    { id: 'download-apk', sectionId: 'download', sectionTitle: 'Download & Updates', title: 'Download Android APK', description: 'Direct APK download link', keywords: ['download', 'apk', 'install', 'android apk'] },
    { id: 'info-diagnostic', sectionId: 'info', sectionTitle: 'App Information', title: 'System Diagnostics & Updates', description: 'Version, build date, and update checker', keywords: ['version', 'build', 'diagnostics', 'package id', 'check updates'] },
    { id: 'history-list', sectionId: 'history', sectionTitle: 'Version History', title: 'Release History', description: 'View full changelog and past release notes', keywords: ['changelog', 'history', 'version history', 'releases'] },
    { id: 'danger-reset', sectionId: 'danger', sectionTitle: 'Danger Zone', title: 'Reset Local & Cloud Data', description: 'Clear local cache or wipe workspace', keywords: ['reset', 'delete', 'clear cache', 'danger', 'wipe'] },
  ];

  const searchResults = searchQuery.trim().length > 0
    ? searchIndex.filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.sectionTitle.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSelectSearchResult = (result: SearchResultItem) => {
    setActiveSectionId(result.sectionId);
    setSearchQuery('');
  };

  const getSectionTitle = (id: string) => {
    for (const g of settingsGroups) {
      const match = g.items.find((item) => item.id === id);
      if (match) return match.title;
    }
    return 'Settings';
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px', margin: '0 auto' }}>
        {/* Hidden File Input for Restore */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json"
          style={{ display: 'none' }}
        />

        {/* Top Search Input (Reqs 24, 28) */}
        <div className="card-level-2" style={{ padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} color="var(--accent-cyan)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings (password, currency, PIN, backup, sync, categories)..."
              aria-label="Search settings"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                padding: '6px 0',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                boxShadow: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn-icon"
                title="Clear search"
                aria-label="Clear search"
                style={{ padding: '4px' }}
              >
                <X size={18} color="var(--text-muted)" />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH RESULTS VIEW (Reqs 26, 27, 28) */}
        {searchQuery.trim().length > 0 ? (
          <div className="card-level-2" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              SEARCH RESULTS ({searchResults.length})
            </span>

            {searchResults.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No settings found matching "{searchQuery}". Try "PIN", "Backup", "Password", "Currency", or "Sync".
              </div>
            ) : (
              searchResults.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-solid-dark)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 700, display: 'block' }}>
                      {res.sectionTitle}
                    </span>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {res.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {res.description}
                    </p>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </button>
              ))
            )}
          </div>
        ) : activeSectionId ? (
          /* SUBPAGE DETAILED PANEL VIEW (Req 23) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Subpage Navigation Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setActiveSectionId(null)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back to Settings
              </button>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {getSectionTitle(activeSectionId)}
              </h2>
            </div>

            <div className="card-level-2" style={{ padding: '20px' }}>
              {/* 1. USER PROFILE & CREDENTIALS */}
              {activeSectionId === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Display Name</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Update your profile display name in Spendly.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '380px' }}>
                      <input
                        type="text"
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        placeholder="Your Full Name"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.88rem' }}
                      />
                      <button type="submit" disabled={isUpdatingProfile} className="btn btn-primary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                        {isUpdatingProfile ? 'Saving...' : 'Update Name'}
                      </button>
                    </div>
                  </form>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Key size={16} color="var(--accent-cyan)" />
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Account Password</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Change your cloud authentication password.</p>
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
              )}

              {/* 2. SECURITY & APP LOCK */}
              {activeSectionId === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>4-Digit Passcode</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {settings.pinEnabled
                          ? 'App lock is active. Require 4-digit PIN upon app open.'
                          : 'Require a 4-digit PIN code to unlock Spendly on this device.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {!settings.pinEnabled ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNewPinInput('');
                            setConfirmPinInput('');
                            setPinError('');
                            setIsSetPinModalOpen(true);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                        >
                          <Lock size={15} /> Add App Lock
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRemovePinInput('');
                              setRemovePinError('');
                              setIsRemovePinModalOpen(true);
                            }}
                            className="btn btn-danger"
                            style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                          >
                            <Lock size={15} /> Remove App Lock
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsForgotLockModalOpen(true)}
                            className="btn btn-secondary"
                            style={{ padding: '8px 14px', minHeight: '38px', fontSize: '0.84rem' }}
                          >
                            <Key size={15} color="var(--accent-cyan)" /> Forgot PIN
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. CATEGORIES */}
              {activeSectionId === 'categories' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {categories.length} categories ({categories.filter((c) => c.type === 'EXPENSE').length} expense, {categories.filter((c) => c.type === 'INCOME').length} income)
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setIsEditingCategories(!isEditingCategories)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                      >
                        <Pencil size={14} color="var(--accent-cyan)" />
                        <span>{isEditingCategories ? 'Done' : 'Edit Categories'}</span>
                      </button>
                      {isEditingCategories && (
                        <button
                          type="button"
                          onClick={() => setIsAddCategoryOpen(true)}
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                        >
                          <Plus size={14} /> Add Category
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {categories.map((cat, idx) => {
                      const txCount = transactions.filter((t) => t.categoryId === cat.id).length;
                      const isEditing = editingCatId === cat.id;

                      return (
                        <div
                          key={cat.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            backgroundColor: 'var(--bg-solid-dark)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            {isEditingCategories && (
                              <span style={{ cursor: 'grab', color: 'var(--text-muted)' }} title="Drag handle">
                                <GripVertical size={16} />
                              </span>
                            )}

                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: cat.color || 'var(--accent-cyan)',
                                flexShrink: 0,
                              }}
                            />

                            {isEditing ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <input
                                  type="text"
                                  value={editingCatName}
                                  onChange={(e) => setEditingCatName(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: '0.86rem', flex: 1 }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingCatName.trim()) {
                                      editCategory(cat.id, editingCatName.trim());
                                    }
                                    setEditingCatId(null);
                                  }}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 10px', fontSize: '0.76rem', minHeight: '30px' }}
                                >
                                  <Check size={14} /> Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCatId(null)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.76rem', minHeight: '30px' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{cat.name}</span>
                                  <span className={cat.type === 'INCOME' ? 'badge badge-cyan' : 'badge badge-neutral'} style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                                    {cat.type}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {txCount} transaction{txCount === 1 ? '' : 's'}
                                </span>
                              </div>
                            )}
                          </div>

                          {isEditingCategories && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleMoveCategory(idx, 'UP')}
                                disabled={idx === 0}
                                className="btn-icon"
                                title="Move Up"
                                style={{ padding: '4px', opacity: idx === 0 ? 0.3 : 1 }}
                              >
                                <ArrowUp size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCategory(idx, 'DOWN')}
                                disabled={idx === categories.length - 1}
                                className="btn-icon"
                                title="Move Down"
                                style={{ padding: '4px', opacity: idx === categories.length - 1 ? 0.3 : 1 }}
                              >
                                <ArrowDown size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditingCatName(cat.name);
                                }}
                                className="btn-icon"
                                title="Rename Category"
                                style={{ padding: '4px', color: 'var(--text-secondary)' }}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategoryClick(cat)}
                                className="btn-icon"
                                title="Delete Category"
                                style={{ padding: '4px', color: 'var(--status-danger)' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. APPEARANCE & AUDIO */}
              {activeSectionId === 'appearance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hide Balances</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Mask monetary balances with ₹••••• across all screens.</p>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Sound Effects</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Digital chime on saving transactions & syncing.</p>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Primary Currency</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Default financial symbol throughout the app.</p>
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                      ₹ (INR)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Time Display Format</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Transaction timestamps in 12-hour (AM/PM) or 24-hour clock.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-main)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => setTimeFormat('12')}
                        className={`btn ${settings.timeFormat === '12' || !settings.timeFormat ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 12px', fontSize: '0.78rem', minHeight: '32px' }}
                      >
                        12hr (AM/PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeFormat('24')}
                        className={`btn ${settings.timeFormat === '24' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 12px', fontSize: '0.78rem', minHeight: '32px' }}
                      >
                        24hr
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. NOTIFICATIONS & REMINDERS */}
              {activeSectionId === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Expense Reminder</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Daily evening prompt ("Quick money check").</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="time"
                        defaultValue="20:00"
                        aria-label="Daily reminder time"
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>App Update Notifications</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Notify me when a new Spendly release is available.</p>
                    </div>
                    <button
                      onClick={toggleNotifyAppUpdates}
                      className="btn btn-secondary"
                      style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                    >
                      {settings.notifyAppUpdates ?? true ? <CheckCircle2 size={15} color="var(--accent-cyan)" /> : <Bell size={15} />}
                      <span>{settings.notifyAppUpdates ?? true ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Budget & Financial Alerts</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Warnings at 75%, 90%, 100% budget thresholds & bill due dates.</p>
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Active</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Test Android Notifications</span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Schedule a test notification 1 minute from now.</p>
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
              )}

              {/* 6. DATA & CLOUD SYNC */}
              {activeSectionId === 'data' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '14px', backgroundColor: 'var(--bg-solid-dark)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
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

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
                    <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                      <Download size={15} color="var(--accent-cyan)" /> Export CSV
                    </button>
                    <button onClick={handleExportJSON} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                      <Download size={15} /> Export JSON Backup
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}>
                      <Upload size={15} /> Restore Backup File
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Load sample data?\nThis will add demo accounts, transactions, and budgets to your workspace.')) {
                          loadDemoData();
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                    >
                      <Sparkles size={15} color="var(--accent-cyan)" /> Load Sample Data
                    </button>
                  </div>
                </div>
              )}

              {/* 7. DOWNLOAD & UPDATES */}
              {activeSectionId === 'download' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Spendly for Android</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Latest Version: <strong style={{ color: 'var(--accent-cyan)' }}>V{APP_VERSION}</strong> • Build Date: <strong style={{ color: 'var(--text-primary)' }}>{APP_BUILD_DATE}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.open(ANDROID_APK_DOWNLOAD_URL, '_blank')}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', minHeight: '42px', fontSize: '0.86rem' }}
                  >
                    <Download size={16} /> Download APK
                  </button>
                </div>
              )}

              {/* 8. APP INFORMATION */}
              {activeSectionId === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Application</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{APP_NAME}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Installed Version</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>V{installedVersion || APP_VERSION}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Build Date</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{APP_BUILD_DATE}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Package ID</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{APP_PACKAGE_ID}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsDiagnosticModalOpen(true)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <Info size={14} color="var(--accent-violet)" /> Diagnostic Info
                    </button>
                    <button
                      type="button"
                      disabled={isCheckingUpdates}
                      onClick={() => checkAppUpdates(true)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      <Sparkles size={14} color="var(--accent-cyan)" /> {isCheckingUpdates ? 'Checking...' : 'Check for Updates'}
                    </button>
                  </div>
                </div>
              )}

              {/* 9. VERSION HISTORY */}
              {activeSectionId === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '460px', overflowY: 'auto' }}>
                  {VERSION_HISTORY.map((item) => (
                    <div
                      key={item.version}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        backgroundColor: item.isCurrent ? 'rgba(32, 196, 232, 0.08)' : 'transparent',
                        padding: item.isCurrent ? '12px 14px' : '0',
                        borderRadius: item.isCurrent ? 'var(--radius-md)' : '0',
                        border: item.isCurrent ? '1px solid var(--accent-cyan-border)' : 'none',
                        borderTop: !item.isCurrent ? '1px solid var(--border-color)' : undefined,
                        paddingTop: !item.isCurrent ? '12px' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: item.isCurrent ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                          {item.version}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.date}</span>
                      </div>
                      <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {item.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* 10. DANGER ZONE */}
              {activeSectionId === 'danger' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (confirm('Clear local device dataset? Cloud data in Supabase will be preserved.')) {
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
                      if (confirm('DANGER: Permanently delete ALL financial records from cloud and local device? This cannot be undone.')) {
                        resetAllData();
                      }
                    }}
                    className="btn btn-danger"
                    style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
                  >
                    <Trash2 size={15} /> Reset All Workspace Data
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* NATIVE MOBILE-FIRST SETTINGS LANDING VIEW (Reqs 20, 21, 22) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* User Profile Header Summary Card */}
            <div className="card-level-3 hero-blue-glow" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-violet-subtle)',
                      border: '2px solid var(--accent-violet-border)',
                      color: 'var(--accent-lavender)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      flexShrink: 0,
                    }}
                  >
                    {(existingName || userEmail).slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {existingName}
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', overflowWrap: 'anywhere' }}>{userEmail}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-violet">Verified</span>
                  <button onClick={logout} className="btn btn-danger" style={{ padding: '7px 14px', minHeight: '36px', fontSize: '0.82rem' }}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Categorized Settings List (Reqs 20, 21, 22) */}
            {settingsGroups.map((group) => (
              <div key={group.groupTitle} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em', paddingLeft: '4px' }}>
                  {group.groupTitle}
                </div>

                <div className="card-level-2" style={{ padding: '0', overflow: 'hidden' }}>
                  {group.items.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSectionId(item.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="card-interactive"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: item.isDanger ? 'var(--status-danger-subtle)' : 'var(--bg-solid-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: item.isDanger ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                            {item.title}
                          </h3>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                        <ChevronRight size={18} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* DEVELOPER FOOTER */}
            <a
              href="https://github.com/codebydj"
              target="_blank"
              rel="noopener noreferrer"
              className="card-level-2"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
              }}
            >
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Developer: <strong style={{ color: 'var(--text-primary)' }}>Dhanunjaya</strong></span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', border: "1px solid #3b82f6", borderRadius: "14px", padding: "3px 8px", gap: '6px' }}>
                  <GithubIcon size={15} color="var(--accent-cyan)" /> codebydj
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                © 2026 Spendly. All rights reserved.
              </span>
            </a>
          </div>
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />

        {/* Modal 1: Add Category */}
        <Modal
          isOpen={isAddCategoryOpen}
          onClose={() => setIsAddCategoryOpen(false)}
          title="Add New Category"
          subtitle="Create a custom category for organizing your expenses or income."
        >
          <form onSubmit={handleCreateCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Subscriptions, Groceries, Tuition"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ width: '100%' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Type
                </label>
                <select value={newCatType} onChange={(e) => setNewCatType(e.target.value as any)} style={{ width: '100%' }}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Color Accent
                </label>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '4px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Category
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 2: Reassign Category Transactions */}
        <Modal
          isOpen={Boolean(deletingCat)}
          onClose={() => setDeletingCat(null)}
          title={`Reassign Transactions for "${deletingCat?.name}"`}
          subtitle="Choose a target category to reassign existing transactions before deletion."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Reassign Transactions To:
              </label>
              <select
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                style={{ width: '100%' }}
              >
                {categories
                  .filter((c) => c.id !== deletingCat?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={() => setDeletingCat(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmReassignAndDelete} className="btn btn-danger">
                Reassign & Delete
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal 3: Set PIN Passcode */}
        <Modal
          isOpen={isSetPinModalOpen}
          onClose={() => setIsSetPinModalOpen(false)}
          title="Set 4-Digit Passcode"
          subtitle="Require a 4-digit PIN code to unlock Spendly whenever the application is opened."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
                setPinError('Passcode must be exactly 4 digits.');
                return;
              }
              if (newPinInput !== confirmPinInput) {
                setPinError('Passcodes do not match.');
                return;
              }
              setPinCode(newPinInput);
              showToast('App Lock enabled successfully!', 'success');
              setIsSetPinModalOpen(false);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {pinError && (
              <div style={{ color: 'var(--status-danger)', fontSize: '0.84rem', backgroundColor: 'var(--status-danger-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                {pinError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Enter 4-Digit Passcode
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', fontSize: '1.2rem', letterSpacing: '0.4em', textAlign: 'center' }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Confirm 4-Digit Passcode
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', fontSize: '1.2rem', letterSpacing: '0.4em', textAlign: 'center' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsSetPinModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Enable App Lock
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 4: Remove PIN Passcode */}
        <Modal
          isOpen={isRemovePinModalOpen}
          onClose={() => setIsRemovePinModalOpen(false)}
          title="Remove App Lock Passcode"
          subtitle="Enter your current 4-digit PIN code to disable App Lock."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!validatePin(removePinInput)) {
                setRemovePinError('Incorrect 4-digit passcode.');
                return;
              }
              setPinCode('');
              showToast('App Lock disabled.', 'info');
              setIsRemovePinModalOpen(false);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {removePinError && (
              <div style={{ color: 'var(--status-danger)', fontSize: '0.84rem', backgroundColor: 'var(--status-danger-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                {removePinError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Enter Current 4-Digit Passcode
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={removePinInput}
                onChange={(e) => setRemovePinInput(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', fontSize: '1.2rem', letterSpacing: '0.4em', textAlign: 'center' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsRemovePinModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-danger">
                Remove Passcode
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 5: Forgot Lock PIN Help */}
        <Modal
          isOpen={isForgotLockModalOpen}
          onClose={() => setIsForgotLockModalOpen(false)}
          title="Forgot App Lock PIN?"
          subtitle="Signing out will authenticate you via email/password and reset the local device PIN lock."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Signing out will reset the device passcode without deleting your cloud-synchronized transaction records.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsForgotLockModalOpen(false)} className="btn btn-secondary">
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsForgotLockModalOpen(false);
                  setPinCode('');
                  logout();
                }}
                className="btn btn-danger"
              >
                Sign Out & Reset Lock
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal 6: System Diagnostic Modal */}
        <Modal
          isOpen={isDiagnosticModalOpen}
          onClose={() => setIsDiagnosticModalOpen(false)}
          title="System Diagnostic Info"
          subtitle="Runtime state and network connectivity diagnostic details."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Online State:</span>
              <span style={{ color: isOffline ? 'var(--status-warning)' : 'var(--accent-cyan)', fontWeight: 700 }}>
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sync Status:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{syncStatus}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Check HTTP Status:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{lastCheckResult?.httpStatus ?? 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Categories:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{categories.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Transactions:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{transactions.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button onClick={() => setIsDiagnosticModalOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};
