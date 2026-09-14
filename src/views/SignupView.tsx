import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { GlassCard } from '../components/ui/GlassCard';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SignupView: React.FC = () => {
  const { setCurrentView, showToast } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  const getFriendlyErrorMessage = (rawError: string): string => {
    const msg = rawError.toLowerCase();
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'This email address is already registered. Please sign in instead.';
    }
    if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('weak password') || msg.includes('password should be at least')) {
      return 'Password is too weak. Please use at least 6 characters with letters and numbers.';
    }
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('offline')) {
      return 'Unable to connect to server. Check your internet connection.';
    }
    return rawError || 'An error occurred while creating your account.';
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    // Client-side validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check your entries.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        const friendly = getFriendlyErrorMessage(error.message);
        setErrorMessage(friendly);
        showToast(friendly, 'danger');
      } else {
        if (data.session) {
          showToast('Account created successfully!', 'success');
          setCurrentView('dashboard');
        } else if (data.user) {
          setIsSuccessMessage(true);
          showToast('Verification email sent!', 'info');
        }
      }
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(err.message || '');
      setErrorMessage(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccessMessage) {
    return (
      <div style={{ maxWidth: '440px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <GlassCard elevated style={{ textAlign: 'center', padding: '36px 24px' }}>
          <CheckCircle2 size={44} color="var(--accent-emerald)" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Check Your Email</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
            We've sent a verification link to <strong>{email}</strong>. Please check your inbox and confirm your email address before signing in.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button onClick={() => setCurrentView('login')} className="btn btn-primary">
              Proceed to Sign In
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
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-emerald)',
            color: '#042f2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            fontWeight: 800,
            fontSize: '1.3rem',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
          }}
        >
          ₹
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create Your Account</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Start managing your personal finances securely.
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

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px' }}
                autoComplete="name"
              />
            </div>
          </div>

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
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Password
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
                placeholder="At least 6 characters"
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

          {/* Confirm Password Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Confirm Password
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
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px' }}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <UserPlus size={16} /> Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-glass)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Already have an account? </span>
          <button
            onClick={() => setCurrentView('login')}
            style={{ fontSize: '0.84rem', color: 'var(--accent-emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Sign In</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
