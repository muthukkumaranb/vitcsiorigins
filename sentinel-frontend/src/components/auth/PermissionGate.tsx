import React from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  action?: 'simulate' | 'retrain' | 'respond' | 'feedback' | 'admin_settings';
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredRole,
  action,
  fallback = null,
}) => {
  const { hasPermission, canPerformAction } = useAuth();

  if (requiredRole && !hasPermission(requiredRole)) {
    return <>{fallback}</>;
  }

  if (action && !canPerformAction(action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
