import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { GlassCard } from '../components/ui/GlassCard';
import { SpendlyLogo } from '../components/ui/SpendlyLogo';
import { AlertTriangle, Mail, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getAppSiteUrl } from '../utils/authConfig';

interface LinkExpiredViewProps {
  customMessage?: string;
}

export const LinkExpiredView: React.FC<LinkExpiredViewProps> = ({ customMessage }) => {
  const { setCurrentView, showToast } = useApp();

  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = resendEmail.trim();
    if (!clean) {
      setResendError('Please enter your email address.');
      return;
    }

    setIsResending(true);
    setResendError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: clean,
        options: {
          emailRedirectTo: getAppSiteUrl(),
        },
      });

      if (error) {
        setResendError(error.message || 'Unable to resend confirmation email.');
        showToast(error.message || 'Resend failed', 'danger');
      } else {
        setResendSent(true);
        showToast('Confirmation email resent!', 'success');
      }
    } catch (err: any) {
      setResendError(err.message || 'An error occurred while resending the email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <SpendlyLogo type="icon" size={60} style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Email Link Expired
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {customMessage || 'This confirmation or password reset link is no longer valid or has already expired.'}
        </p>
      </div>

      <GlassCard elevated style={{ padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Security verification links expire after a short period for your account protection. Please request a new confirmation email or reset link below.
          </p>
        </div>

        {resendSent ? (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-violet-subtle)',
              border: '1px solid var(--accent-violet-border)',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={32} color="var(--accent-emerald)" style={{ margin: '0 auto 8px auto' }} />
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email Sent!</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Check your inbox at <strong>{resendEmail}</strong> for the new link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResendConfirmation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {resendError && (
              <div style={{ fontSize: '0.82rem', color: 'var(--status-danger)', padding: '8px 12px', backgroundColor: 'var(--status-danger-subtle)', borderRadius: 'var(--radius-sm)' }}>
                {resendError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Enter Account Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isResending}
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', justifyContent: 'center', fontSize: '0.88rem' }}
            >
              {isResending ? (
                <span>Resending...</span>
              ) : (
                <>
                  <RefreshCw size={15} /> Resend Confirmation Email
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-glass)', textAlign: 'center' }}>
          <button
            onClick={() => setCurrentView('login')}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: '0.86rem' }}
          >
            <span>Back to Sign In</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
