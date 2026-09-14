import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { GlassCard } from '../components/ui/GlassCard';
import { SpendlyLogo } from '../components/ui/SpendlyLogo';
import { Modal } from '../components/ui/Modal';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { setCurrentView, showToast, user, logout } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const getFriendlyErrorMessage = (rawError: string): string => {
    const msg = rawError.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('offline')) {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    return rawError || 'An unexpected authentication error occurred.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const friendly = getFriendlyErrorMessage(error.message);
        setErrorMessage(friendly);
        showToast(friendly, 'danger');
      } else if (data.session) {
        showToast(`Welcome back, ${data.user.email}!`, 'success');
        setCurrentView('dashboard');
      }
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(err.message || '');
      setErrorMessage(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Action
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setForgotError('Please enter your account email address.');
      return;
    }

    setIsSendingForgot(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}`,
      });

      if (error) {
        setForgotError(error.message || 'Unable to send password reset email.');
      } else {
        setForgotSuccess('Password reset link sent! Please check your email inbox.');
        showToast('Password reset link sent to your email', 'success');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Email address not found or reset could not be sent.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  if (user) {
    return (
      <div style={{ maxWidth: '440px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <GlassCard elevated style={{ textAlign: 'center', padding: '36px 24px' }}>
          <CheckCircle2 size={44} color="var(--accent-emerald)" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Signed In</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            You are currently logged in as <strong>{user.email}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button onClick={() => setCurrentView('dashboard')} className="btn btn-primary">
              Go to Dashboard
            </button>
            <button onClick={logout} className="btn btn-danger">
              Sign Out
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
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Welcome to Spendly</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Sign in to your personal finance workspace.
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px' }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError(null);
                  setForgotSuccess(null);
                  setIsForgotOpen(true);
                }}
                style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                autoComplete="current-password"
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

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              Remember me across sessions
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Signup */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-glass)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Don't have an account? </span>
          <button
            onClick={() => setCurrentView('signup')}
            style={{ fontSize: '0.84rem', color: 'var(--accent-emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Create Account</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </GlassCard>

      {/* Forgot Password Reset Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title="Reset Password"
        subtitle="Enter your email to receive a password reset link."
      >
        {forgotSuccess ? (
          <div style={{ padding: '20px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={44} color="var(--accent-emerald)" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reset Link Sent</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{forgotSuccess}</p>
            <button
              type="button"
              onClick={() => setIsForgotOpen(false)}
              className="btn btn-primary"
              style={{ marginTop: '12px', padding: '10px 24px' }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {forgotError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--status-danger-subtle)',
                  color: 'var(--status-danger)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px' }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={() => setIsForgotOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSendingForgot} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                {isSendingForgot ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
