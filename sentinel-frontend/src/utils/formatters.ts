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
        text: 'text-red-500',
        bg: 'bg-red-950/40',
        border: 'border-red-500/50',
        badge: 'bg-red-500/10 text-red-400 border-red-500/30',
        bar: 'bg-red-500'
      };
    case 'HIGH':
      return {
        text: 'text-orange-500',
        bg: 'bg-orange-950/40',
        border: 'border-orange-500/50',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        bar: 'bg-orange-500'
      };
    case 'MEDIUM':
      return {
        text: 'text-yellow-500',
        bg: 'bg-yellow-950/40',
        border: 'border-yellow-500/50',
        badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        bar: 'bg-yellow-500'
      };
    case 'LOW':
    default:
      return {
        text: 'text-emerald-500',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/50',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        bar: 'bg-emerald-500'
      };
  }
}

export function getAccountTypeColor(accountType: AccountType): string {
  switch (accountType) {
    case 'Administrator':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'Service Account':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    case 'Automated System':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'Employee':
    default:
      return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
  }
}
