import React, { useState } from 'react';
import { Identity } from '../../types/security';

export const IdentityTable: React.FC<{ identities: Identity[] }> = ({ identities }) => {
  const [search, setSearch] = useState('');
  const filtered = identities.filter((item) => `${item.user_id} ${item.name || ''} ${item.role} ${item.department || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-4">
    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user ID or role..." className="w-full p-3 bg-[#111827] border border-[#1f293d] rounded-lg text-xs text-gray-200" />
    <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-[#0b0f17] border-b border-[#1f293d] text-gray-400 uppercase text-[10px]"><th className="py-3 px-4">User</th><th className="py-3 px-4">Role</th><th className="py-3 px-4">Actor Type</th><th className="py-3 px-4">Peer Group</th><th className="py-3 px-4">Baseline Device</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.user_id} className="border-b border-[#1f293d]/50"><td className="py-3 px-4 font-mono text-gray-200">{item.user_id}<span className="block text-[10px] text-gray-400">{item.name || 'Not available'}</span></td><td className="py-3 px-4 text-gray-300">{item.role}</td><td className="py-3 px-4 text-gray-300">{item.account_type || 'Not available'}</td><td className="py-3 px-4 text-gray-300">{item.peer_group}</td><td className="py-3 px-4 text-gray-300">{item.normal_location || 'Not available'}</td></tr>)}</tbody></table></div></div>
  </div>;
};
