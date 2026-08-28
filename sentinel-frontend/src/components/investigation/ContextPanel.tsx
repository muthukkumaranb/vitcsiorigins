import React from 'react';
import { Card } from '../common/Card';
import { Identity } from '../../types/security';
import { Badge } from '../common/Badge';
import { User, Shield, Clock, MapPin, Users, Building } from 'lucide-react';

interface ContextPanelProps {
  identity: Identity;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ identity }) => {
  const fields = [
    { label: 'Identity ID', value: identity.user_id, icon: User, isMono: true },
    { label: 'Full Name', value: identity.name, icon: User },
    { label: 'Role', value: identity.role, icon: Shield },
    { label: 'Department', value: identity.department, icon: Building },
    { label: 'Account Type', value: identity.account_type, isBadge: 'account' },
    { label: 'Privilege Level', value: identity.privilege_level, isBadge: 'privilege' },
    { label: 'Peer Group', value: identity.peer_group, icon: Users },
    { label: 'Normal Hours', value: identity.normal_hours || '09:00 - 18:00 IST', icon: Clock },
    { label: 'Normal Location', value: identity.normal_location || 'Mumbai HQ', icon: MapPin }
  ];

  return (
    <Card className="h-full" surface="cream">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--snt-cream-200)] mb-3">
        <h3 className="snt-heading text-sm text-[var(--snt-cream-text)] uppercase flex items-center gap-2">
          <User className="w-4 h-4 opacity-70" />
          Identity Context Profile
        </h3>
        <Badge variant="risk" riskLevel={identity.status === 'CRITICAL' ? 'CRITICAL' : 'HIGH'}>
          {identity.status}
        </Badge>
      </div>

      <div className="space-y-1 text-xs">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--snt-cream-200)] hover:bg-[var(--snt-cream-200)] transition-colors px-1 rounded-sm">
            <span className="text-[var(--snt-cream-muted)] flex items-center gap-2 font-['IBM_Plex_Sans',sans-serif]">
              {f.icon && <f.icon className="w-3 h-3 opacity-60" />}
              {f.label}
            </span>
            <span className={`font-medium ${f.isMono ? 'font-mono text-[var(--snt-cream-text)] text-[11px] font-bold' : 'text-[var(--snt-cream-text)]'}`}>
              {f.isBadge === 'account' ? (
                <Badge variant="account" accountType={identity.account_type}>
                  {identity.account_type}
                </Badge>
              ) : f.isBadge === 'privilege' ? (
                <span className="px-1.5 py-0.5 bg-[#1f0c0c] text-[#d44f4f] border border-[#5c1a1a] rounded-sm font-mono text-[9px] font-bold uppercase tracking-wider">
                  {identity.privilege_level}
                </span>
              ) : (
                f.value
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
