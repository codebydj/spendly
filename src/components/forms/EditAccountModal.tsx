import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { Account, AccountType } from '../../types/finance';
import {
  validateAccountFields,
  type AccountFieldErrors,
} from '../../utils/accountUtils';
import { Loader2 } from 'lucide-react';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { editAccount, showToast } = useApp();

  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingCode, setRoutingCode] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [color, setColor] = useState('#059669');
  const [description, setDescription] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);
  const [includeInAnalytics, setIncludeInAnalytics] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  const [errors, setErrors] = useState<AccountFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account && isOpen) {
      setName(account.name || '');
      setInstitution(account.institution || '');
      setType(account.type || 'BANK');
      setLastFourDigits(account.lastFourDigits || '');
      setBranchName(account.branchName || '');
      setRoutingCode(account.routingCode || '');
      setCurrency(account.currency || '₹');
      setColor(account.color || '#059669');
      setDescription(account.description || '');
      setOpeningBalance(account.openingBalance !== undefined ? String(account.openingBalance) : '0');
      setCreditLimit(account.creditLimit !== undefined ? String(account.creditLimit) : '');
      setIncludeInNetWorth(account.includeInNetWorth !== false);
      setIncludeInAnalytics(account.includeInAnalytics !== false);
      setIsDefault(Boolean(account.isDefault));
      setIsArchived(Boolean(account.isArchived));
      setErrors({});
    }
  }, [account, isOpen]);

  if (!account) return null;

  // Check clean vs dirty state to disable Save button when clean
  const isDirty =
    name.trim() !== (account.name || '').trim() ||
    institution.trim() !== (account.institution || '').trim() ||
    type !== account.type ||
    lastFourDigits.trim() !== (account.lastFourDigits || '').trim() ||
    branchName.trim() !== (account.branchName || '').trim() ||
    routingCode.trim() !== (account.routingCode || '').trim() ||
    currency !== account.currency ||
    color !== (account.color || '#059669') ||
    description.trim() !== (account.description || '').trim() ||
    parseFloat(openingBalance || '0') !== account.openingBalance ||
    (creditLimit ? parseFloat(creditLimit) : undefined) !== account.creditLimit ||
    includeInNetWorth !== (account.includeInNetWorth !== false) ||
    includeInAnalytics !== (account.includeInAnalytics !== false) ||
    isDefault !== Boolean(account.isDefault) ||
    isArchived !== Boolean(account.isArchived);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedOpening = parseFloat(openingBalance || '0');
    const parsedCreditLimit = creditLimit ? parseFloat(creditLimit) : undefined;

    const candidatePayload: Partial<Account> = {
      name: name.trim(),
      institution: institution.trim() || undefined,
      type,
      lastFourDigits: lastFourDigits.trim() || undefined,
      branchName: branchName.trim() || undefined,
      routingCode: routingCode.trim() || undefined,
      currency,
      color,
      description: description.trim() || undefined,
      openingBalance: isNaN(parsedOpening) ? 0 : parsedOpening,
      creditLimit: parsedCreditLimit !== undefined && !isNaN(parsedCreditLimit) ? parsedCreditLimit : undefined,
      includeInNetWorth,
      includeInAnalytics,
      isDefault,
      isArchived,
    };

    const validation = validateAccountFields(candidatePayload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('Please fix the validation errors in the form', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await editAccount(account.id, candidatePayload);
      if (success) {
        showToast(`Updated account "${candidatePayload.name}" successfully`, 'success');
        onClose();
      } else {
        showToast('Saved changes locally (offline pending sync queue)', 'info');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update account', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Account Details"
      subtitle={`Configure bank properties and analytics preferences for ${account.name}.`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Account Name & Type */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Account Name / Nickname *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Salary Savings, HDFC Primary"
              style={{ width: '100%', borderColor: errors.name ? 'var(--status-danger)' : undefined }}
            />
            {errors.name && <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Account Type *
            </label>
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)} style={{ width: '100%' }}>
              <option value="BANK">Bank Account</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="WALLET">Wallet / UPI</option>
              <option value="INVESTMENT">Investment</option>
              <option value="LOAN">Loan</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Institution & Last 4 Digits */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Institution / Bank Name
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Canara Bank, HDFC, SBI"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Last 4 Digits (Account Suffix)
            </label>
            <input
              type="text"
              maxLength={4}
              value={lastFourDigits}
              onChange={(e) => {
                setLastFourDigits(e.target.value);
                if (errors.lastFourDigits) setErrors((prev) => ({ ...prev, lastFourDigits: undefined }));
              }}
              placeholder="e.g. 1234"
              style={{ width: '100%', borderColor: errors.lastFourDigits ? 'var(--status-danger)' : undefined }}
            />
            {errors.lastFourDigits && (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px', display: 'block' }}>{errors.lastFourDigits}</span>
            )}
          </div>
        </div>

        {/* Branch & Routing Code / IFSC */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Branch Name
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. Indiranagar Branch"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              IFSC / Routing Code
            </label>
            <input
              type="text"
              value={routingCode}
              onChange={(e) => {
                setRoutingCode(e.target.value);
                if (errors.routingCode) setErrors((prev) => ({ ...prev, routingCode: undefined }));
              }}
              placeholder="e.g. CNRB0001234"
              style={{ width: '100%', borderColor: errors.routingCode ? 'var(--status-danger)' : undefined }}
            />
            {errors.routingCode && (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px', display: 'block' }}>{errors.routingCode}</span>
            )}
          </div>
        </div>

        {/* Opening Balance & Currency & Credit Limit */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Opening Balance
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              style={{ width: '100%' }}
              className="tabular-nums"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Currency Symbol
            </label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%' }}>
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
              <option value="AED">AED</option>
              <option value="SAR">SAR</option>
            </select>
          </div>

          {type === 'CREDIT_CARD' || type === 'LOAN' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Credit Limit
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="e.g. 100000"
                style={{ width: '100%' }}
                className="tabular-nums"
              />
            </div>
          ) : null}
        </div>

        {/* Description & Color */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Account Accent Color
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['#059669', '#2563EB', '#D97706', '#7C3AED', '#EC4899', '#4B5563', '#10B981', '#F59E0B'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: c,
                    border: color === c ? '2px solid var(--text-primary)' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                  aria-label={`Select accent color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Account Description / Notes
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional account details, account holder name, or purpose..."
            style={{ width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        {/* Checkbox Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={includeInNetWorth} onChange={(e) => setIncludeInNetWorth(e.target.checked)} />
            <span>Include in Total Net Worth Calculation</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={includeInAnalytics} onChange={(e) => setIncludeInAnalytics(e.target.checked)} />
            <span>Include in Spending & Income Analytics</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            <span>Set as Default Transaction Account</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, color: 'var(--status-expense)' }}>
            <input type="checkbox" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} />
            <span>Archive Account (Hides from transaction selectors)</span>
          </label>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
