import React, { useState } from 'react';
import { Card } from '../common/Card';
import { RelationshipGraphData } from '../../types/security';
import { Network, User, Laptop, CreditCard, Shield, Database, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface RelationshipGraphProps {
  data: RelationshipGraphData;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ data }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>('U0345');

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'USER':
        return User;
      case 'BENEFICIARY':
        return CreditCard;
      case 'ACCOUNT':
        return CreditCard;
      case 'DEVICE':
        return Laptop;
      case 'PRIVILEGE':
        return Shield;
      case 'RESOURCE':
      default:
        return Database;
    }
  };

  const centerNode = data.nodes.find((n) => n.type === 'USER') || data.nodes[0];
  const outerNodes = data.nodes.filter((n) => n.id !== centerNode.id);

  const activeNodeDetails = data.nodes.find((n) => n.id === selectedNode);

  return (
    <Card className="col-span-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            Privileged Entity Relationship Graph
          </h3>
          <p className="text-xs text-gray-400">Contextual topology mapping linked devices, accounts, and targets</p>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 border border-cyan-800 bg-cyan-950/60 px-2 py-0.5 rounded">
          INTERACTIVE TOPOLOGY
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        {/* Interactive Visual Canvas */}
        <div className="lg:col-span-3 bg-[#0b0f17] border border-[#1f293d] rounded-xl p-6 min-h-[360px] flex items-center justify-center relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {outerNodes.map((node, i) => {
              // Calculate radial coordinates around center
              const total = outerNodes.length;
              const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
              const radius = 130;
              const cx = 280 + radius * Math.cos(angle);
              const cy = 180 + radius * Math.sin(angle);

              const link = data.links.find((l) => l.target === node.id || l.source === node.id);
              const isAnomalous = link?.isAnomalous;

              return (
                <line
                  key={node.id}
                  x1="280"
                  y1="180"
                  x2={cx}
                  y2={cy}
                  stroke={isAnomalous ? '#ef4444' : '#1f293d'}
                  strokeWidth={isAnomalous ? '2.5' : '1.5'}
                  strokeDasharray={isAnomalous ? '4 4' : 'none'}
                  className={isAnomalous ? 'animate-pulse' : ''}
                />
              );
            })}
          </svg>

          <div className="relative w-[560px] h-[360px] flex items-center justify-center">
            {/* Center User Node */}
            <button
              onClick={() => setSelectedNode(centerNode.id)}
              className={clsx(
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 p-4 rounded-full border-2 transition-all cursor-pointer shadow-2xl flex flex-col items-center justify-center gap-1 group',
                centerNode.risk === 'CRITICAL'
                  ? 'bg-red-950 border-red-500 text-red-400 ring-8 ring-red-500/20'
                  : 'bg-cyan-950 border-cyan-500 text-cyan-400'
              )}
            >
              <User className="w-6 h-6" />
              <span className="text-[10px] font-extrabold font-mono text-gray-100">{centerNode.id}</span>
            </button>

            {/* Outer Radial Nodes */}
            {outerNodes.map((node, i) => {
              const total = outerNodes.length;
              const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
              const radius = 130;
              const left = 280 + radius * Math.cos(angle) - 40;
              const top = 180 + radius * Math.sin(angle) - 40;

              const Icon = getNodeIcon(node.type);
              const isSelected = selectedNode === node.id;
              const isCritical = node.risk === 'CRITICAL' || node.risk === 'HIGH';

              return (
                <button
                  key={node.id}
                  style={{ left: `${left}px`, top: `${top}px` }}
                  onClick={() => setSelectedNode(node.id)}
                  className={clsx(
                    'absolute z-20 p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 w-24 text-center group shadow-lg',
                    isSelected
                      ? 'ring-2 ring-cyan-400 scale-110 z-30 bg-[#161f30]'
                      : 'bg-[#111827] hover:bg-[#161f30]',
                    isCritical ? 'border-red-500/60 text-red-400' : 'border-[#1f293d] text-gray-300'
                  )}
                >
                  <Icon className={clsx('w-4 h-4', isCritical ? 'text-red-400' : 'text-cyan-400')} />
                  <span className="text-[10px] font-bold text-gray-200 truncate w-full">
                    {node.label}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 uppercase">{node.type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-[#0b0f17] border border-[#1f293d] rounded-xl p-4 h-full flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Entity Inspection
            </h4>
            {activeNodeDetails ? (
              <div className="space-y-3">
                <div className="p-3 bg-[#111827] border border-[#1f293d] rounded-lg">
                  <div className="text-xs font-bold text-gray-100">{activeNodeDetails.label}</div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                    TYPE: {activeNodeDetails.type}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-gray-400">Risk Assessment:</span>
                  <div className="font-mono font-bold text-red-400">
                    {activeNodeDetails.risk || 'LOW'}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-gray-400">Telemetry Details:</span>
                  <p className="text-gray-300 leading-relaxed text-[11px] bg-[#111827] p-2.5 rounded border border-[#1f293d]">
                    {activeNodeDetails.details || 'No active alerts associated with this entity node.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Click any entity node to inspect topology details.</p>
            )}
          </div>

          <div className="pt-3 border-t border-[#1f293d] mt-4 text-[10px] text-gray-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Red dashed vectors indicate high-variance anomalous relationships.</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
