import React, { useState } from 'react';
import { Identity } from '../../types/security';
import { Badge } from '../common/Badge';
import { Search } from 'lucide-react';

export const IdentityTable: React.FC<{ identities: Identity[] }> = ({ identities }) => {
  const [search, setSearch] = useState('');

  const filtered = identities.filter((item) =>
    `${item.user_id} ${item.name || ''} ${item.role} ${item.department || ''} ${item.peer_group || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search user identifier, role, or department..."
          className="w-full pl-9.5 pr-4 py-2.5 bg-[#111827] border border-[#1f293d] rounded-lg text-xs text-gray-200 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
        />
      </div>

      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0b0f17] border-b border-[#1f293d] text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User Identifier</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account Classification</th>
                <th className="py-3 px-4">Peer Group</th>
                <th className="py-3 px-4">Baseline Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/40 font-mono">
              {filtered.map((item) => (
                <tr key={item.user_id} className="hover:bg-[#161f30] transition-colors">
                  <td className="py-3 px-4 text-gray-200">
                    <span className="font-bold text-cyan-300">{item.user_id}</span>
                    {item.name && item.name !== item.user_id && (
                      <span className="block text-[10px] text-gray-400 font-sans">{item.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-sans font-medium">{item.role}</td>
                  <td className="py-3 px-4 font-sans">
                    <Badge variant="account" accountType={item.account_type || 'Employee'}>
                      {item.account_type || 'Employee'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{item.peer_group || 'General Staff'}</td>
                  <td className="py-3 px-4 text-gray-300">{item.normal_location || 'Corporate Device'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
