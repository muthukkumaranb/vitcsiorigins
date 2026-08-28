import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbLabel = (segment: string) => {
    switch (segment) {
      case 'dashboard':
        return 'Command Center';
      case 'threats':
        return 'Threat Center';
      case 'identities':
        return 'Privileged Identities';
      case 'runtime-behaviour':
        return 'Runtime Behaviour Centre';
      case 'behaviour':
      case 'behaviour-risk':
        return 'Behaviour & Risk Intelligence';
      case 'investigation':
        return 'Investigation Workspace';
      case 'analytics':
      case 'security-analysis':
        return 'Security Analytics';
      case 'audit':
        return 'Response & Audit';
      case 'settings':
        return 'Settings & RBAC';
      default:
        return segment;
    }
  };

  return (
    <nav className="flex items-center gap-2 px-6 py-2.5 bg-[#0b0f17]/50 dark:bg-[#0b0f17]/50 light:bg-white/80 border-b border-[#1f293d]/50 dark:border-[#1f293d]/50 light:border-slate-200 text-xs text-gray-400 dark:text-gray-400 light:text-slate-500 transition-colors">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>SENTINEL</span>
      </Link>

      {pathnames.map((segment, index) => {
        const isLast = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 dark:text-gray-600 light:text-slate-400 shrink-0" />
            {isLast ? (
              <span className="text-gray-200 dark:text-gray-200 light:text-slate-900 font-semibold uppercase tracking-wider">
                {getBreadcrumbLabel(segment)}
              </span>
            ) : (
              <Link to={to} className="hover:text-cyan-400 transition-colors capitalize">
                {getBreadcrumbLabel(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
