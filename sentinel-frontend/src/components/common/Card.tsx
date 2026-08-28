import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  /** 'dark' = navy surface (default); 'cream' = ivory analytical surface */
  surface?: 'dark' | 'cream';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  surface = 'dark',
  ...props
}) => {
  return (
    <div
      className={clsx(
        'p-5',
        surface === 'cream'
          ? 'bg-[#f5f1eb] border border-[#ece6db] rounded-sm shadow-sm'
          : 'bg-[#142032] border border-[#253450] rounded-sm shadow-md',
        hoverable &&
          (surface === 'cream'
            ? 'transition-colors hover:bg-[#ece6db] hover:border-[#d8cfbf]'
            : 'transition-colors hover:bg-[#1d2d47] hover:border-[#304666]'),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
