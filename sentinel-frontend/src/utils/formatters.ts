import { RiskLevel, AccountType } from '../types/security';

export function formatCurrency(amount: string | number): string {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }
  return amount;
}

/**
 * Returns muted, restrained semantic color classes for risk levels.
 * No neon colors — financial-security palette only.
 */
export function getRiskColorClass(level: RiskLevel): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  bar: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        text: 'text-[#d44f4f]',
        bg: 'bg-[#1f0c0c]',
        border: 'border-[#5c1a1a]',
        badge: 'bg-[#1f0c0c] text-[#d44f4f] border-[#5c1a1a]',
        bar: 'bg-[#9b2c2c]'
      };
    case 'HIGH':
      return {
        text: 'text-[#d07040]',
        bg: 'bg-[#1c0f06]',
        border: 'border-[#6b3010]',
        badge: 'bg-[#1c0f06] text-[#d07040] border-[#6b3010]',
        bar: 'bg-[#9c4a10]'
      };
    case 'MEDIUM':
      return {
        text: 'text-[#c09030]',
        bg: 'bg-[#181404]',
        border: 'border-[#564610]',
        badge: 'bg-[#181404] text-[#c09030] border-[#564610]',
        bar: 'bg-[#7a6512]'
      };
    case 'LOW':
    default:
      return {
        text: 'text-[#3a9460]',
        bg: 'bg-[#081510]',
        border: 'border-[#1a4530]',
        badge: 'bg-[#081510] text-[#3a9460] border-[#1a4530]',
        bar: 'bg-[#1d5c3a]'
      };
  }
}

/**
 * Account type colors — muted, professional
 */
export function getAccountTypeColor(accountType: AccountType): string {
  switch (accountType) {
    case 'Administrator':
      return 'bg-[#1a0f2e] text-[#9a7ec8] border-[#4a3068]';
    case 'Service Account':
      return 'bg-[#0e1f30] text-[#4a8ab5] border-[#1e4060]';
    case 'Automated System':
      return 'bg-[#0c1a2e] text-[#4a7aa0] border-[#1c3655]';
    case 'Employee':
    default:
      return 'bg-[#1d2d47] text-[#8a9ab5] border-[#253450]';
  }
}
