import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { IS_MOCK_MODE } from '../services';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Database,
  Server,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  KeyRound
} from 'lucide-react';


export const Settings: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const { theme, setTheme } = useTheme();

  const [useMockData] = useState<boolean>(IS_MOCK_MODE);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000'
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
      <div className="flex items-center justify-between border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            SYSTEM — Engine Settings &amp; RBAC Control
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-slate-500">
            Configure theme aesthetics, Demo RBAC privileges, REST API endpoints, and risk thresholds
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Theme Settings Card */}
        <Card>
          <div className="flex items-center gap-2 pb-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 mb-4">
            <Sun className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase">
              Application Visual Theme
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                theme === 'dark'
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                  : 'bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-100 border-[#1f293d] text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-[#111827] border border-[#1f293d] text-cyan-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide">SOC Dark Theme (Default)</div>
                <p className="text-[11px] text-gray-500 mt-0.5">High-contrast darkroom cybersecurity palette</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                theme === 'light'
                  ? 'bg-cyan-50 border-cyan-600 text-cyan-900 shadow-md'
                  : 'bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-100 border-[#1f293d] text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 text-amber-500 shadow-sm">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide">SOC Light Theme</div>
                <p className="text-[11px] text-gray-500 mt-0.5">Crisp daytime operational console theme</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Demo RBAC Control & Permissions Matrix Card */}
        <Card>
          <div className="flex items-center gap-2 pb-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 mb-4">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase">
              Demo Role-Based Access Control (RBAC)
            </h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-gray-200 dark:text-gray-200 light:text-slate-900 flex items-center gap-2">
                  <span>Current Active Session:</span>
                  <span className="text-cyan-400 font-mono">{user?.name}</span>
                  <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-mono text-[9px] font-bold uppercase">
                    {user?.role}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-400 light:text-slate-500 mt-0.5">
                  Select a demo profile below to instantly evaluate RBAC security boundary enforcement:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    user?.role === 'admin'
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-[#111827] text-gray-400 border-[#1f293d] hover:text-white'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('analyst')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    user?.role === 'security_analyst'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-[#111827] text-gray-400 border-[#1f293d] hover:text-white'
                  }`}
                >
                  Analyst
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('viewer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    user?.role === 'viewer'
                      ? 'bg-slate-600 text-white border-slate-500 shadow-sm'
                      : 'bg-[#111827] text-gray-400 border-[#1f293d] hover:text-white'
                  }`}
                >
                  Viewer
                </button>
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg overflow-hidden">
                <thead className="bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-200 text-gray-400 dark:text-gray-400 light:text-slate-700 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-2.5">Capability / Operation</th>
                    <th className="p-2.5 text-center">Admin</th>
                    <th className="p-2.5 text-center">Security Analyst</th>
                    <th className="p-2.5 text-center">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d] dark:divide-[#1f293d] light:divide-slate-200">
                  <tr className="bg-[#111827]/40 dark:bg-[#111827]/40 light:bg-white">
                    <td className="p-2.5 font-medium text-gray-300 dark:text-gray-300 light:text-slate-800">Security Posture &amp; Threat Telemetry</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓ (Read Only)</td>
                  </tr>
                  <tr className="bg-[#111827]/20 dark:bg-[#111827]/20 light:bg-slate-50">
                    <td className="p-2.5 font-medium text-gray-300 dark:text-gray-300 light:text-slate-800">Incident Triage &amp; Copilot Investigation</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-red-400 font-bold">✗</td>
                  </tr>
                  <tr className="bg-[#111827]/40 dark:bg-[#111827]/40 light:bg-white">
                    <td className="p-2.5 font-medium text-gray-300 dark:text-gray-300 light:text-slate-800">Execute Response Actions &amp; Feedback</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-red-400 font-bold">✗</td>
                  </tr>
                  <tr className="bg-[#111827]/20 dark:bg-[#111827]/20 light:bg-slate-50">
                    <td className="p-2.5 font-medium text-gray-300 dark:text-gray-300 light:text-slate-800">Live Telemetry Simulator Controls</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-red-400 font-bold">✗</td>
                    <td className="p-2.5 text-center text-red-400 font-bold">✗</td>
                  </tr>
                  <tr className="bg-[#111827]/40 dark:bg-[#111827]/40 light:bg-white">
                    <td className="p-2.5 font-medium text-gray-300 dark:text-gray-300 light:text-slate-800">Continuous Learning (Plane B) Retrain &amp; Promote</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-red-400 font-bold">✗</td>
                    <td className="p-2.5 text-center text-red-400 font-bold">✗</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Mode Configuration Card */}
        <Card>
          <div className="flex items-center gap-2 pb-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 mb-4">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase">
              Telemetry Ingestion Mode
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-200 dark:text-gray-200 light:text-slate-900">Telemetry Engine Integration</div>
                <p className="text-gray-400 dark:text-gray-400 light:text-slate-500 mt-0.5">
                  Live backend API connecting to Flask server port 5000.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded font-mono font-bold text-xs ${
                    useMockData
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {useMockData ? 'MOCK ACTIVE' : 'REST API ACTIVE'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-300 dark:text-gray-300 light:text-slate-700 uppercase mb-1">
                Backend REST API Base URL
              </label>
              <div className="relative">
                <Server className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-50 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg font-mono text-gray-200 dark:text-gray-200 light:text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Risk Thresholds Card */}
        <Card>
          <div className="flex items-center gap-2 pb-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 mb-4">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase">
              Detection Severity Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block font-bold text-gray-300 dark:text-gray-300 light:text-slate-700 uppercase mb-1">
                Critical Severity Threshold Score (0–100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-50 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg text-gray-200 dark:text-gray-200 light:text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 dark:text-gray-300 light:text-slate-700 uppercase mb-1">
                High Severity Threshold Score (0–100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-50 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg text-gray-200 dark:text-gray-200 light:text-slate-900"
              />
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
            Save Engine Configuration
          </Button>

          {savedToast && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuration successfully saved!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
