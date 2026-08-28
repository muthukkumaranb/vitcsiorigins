import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, RotateCcw, Play, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';
import { apiService } from '../../services/api';
import { ModelRegistryData, ModelRegistryVersion } from '../../types/security';


export const ModelRegistryPanel: React.FC = () => {
  const [registry, setRegistry] = useState<ModelRegistryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRegistry = useCallback(async () => {
    try {
      const data = await apiService.getMLRegistry();
      setRegistry(data);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  const handleTrainCandidate = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await apiService.trainCandidateModel();
      setActionMessage({
        type: 'success',
        text: `Candidate model '${res.version}' trained successfully. Promotion Gate: ${res.can_promote ? 'ELIGIBLE' : 'INELIGIBLE'} (${res.gate_reason})`
      });
      await fetchRegistry();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Failed to train candidate model.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (version: string) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await apiService.promoteModel(version);
      setActionMessage({ type: 'success', text: res.message || `Promoted ${version} to active production model.` });
      await fetchRegistry();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Promotion rejected by security gate.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await apiService.rollbackModel();
      setActionMessage({ type: 'success', text: res.message || 'Successfully rolled back to previous version.' });
      await fetchRegistry();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Rollback failed.' });
    } finally {
      setLoading(false);
    }
  };

  const activeVersion = registry?.active_version || 'v1.0.0';
  const versionsList = Object.values(registry?.versions || {}) as ModelRegistryVersion[];
  const activeModel = registry?.versions[activeVersion];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              Model Registry &amp; Controlled Continuous Learning (Plane B)
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
              STABLE GATE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Separated learning plane: Analyst Feedback &rarr; Verified Dataset &rarr; Candidate Training &rarr; Security Gate &rarr; Promotion
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTrainCandidate}
            disabled={loading}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50 shadow-md shadow-indigo-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Train Candidate Model
          </button>

          {registry?.previous_version && (
            <button
              onClick={handleRollback}
              disabled={loading}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold px-3 py-2 rounded-lg transition border border-amber-900/40 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rollback to {registry.previous_version}
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
            : 'bg-rose-950/70 border-rose-800 text-rose-300'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Active Production Model Highlight */}
      {activeModel && (
        <div className="bg-slate-950 border border-indigo-900/40 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Production Model:</span>
              <span className="text-xs font-mono font-bold text-indigo-300">{activeModel.version}</span>
              <span className="text-xs text-slate-500">({activeModel.model_name})</span>
            </div>
            <span className="text-xs text-slate-400">{activeModel.description}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-900">
            <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-bold">Accuracy</div>
              <div className="text-sm font-mono font-bold text-emerald-400">{((activeModel.metrics?.accuracy ?? 1.0) * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-bold">Precision</div>
              <div className="text-sm font-mono font-bold text-cyan-400">{((activeModel.metrics?.precision ?? 1.0) * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-bold">Recall</div>
              <div className="text-sm font-mono font-bold text-indigo-400">{((activeModel.metrics?.recall ?? 1.0) * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-bold">F1 Score</div>
              <div className="text-sm font-mono font-bold text-amber-400">{((activeModel.metrics?.f1_score ?? 1.0) * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-bold">False Pos Rate</div>
              <div className="text-sm font-mono font-bold text-slate-300">{((activeModel.metrics?.false_positive_rate ?? 0.0) * 100).toFixed(2)}%</div>
            </div>
            <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-bold">Status</div>
              <div className="text-sm font-bold text-emerald-400 uppercase">ACTIVE</div>
            </div>
          </div>
        </div>
      )}

      {/* Model Versions Registry Table */}
      <div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Model Versions &amp; Evaluation Gates</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Version</th>
                <th className="p-3">Status</th>
                <th className="p-3">Precision</th>
                <th className="p-3">Recall</th>
                <th className="p-3">F1 Score</th>
                <th className="p-3">FPR</th>
                <th className="p-3">Registered At</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {versionsList.map((ver) => {
                const isActive = ver.version === activeVersion;
                const isCandidate = ver.status === 'candidate';

                return (

                  <tr key={ver.version} className={isActive ? 'bg-indigo-950/20' : 'hover:bg-slate-800/40'}>
                    <td className="p-3 font-mono font-bold text-slate-200">
                      {ver.version}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        isActive
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isCandidate
                          ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                          : ver.status === 'rejected'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {ver.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{((ver.metrics?.precision ?? 0) * 100).toFixed(1)}%</td>
                    <td className="p-3 font-mono">{((ver.metrics?.recall ?? 0) * 100).toFixed(1)}%</td>
                    <td className="p-3 font-mono">{((ver.metrics?.f1_score ?? 0) * 100).toFixed(1)}%</td>
                    <td className="p-3 font-mono">{((ver.metrics?.false_positive_rate ?? 0) * 100).toFixed(2)}%</td>
                    <td className="p-3 text-slate-400">{ver.registered_at ? ver.registered_at.slice(0, 19).replace('T', ' ') : 'Baseline'}</td>
                    <td className="p-3 text-right">
                      {isCandidate && (
                        <button
                          onClick={() => handlePromote(ver.version)}
                          disabled={loading}
                          className="flex items-center gap-1 ml-auto bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded transition disabled:opacity-50"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          Promote
                        </button>
                      )}
                      {isActive && <span className="text-emerald-400 font-semibold text-[11px]">In Production</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
