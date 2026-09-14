import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Unlock, LogOut } from 'lucide-react';

export const PinLockModal: React.FC = () => {
  const { isPinLocked, setIsPinLocked, settings, validatePin, logout, showToast } = useApp();
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isPinLocked || !settings.pinEnabled) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin || enteredPin.length !== 4) return;

    setIsSubmitting(true);
    setError(false);

    try {
      const isValid = await validatePin(enteredPin);
      if (isValid) {
        setIsPinLocked(false);
        setEnteredPin('');
        setError(false);
        showToast('Spendly unlocked', 'success');
      } else {
        setError(true);
        setEnteredPin('');
      }
    } catch {
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'var(--bg-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--accent-emerald-subtle)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={24} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Spendly Locked</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Enter your 4-digit security PIN code to access your financial data.
          </p>
        </div>

        <form onSubmit={handleUnlock} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="password"
            maxLength={4}
            placeholder="••••"
            required
            value={enteredPin}
            onChange={(e) => {
              setError(false);
              setEnteredPin(e.target.value);
            }}
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: '1.5rem',
              letterSpacing: '0.5em',
              padding: '12px',
              border: error ? '1px solid var(--status-danger)' : '1px solid var(--border-color)',
            }}
            autoFocus
          />

          {error && <span style={{ fontSize: '0.8rem', color: 'var(--status-danger)' }}>Incorrect PIN. Please try again.</span>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <Unlock size={16} /> Unlock
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPinLocked(false);
                logout();
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
