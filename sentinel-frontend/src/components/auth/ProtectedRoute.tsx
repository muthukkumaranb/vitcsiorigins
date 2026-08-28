import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-[#111827] dark:bg-[#111827] light:bg-white border border-red-500/30 rounded-xl shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase tracking-wide">
          Access Restricted (RBAC Gate)
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-400 light:text-slate-600">
          Your current role (<span className="text-cyan-400 font-mono font-bold uppercase">{user?.role}</span>) does not possess sufficient privileges to view this workspace.
        </p>
        <div className="pt-2">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Return to Security Posture
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
