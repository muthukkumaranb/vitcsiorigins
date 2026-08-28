import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-sm border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f7099] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-wide font-[\'IBM_Plex_Sans\',sans-serif] uppercase';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[10px] gap-1.5 leading-none',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-5 py-2.5 text-xs gap-2'
  };

  const variantClasses = {
    primary:
      'bg-[#2d4a68] border-[#4f7099] text-[#638fb8] hover:bg-[#4f7099] hover:text-[#faf8f4]',
    secondary:
      'bg-transparent border-[#304666] text-[#8a9ab5] hover:border-[#3d5a80] hover:text-[#dde4ef]',
    danger:
      'bg-[#1f0c0c] border-[#5c1a1a] text-[#d44f4f] hover:bg-[#9b2c2c] hover:border-[#d44f4f] hover:text-white',
    warning:
      'bg-[#1c0f06] border-[#6b3010] text-[#d07040] hover:bg-[#9c4a10] hover:text-white',
    outline:
      'bg-transparent border-[#304666] text-[#8a9ab5] hover:bg-[#1d2d47] hover:text-[#dde4ef]'
  };

  return (
    <button
      className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
