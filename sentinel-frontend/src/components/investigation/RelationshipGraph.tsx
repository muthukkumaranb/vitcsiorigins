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
      <div className="flex items-center justify-between pb-3 border-b border-[var(--snt-navy-500)] mb-4">
        <div>
          <h3 className="snt-heading text-sm text-[var(--snt-text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-[var(--snt-accent-light)]" />
            Privileged Entity Relationship Graph
          </h3>
          <p className="text-[10px] text-[var(--snt-text-tertiary)] font-['IBM_Plex_Sans',sans-serif] mt-0.5">Contextual topology mapping linked devices, accounts, and targets</p>
        </div>
        <span className="text-[9px] font-mono font-bold text-[var(--snt-text-secondary)] border border-[var(--snt-navy-500)] bg-[var(--snt-navy-700)] px-1.5 py-0.5 rounded-sm tracking-wider">
          INTERACTIVE TOPOLOGY
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        {/* Interactive Visual Canvas with 3D perspective via CSS class */}
        <div className="lg:col-span-3 bg-[var(--snt-navy-950)] border border-[var(--snt-navy-500)] rounded-sm p-6 min-h-[360px] flex items-center justify-center relative overflow-hidden snt-depth-stage">
          
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
                  stroke={isAnomalous ? 'var(--snt-critical-text)' : 'var(--snt-navy-400)'}
                  strokeWidth={isAnomalous ? '2' : '1'}
                  strokeDasharray={isAnomalous ? '4 4' : 'none'}
                />
              );
            })}
          </svg>

          <div className="relative w-[560px] h-[360px] flex items-center justify-center">
            {/* Center User Node - Extruded */}
            <button
              onClick={() => setSelectedNode(centerNode.id)}
              className={clsx(
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group snt-node-fore',
                centerNode.risk === 'CRITICAL'
                  ? 'bg-[var(--snt-cream-50)] border-[var(--snt-critical-border)] text-[var(--snt-critical-text)] snt-node-critical'
                  : 'bg-[var(--snt-cream-50)] border-[var(--snt-navy-300)] text-[var(--snt-text-primary)]'
              )}
            >
              <User className="w-5 h-5 opacity-90" />
              <span className="text-[9px] font-extrabold font-mono">{centerNode.id}</span>
            </button>

            {/* Outer Radial Nodes - Recessed or Mid */}
            {outerNodes.map((node, i) => {
              const total = outerNodes.length;
              const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
              const radius = 130;
              const left = 280 + radius * Math.cos(angle) - 40;
              const top = 180 + radius * Math.sin(angle) - 40;

              const Icon = getNodeIcon(node.type);
              const isSelected = selectedNode === node.id;
              const isCritical = node.risk === 'CRITICAL' || node.risk === 'HIGH';
              const depthClass = isSelected || isCritical ? 'snt-node-mid' : 'snt-node-back';

              return (
                <button
                  key={node.id}
                  style={{ left: `${left}px`, top: `${top}px` }}
                  onClick={() => setSelectedNode(node.id)}
                  className={clsx(
                    'absolute z-20 p-2.5 rounded-sm border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 w-20 text-center group',
                    depthClass,
                    isSelected
                      ? 'border-[var(--snt-accent-light)] z-30 bg-[var(--snt-cream-100)] text-[var(--snt-cream-text)]'
                      : 'bg-[var(--snt-cream-200)] hover:bg-[var(--snt-cream-100)] border-[var(--snt-cream-300)]',
                    isCritical ? 'border-[var(--snt-critical-border)] text-[var(--snt-critical-text)] shadow-[inset_4px_0_0_var(--snt-critical-text)]' : 'text-[var(--snt-cream-muted)]'
                  )}
                >
                  <Icon className={clsx('w-3.5 h-3.5', isCritical ? 'text-[var(--snt-critical-text)]' : 'opacity-70')} />
                  <span className="text-[9px] font-bold truncate w-full font-['IBM_Plex_Sans',sans-serif]">
                    {node.label}
                  </span>
                  <span className="text-[8px] font-mono uppercase opacity-70 tracking-wider">{node.type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] rounded-sm p-4 h-full flex flex-col justify-between shadow-md">
          <div>
            <h4 className="snt-label mb-3">
              Entity Inspection
            </h4>
            {activeNodeDetails ? (
              <div className="space-y-4">
                <div className="p-3 bg-[var(--snt-navy-900)] border border-[var(--snt-navy-500)] rounded-sm">
                  <div className="text-xs font-bold text-[var(--snt-text-primary)] font-['Space_Grotesk',sans-serif]">{activeNodeDetails.label}</div>
                  <div className="text-[10px] text-[var(--snt-accent)] font-mono mt-1 font-bold">
                    TYPE: {activeNodeDetails.type}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[var(--snt-text-tertiary)] font-semibold text-[11px]">Risk Assessment:</span>
                  <div className={clsx("font-mono font-bold text-[11px]", activeNodeDetails.risk === 'CRITICAL' ? 'text-[var(--snt-critical-text)]' : activeNodeDetails.risk === 'HIGH' ? 'text-[var(--snt-high-text)]' : 'text-[var(--snt-safe-text)]')}>
                    {activeNodeDetails.risk || 'LOW'}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[var(--snt-text-tertiary)] font-semibold text-[11px]">Telemetry Details:</span>
                  <p className="text-[var(--snt-text-secondary)] leading-relaxed text-[10px] font-['IBM_Plex_Sans',sans-serif] bg-[var(--snt-navy-900)] p-2.5 rounded-sm border border-[var(--snt-navy-500)]">
                    {activeNodeDetails.details || 'No active alerts associated with this entity node.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--snt-text-tertiary)]">Click any entity node to inspect topology details.</p>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--snt-navy-500)] mt-4 text-[9px] text-[var(--snt-text-tertiary)] flex items-center gap-1.5 uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--snt-critical-text)]" />
            <span>Red dashed vectors indicate anomalous relationships.</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
