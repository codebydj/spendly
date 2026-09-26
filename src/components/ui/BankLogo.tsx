import React from 'react';
import { Landmark, Banknote, CreditCard, Wallet, QrCode, Building2 } from 'lucide-react';
import type { AccountType } from '../../types/finance';

interface BankLogoProps {
  accountName?: string;
  accountType?: AccountType | string;
  size?: number;
  className?: string;
}

export const BankLogo: React.FC<BankLogoProps> = ({
  accountName = '',
  accountType = 'BANK',
  size = 20,
  className = '',
}) => {
  const nameLower = accountName.toLowerCase();
  const typeUpper = accountType.toUpperCase();

  let icon = <Landmark size={size} color="var(--accent-cyan)" />;
  let bgColor = 'rgba(32, 196, 232, 0.12)';
  let borderColor = 'rgba(32, 196, 232, 0.3)';

  if (typeUpper === 'CASH' || nameLower.includes('cash') || nameLower.includes('wallet cash')) {
    icon = <Banknote size={size} color="var(--accent-cyan)" />;
    bgColor = 'rgba(32, 196, 232, 0.12)';
    borderColor = 'rgba(32, 196, 232, 0.3)';
  } else if (typeUpper === 'CREDIT_CARD' || nameLower.includes('credit') || nameLower.includes('card')) {
    icon = <CreditCard size={size} color="var(--accent-violet)" />;
    bgColor = 'rgba(134, 100, 245, 0.14)';
    borderColor = 'rgba(134, 100, 245, 0.35)';
  } else if (typeUpper === 'WALLET' || nameLower.includes('paytm') || nameLower.includes('phonepe') || nameLower.includes('gpay')) {
    icon = <Wallet size={size} color="var(--accent-blue)" />;
    bgColor = 'rgba(86, 133, 255, 0.14)';
    borderColor = 'rgba(86, 133, 255, 0.35)';
  } else if (nameLower.includes('upi') || nameLower.includes('qr')) {
    icon = <QrCode size={size} color="var(--accent-lavender)" />;
    bgColor = 'rgba(184, 170, 248, 0.14)';
    borderColor = 'rgba(184, 170, 248, 0.35)';
  } else if (nameLower.includes('canara')) {
    icon = <Building2 size={size} color="#20C4E8" />;
    bgColor = 'rgba(32, 196, 232, 0.15)';
    borderColor = 'rgba(32, 196, 232, 0.4)';
  } else if (nameLower.includes('hdfc') || nameLower.includes('sbi') || nameLower.includes('icici') || nameLower.includes('axis')) {
    icon = <Landmark size={size} color="#5685FF" />;
    bgColor = 'rgba(86, 133, 255, 0.15)';
    borderColor = 'rgba(86, 133, 255, 0.4)';
  }

  return (
    <div
      className={className}
      style={{
        width: `${size * 2}px`,
        height: `${size * 2}px`,
        borderRadius: '10px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
};
