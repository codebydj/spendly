import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StorageEngine } from '../db/storage';
import type { BackupData, Category } from '../types/finance';
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
  AlertTriangle,
  GripVertical,
  History,
  ChevronDown,
  ChevronUp,
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
    isCheckingUpdates,
    checkAppUpdates,
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
  const [activeTab, setActiveTab] = useState<'all' | 'profile' | 'categories' | 'appearance' | 'notifications' | 'data' | 'security' | 'info'>('all');
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userEmail = userProfile?.email || user?.email || 'user@spendly.app';
  const existingName = userProfile?.fullName || user?.user_metadata?.full_name || userNameFromEmail(userEmail);
  const [fullNameInput, setFullNameInput] = useState(existingName);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Category Management State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newCatColor, setNewCatColor] = useState('#8B5CF6');
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

  // Reorder Categories Up/Down
  const handleMoveCategory = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    reorderCategories(updated);
  };

  // Add Category Handler
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

  // Category Delete Request with Safety Protection
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

  // Confirm Category Deletion & Reassign Existing Transactions
  const handleConfirmReassignAndDelete = () => {
    if (!deletingCat || !reassignTargetId) return;
    deleteCategory(deletingCat.id, reassignTargetId);
    showToast(`Reassigned transactions and deleted category "${deletingCat.name}"`, 'success');
    setDeletingCat(null);
    setReassignTargetId('');
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
          { id: 'categories', label: 'Categories' },
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

        {/* Change Password Modal */}
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />

        {/* 1. CATEGORY MANAGEMENT SECTION */}
        {(activeTab === 'all' || activeTab === 'categories') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Tag size={18} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                    Category Management
                  </h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {categories.length} categories configured ({categories.filter((c) => c.type === 'EXPENSE').length} expense, {categories.filter((c) => c.type === 'INCOME').length} income)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingCategories(!isEditingCategories)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.82rem' }}
                >
                  <Pencil size={14} color="var(--accent-cyan)" />
                  <span>{isEditingCategories ? 'Done' : 'Edit'}</span>
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

            {isEditingCategories && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
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
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }} title="Drag handle">
                          <GripVertical size={16} />
                        </span>

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
                              <span className={cat.type === 'INCOME' ? 'badge badge-emerald' : 'badge badge-neutral'} style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                                {cat.type}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {txCount} transaction{txCount === 1 ? '' : 's'} assigned
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Reorder & Actions */}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. APPEARANCE & AUDIO */}
        {(activeTab === 'all' || activeTab === 'appearance') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Moon size={18} color="var(--accent-violet)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Appearance & Audio Controls
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
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

        {/* 3. NOTIFICATIONS */}
        {(activeTab === 'all' || activeTab === 'notifications') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Notifications & Reminders
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>App Update Notifications</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Notify me when a new Spendly app version is available.</p>
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
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Budget & Bill Alerts</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Intelligent warnings at 75%, 90%, 100% and bill due alerts.</p>
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Active</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Test Android Notifications</span>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>Schedule a test notification 1 minute from now.</p>
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

        {/* 4. DATA AND MANUAL SUPABASE SYNC */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Data & Cloud Synchronization
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
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

        {/* 5. SECURITY */}
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

        {/* 6. DOWNLOAD APPLICATION SECTION */}
        {(activeTab === 'all' || activeTab === 'data' || activeTab === 'info') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={18} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Download Application
              </h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Spendly for Android</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Latest Version: <strong style={{ color: 'var(--accent-cyan)' }}>V{APP_VERSION}</strong> • Build Date: <strong style={{ color: 'var(--text-primary)' }}>{APP_BUILD_DATE}</strong>
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>✓ Direct APK download</span>
                  <span>✓ No Play Store required</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.open(ANDROID_APK_DOWNLOAD_URL, '_blank');
                }}
                className="btn btn-primary"
                style={{ padding: '10px 20px', minHeight: '42px', fontSize: '0.86rem' }}
              >
                <Download size={16} /> Download APK
              </button>
            </div>
          </div>
        )}

        {/* 7. APP INFORMATION */}
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
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{APP_NAME}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Version</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>V{APP_VERSION}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Build Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{APP_BUILD_DATE}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Web + Android</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Package ID</span>
                <span style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{APP_PACKAGE_ID}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={isCheckingUpdates}
                  onClick={() => {
                    checkAppUpdates(true);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.82rem', opacity: isCheckingUpdates ? 0.7 : 1 }}
                >
                  <Sparkles size={14} color="var(--accent-cyan)" className={isCheckingUpdates ? 'spin' : ''} />
                  <span>{isCheckingUpdates ? 'Checking for updates...' : 'Check for Updates'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. VERSION HISTORY */}
        {(activeTab === 'all' || activeTab === 'info') && (
          <div className="card-level-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div
              onClick={() => setIsVersionHistoryOpen(!isVersionHistoryOpen)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <History size={18} color="var(--accent-violet)" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                    Version History
                  </h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Track the major improvements and updates made to Spendly.
                </p>
              </div>
              <button className="btn-icon" style={{ padding: '4px' }}>
                {isVersionHistoryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {isVersionHistoryOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
                {/* V3.1.2 - CURRENT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'rgba(34, 211, 238, 0.08)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-cyan-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>V3.1.2</span>
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, backgroundColor: 'var(--accent-cyan)', color: '#000000', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                        CURRENT
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>15 September 2026</span>
                  </div>
                  <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>Automatic Sync and Update Experience</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Automatic bidirectional Supabase synchronization</li>
                    <li>Realtime cloud updates across Web and Android</li>
                    <li>Improved offline-to-online synchronization</li>
                    <li>Correct centralized application versioning (V3.1.2)</li>
                    <li>Improved update notification popup with postpone delay</li>
                    <li>Subtle floating Spendly logo loading animation</li>
                  </ul>
                </div>

                {/* V3.1.1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.1.1</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>15 September 2026</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sync and Stability Update</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Cloud persistence fixes and parallel IndexedDB hydration</li>
                    <li>Supabase synchronization improvements</li>
                    <li>Android and Web reliability improvements</li>
                  </ul>
                </div>

                {/* V3.1.0 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.1.0</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>15 September 2026</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Data and Reliability Update</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Offline persistence improvements & IndexedDB storage</li>
                    <li>Pending sync queue and cloud reconciliation</li>
                    <li>App update notification system</li>
                  </ul>
                </div>

                {/* V3.0.0 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.0</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>14 September 2026</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Final V3 Release</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>New indigo/violet/blue/cyan visual identity</li>
                    <li>Refined glassmorphic UI, Analytics, Calendar & Maps</li>
                    <li>Online place search, map pickers, and bill reminders</li>
                  </ul>
                </div>

                {/* V2.0.0 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V2.0.0</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>August 2026</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Major UI and Architecture Update</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Major visual redesign and glassmorphism</li>
                    <li>Offline-first architecture and Supabase cloud persistence</li>
                    <li>Capacitor Android integration</li>
                  </ul>
                </div>

                {/* V1.0.0 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V1.0.0</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>July 2026</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Initial Release</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Core personal finance tracking, accounts, income & expenses</li>
                    <li>Category monthly budgets and secure authentication</li>
                  </ul>
                </div>

                {/* V3.0.8 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.8</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>14 September 2026</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Final V3 Update</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Added a proper Pick on Map option when editing transaction locations</li>
                    <li>Improved map location search, pin selection and location editing</li>
                    <li>Improved the Maps tab and removed unnecessary place counters</li>
                    <li>Improved version history and application information</li>
                    <li>Improved Calendar, Categories, Reminders and Settings usability</li>
                    <li>Added final responsive, stability and synchronization improvements</li>
                  </ul>
                </div>

                {/* V3.0.7 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.7</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Final V3 preparation</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Improved mobile responsiveness across small devices</li>
                    <li>Fixed interface alignment and icon rendering issues</li>
                    <li>Improved synchronization reliability</li>
                    <li>Prepared the application for the V3.0.8 release</li>
                  </ul>
                </div>

                {/* V3.0.6 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.6</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Calendar and analytics improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Improved Calendar layout and navigation controls</li>
                    <li>Added independent scrolling for transaction side lists</li>
                    <li>Expanded financial analytics breakdown and charts</li>
                  </ul>
                </div>

                {/* V3.0.5 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.5</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Settings and category improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Improved category management interface</li>
                    <li>Added category drag reordering and safe transaction reassignment</li>
                    <li>Improved Settings layout and controls</li>
                  </ul>
                </div>

                {/* V3.0.4 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.4</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Reminders and notifications improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Improved payment and bill reminders tracking</li>
                    <li>Added native Android local notification scheduling</li>
                    <li>Improved reminder controls and notification behavior</li>
                  </ul>
                </div>

                {/* V3.0.3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.3</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Location search improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Improved online place searching with Photon and Nominatim</li>
                    <li>Improved location suggestions and place details</li>
                    <li>Improved handling of unknown location coordinates</li>
                  </ul>
                </div>

                {/* V3.0.2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.2</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Maps and location improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Added transaction location support</li>
                    <li>Added interactive Leaflet map functionality</li>
                    <li>Improved location search and details panel</li>
                  </ul>
                </div>

                {/* V3.0.1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.1</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Stability and responsive improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Improved mobile and desktop layouts</li>
                    <li>Fixed interface alignment and spacing issues</li>
                    <li>Improved application stability</li>
                  </ul>
                </div>

                {/* V3.0.0 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V3.0.0</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Major V3 design and functionality update</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Introduced the new indigo, violet, blue and cyan visual identity</li>
                    <li>Improved the glass-style interface and responsive layouts</li>
                    <li>Improved accounts, transactions, budgets and dashboard experience</li>
                    <li>Added stronger cloud synchronization and offline support</li>
                  </ul>
                </div>

                {/* V2.0.1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V2.0.1</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Performance and stability improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Enhanced offline synchronization reliability</li>
                    <li>Fixed minor UI alignment and animation issues</li>
                  </ul>
                </div>

                {/* V2.0.0 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V2.0.0</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Major Spendly upgrade</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Introduced the modern Spendly interface and glass-style design</li>
                    <li>Added offline support so the app can continue working without internet</li>
                    <li>Added Supabase cloud storage and account-based data synchronization</li>
                    <li>Added Android app support</li>
                    <li>Improved analytics and notification foundations</li>
                  </ul>
                </div>

                {/* V1.0.3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V1.0.3</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Bug fixes and stability updates</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Improved budget calculations and transaction form validation</li>
                  </ul>
                </div>

                {/* V1.0.2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V1.0.2</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>UI polish and multi-account enhancements</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Added support for credit cards, bank accounts, and wallet tracking</li>
                  </ul>
                </div>

                {/* V1.0.1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V1.0.1</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Maintenance update</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Fixed minor account balance display and security issues</li>
                  </ul>
                </div>

                {/* V1.0.0 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>V1.0.0</span>
                  </div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Initial Spendly release</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <li>Track income and expenses</li>
                    <li>Manage multiple accounts and balances</li>
                    <li>Create monthly budgets</li>
                    <li>Sign in securely</li>
                    <li>View financial information from one dashboard</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9. DEVELOPER ATTRIBUTION SECTION */}
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
            padding: '18px 24px',
            marginTop: '20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Developer: <strong style={{ color: 'var(--text-primary)' }}>Dhanunjaya</strong></span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', border: "1px solid #3b82f6", borderRadius: "14px", padding: "4px 8px", gap: '6px' }}>
              <GithubIcon size={16} color="var(--accent-cyan)" /> codebydj
            </span>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            © 2026 Spendly. All rights reserved.
          </span>
        </a>
      </div>

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
                Color
              </label>
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '2px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Reassign Transactions Before Category Deletion */}
      <Modal
        isOpen={Boolean(deletingCat)}
        onClose={() => setDeletingCat(null)}
        title="Reassign Existing Transactions"
        subtitle={`Category "${deletingCat?.name}" has transactions assigned.`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#F59E0B',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              To safely delete <strong>"{deletingCat?.name}"</strong>, please choose a category to move its existing transactions to. No transactions will be lost.
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Move existing transactions to:
            </label>
            <select
              value={reassignTargetId}
              onChange={(e) => setReassignTargetId(e.target.value)}
              style={{ width: '100%', fontSize: '0.9rem' }}
            >
              {categories
                .filter((c) => c.id !== deletingCat?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={() => setDeletingCat(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleConfirmReassignAndDelete} className="btn btn-danger">
              Move Transactions & Delete Category
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
