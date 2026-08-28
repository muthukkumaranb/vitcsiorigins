import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-[#111827] border border-[#1f293d] rounded-lg p-5 shadow-lg',
        hoverable && 'transition-colors hover:border-[#374151] hover:bg-[#161f30]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
