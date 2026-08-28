import React from 'react';
import { Card } from '../common/Card';
import { Identity } from '../../types/security';
import { Badge } from '../common/Badge';
import { User, Shield, Clock, MapPin, Users, Building } from 'lucide-react';
import { formatIdentityStatus } from '../../utils/formatters';

interface ContextPanelProps {
  identity: Identity;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ identity }) => {
  const allFields = [
    { label: 'Identity ID', value: identity.user_id, icon: User, isMono: true },
    { label: 'Full Name', value: identity.name && identity.name !== identity.user_id ? identity.name : null, icon: User },
    { label: 'Role', value: identity.role, icon: Shield },
    { label: 'Department', value: identity.department, icon: Building },
    { label: 'Account Type', value: identity.account_type, isBadge: 'account' },
    { label: 'Privilege Level', value: identity.privilege_level, isBadge: 'privilege' },
    { label: 'Peer Group', value: identity.peer_group, icon: Users },
    { label: 'Normal Hours', value: identity.normal_hours, icon: Clock },
    { label: 'Normal Location', value: identity.normal_location, icon: MapPin }
  ];

  const fields = allFields.filter((f) => f.value !== undefined && f.value !== null && f.value !== '' && f.value !== '-');


  return (
    <Card className="h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          Identity Context Profile
        </h3>
        <Badge variant="risk" riskLevel={identity.status === 'CRITICAL' ? 'CRITICAL' : 'HIGH'}>
          {formatIdentityStatus(identity.status)}
        </Badge>
      </div>


      <div className="space-y-3 text-xs">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-[#1f293d]/40">
            <span className="text-gray-400 flex items-center gap-2">
              {f.icon && <f.icon className="w-3.5 h-3.5 text-gray-500" />}
              {f.label}
            </span>
            <span className={`font-semibold ${f.isMono ? 'font-mono text-cyan-300' : 'text-gray-200'}`}>
              {f.isBadge === 'account' ? (
                <Badge variant="account" accountType={identity.account_type}>
                  {identity.account_type}
                </Badge>
              ) : f.isBadge === 'privilege' ? (
                <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded font-mono text-[10px]">
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
