import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { GlassCard } from '../components/ui/GlassCard';
import { SpendlyLogo } from '../components/ui/SpendlyLogo';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export const UpdatePasswordView: React.FC = () => {
  const { setCurrentView, showToast, logout } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password requirement validations
  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const matchesConfirm = password.length > 0 && password === confirmPassword;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Unable to update password. Your reset session may have expired.');
        showToast(error.message || 'Password update failed', 'danger');
      } else {
        setIsSuccess(true);
        showToast('Password updated successfully!', 'success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    await logout();
    setCurrentView('login');
  };

  if (isSuccess) {
    return (
      <div style={{ maxWidth: '440px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <GlassCard elevated style={{ textAlign: 'center', padding: '36px 24px' }}>
          <CheckCircle2 size={48} color="var(--accent-emerald)" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Password Updated Successfully
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
            Your account password has been changed. You can now sign in to Spendly with your new password.
          </p>

          <div style={{ marginTop: '28px' }}>
            <button
              onClick={handleBackToLogin}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.92rem' }}
            >
              <span>Back to Login</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '420px', margin: '32px auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <SpendlyLogo type="icon" size={60} style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Set New Password</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Please choose a strong new password for your Spendly account.
        </p>
      </div>

      {/* Form Card */}
      <GlassCard elevated style={{ padding: '32px 24px' }}>
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--status-danger-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--status-danger)',
              fontSize: '0.84rem',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-icon"
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Confirm New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px' }}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Password Requirements
            </span>
            <div style={{ color: hasMinLength ? 'var(--status-success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{hasMinLength ? '✓' : '•'} At least 6 characters long</span>
            </div>
            <div style={{ color: hasLetter ? 'var(--status-success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{hasLetter ? '✓' : '•'} Contains letters (a-z)</span>
            </div>
            <div style={{ color: hasNumber ? 'var(--status-success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{hasNumber ? '✓' : '•'} Contains numbers (0-9)</span>
            </div>
            <div style={{ color: matchesConfirm ? 'var(--status-success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{matchesConfirm ? '✓' : '•'} Passwords match</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !hasMinLength || !matchesConfirm}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '4px',
              opacity: isLoading || !hasMinLength || !matchesConfirm ? 0.6 : 1,
              justifyContent: 'center',
            }}
          >
            {isLoading ? (
              <span>Updating password...</span>
            ) : (
              <>
                <KeyRound size={16} /> Update Password
              </>
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-glass)', textAlign: 'center' }}>
          <button
            onClick={handleBackToLogin}
            style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Cancel and Return to Sign In
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
