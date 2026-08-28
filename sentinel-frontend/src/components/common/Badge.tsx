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
  let badgeStyle = 'bg-[#1d2d47] text-[#8a9ab5] border-[#253450]';

  if (variant === 'risk' && riskLevel) {
    const colors = getRiskColorClass(riskLevel);
    badgeStyle = colors.badge;
  } else if (variant === 'account' && accountType) {
    badgeStyle = getAccountTypeColor(accountType);
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-[0.06em] border font-[\'IBM_Plex_Sans\',sans-serif]',
        badgeStyle,
        className
      )}
    >
      {children}
    </span>
  );
};
