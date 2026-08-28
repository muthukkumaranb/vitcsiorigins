import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, quickLogin } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('sentinel2026!');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = login(username, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError('Invalid demo credentials. Use the Demo Role Presets below or check your username/password.');
    }
  };

  const handleQuickSelect = (roleKey: 'admin' | 'analyst' | 'viewer') => {
    const cred = DEMO_CREDENTIALS[roleKey];
    setUsername(cred.username);
    setPassword(cred.password);
    quickLogin(roleKey);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#111827] dark:bg-[#111827] light:bg-white border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 mb-4 shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-gray-100 dark:text-gray-100 light:text-slate-900 font-mono">
            SENTINEL
          </h1>
          <p className="text-xs text-cyan-400 font-bold tracking-widest uppercase mt-1">
            Continuous Privileged Trust
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-400 font-mono">
            <KeyRound className="w-3 h-3" /> DEMO RBAC AUTHENTICATION
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 dark:text-gray-300 light:text-slate-700 uppercase mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin, analyst, or viewer"
                className="w-full pl-9 pr-4 py-2.5 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-50 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg text-sm text-gray-200 dark:text-gray-200 light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 dark:text-gray-300 light:text-slate-700 uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-50 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg text-sm text-gray-200 dark:text-gray-200 light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full mt-2 font-bold tracking-wider"
          >
            Authenticate & Enter SOC
          </Button>
        </form>

        {/* Demo Fast-Login Preset Buttons */}
        <div className="mt-6 pt-5 border-t border-[#1f293d] dark:border-[#1f293d] light:border-slate-200">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-400 light:text-slate-500 uppercase tracking-wide mb-2.5 text-center">
            Quick Switch Demo Roles
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect('admin')}
              className="p-2 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-100 hover:border-cyan-500/50 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg text-center transition-all group"
            >
              <div className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">Admin</div>
              <div className="text-[10px] text-gray-500">Full Access</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('analyst')}
              className="p-2 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-100 hover:border-cyan-500/50 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg text-center transition-all group"
            >
              <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">Analyst</div>
              <div className="text-[10px] text-gray-500">SOC Ops</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('viewer')}
              className="p-2 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-100 hover:border-cyan-500/50 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg text-center transition-all group"
            >
              <div className="text-xs font-bold text-gray-300 group-hover:text-white">Viewer</div>
              <div className="text-[10px] text-gray-500">Read-only</div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 text-center text-xs text-gray-500 dark:text-gray-500 light:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Role-Based Access Control Active</span>
        </div>
      </div>
    </div>
  );
};
