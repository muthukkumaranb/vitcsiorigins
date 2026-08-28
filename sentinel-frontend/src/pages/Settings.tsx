import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { IS_MOCK_MODE } from '../services';
import { Settings as SettingsIcon, ShieldCheck, Database, Server, Save, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [useMockData] = useState<boolean>(IS_MOCK_MODE);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  );
  const [criticalThreshold, setCriticalThreshold] = useState<number>(80);
  const [highThreshold, setHighThreshold] = useState<number>(60);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            SYSTEM — Engine Settings & Integration
          </h1>
          <p className="text-xs text-gray-400">
            Configure telemetry ingestion mode, REST API endpoints, and risk thresholds
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mode Configuration Card (Sec 35) */}
        <Card>
          <div className="flex items-center gap-2 pb-3 border-b border-[#1f293d] mb-4">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-100 uppercase">Dual Data Ingestion Mode</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#0b0f17] border border-[#1f293d] rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-200">Local Mock Data Mode (Dev / Demo)</div>
                <p className="text-gray-400 mt-0.5">
                  Use realistic offline telemetry JSON data (VITE_USE_MOCK_DATA=true).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded font-mono font-bold text-xs ${
                    useMockData
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {useMockData ? 'MOCK ACTIVE' : 'REST API ACTIVE'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-300 uppercase mb-1">
                Backend REST API Base URL
              </label>
              <div className="relative">
                <Server className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0b0f17] border border-[#1f293d] rounded-lg font-mono text-gray-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Environment variable: <code className="text-cyan-400">VITE_API_BASE_URL</code>
              </p>
            </div>
          </div>
        </Card>

        {/* Risk Thresholds Card */}
        <Card>
          <div className="flex items-center gap-2 pb-3 border-b border-[#1f293d] mb-4">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-gray-100 uppercase">Detection Severity Thresholds</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block font-bold text-gray-300 uppercase mb-1">
                Critical Severity Threshold Score (0–100)
              </label>
              <input
                type="number"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full p-2.5 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-gray-200 focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-gray-500 font-sans mt-1">
                Scores ≥ {criticalThreshold} trigger immediate SUSPEND + ESCALATE recommendations.
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-300 uppercase mb-1">
                High Severity Threshold Score (0–100)
              </label>
              <input
                type="number"
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full p-2.5 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-gray-200 focus:outline-none focus:border-orange-500"
              />
              <p className="text-[10px] text-gray-500 font-sans mt-1">
                Scores ≥ {highThreshold} trigger RESTRICT & VERIFY alerts.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
            Save Engine Configuration
          </Button>

          {savedToast && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded border border-emerald-800 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings updated successfully!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
