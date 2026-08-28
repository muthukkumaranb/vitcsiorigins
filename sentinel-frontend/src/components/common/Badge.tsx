import React from 'react';
import { clsx } from 'clsx';
import { RiskLevel, AccountType } from '../../types/security';
import { getRiskColorClass, getAccountTypeColor } from '../../utils/formatters';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'risk' | 'account' | 'custom' | 'status';
  riskLevel?: RiskLevel;
  accountType?: AccountType;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'custom',
  riskLevel,
  accountType,
  className
}) => {
  let badgeStyle = 'bg-gray-800 text-gray-300 border-gray-700';

  if (variant === 'risk' && riskLevel) {
    const colors = getRiskColorClass(riskLevel);
    badgeStyle = colors.badge;
  } else if (variant === 'account' && accountType) {
    badgeStyle = getAccountTypeColor(accountType);
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border',
        badgeStyle,
        className
      )}
    >
      {children}
    </span>
  );
};
