import React from 'react';
import { Card } from '../common/Card';
import { Identity } from '../../types/security';

export const TopCriticalIdentities: React.FC<{ identities: Identity[] }> = ({ identities }) => (
  <Card className="col-span-full lg:col-span-7">
    <h2 className="text-base font-bold text-gray-100">Privileged Identities</h2>
    <p className="text-xs text-gray-400 mt-1">Source identity records. Risk and trust are shown only when supplied by the backend.</p>
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-left text-xs">
        <thead><tr className="border-b border-[#1f293d] text-gray-400 uppercase text-[10px]"><th className="pb-3 px-2">Identity</th><th className="pb-3 px-2">Role</th><th className="pb-3 px-2">Risk</th><th className="pb-3 px-2">Trust</th></tr></thead>
        <tbody>{identities.slice(0, 5).map((identity) => <tr key={identity.user_id} className="border-b border-[#1f293d]/50"><td className="py-3 px-2 font-mono text-gray-200">{identity.user_id}</td><td className="py-3 px-2 text-gray-300">{identity.role}</td><td className="py-3 px-2">{identity.risk_score ?? 'N/A'}</td><td className="py-3 px-2">{identity.trust_score ?? 'N/A'}</td></tr>)}</tbody>
      </table>
    </div>
  </Card>
);
