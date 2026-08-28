import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [socId, setSocId] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock authentication delay
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--snt-navy-950)' }}
    >
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-3 bg-[var(--snt-navy-800)] border border-[var(--snt-navy-500)] rounded-sm text-[var(--snt-text-primary)] mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-['Space_Grotesk',sans-serif] tracking-tight text-[var(--snt-text-primary)] mb-2">
            SENTINEL
          </h1>
          <p className="text-xs text-[var(--snt-text-secondary)] font-['IBM_Plex_Sans',sans-serif] uppercase tracking-widest font-bold">
            Privileged Trust Intelligence
          </p>
          <div className="mt-4 px-2 py-1 bg-[var(--snt-navy-900)] border border-[var(--snt-navy-500)] text-[10px] text-[var(--snt-text-tertiary)] font-mono rounded-sm">
            CSI ORIGIN 2026 — PROBLEM STATEMENT 9
          </div>
        </div>

        {/* Login Panel */}
        <div className="bg-[var(--snt-navy-800)] border border-[var(--snt-navy-500)] rounded-sm p-8 shadow-2xl relative overflow-hidden">
          {/* Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--snt-accent)]" />

          <form onSubmit={handleLogin} className="space-y-6 mt-2">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[var(--snt-text-secondary)] mb-2">
                Analyst ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--snt-text-tertiary)]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOC-ADMIN-01"
                  value={socId}
                  onChange={(e) => setSocId(e.target.value)}
                  className="w-full bg-[var(--snt-navy-950)] border border-[var(--snt-navy-500)] text-[var(--snt-text-primary)] rounded-sm py-2.5 pl-10 pr-4 font-mono text-sm focus:outline-none focus:border-[var(--snt-accent)] transition-colors placeholder:text-[var(--snt-navy-500)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[var(--snt-text-secondary)] mb-2">
                Secure Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--snt-text-tertiary)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[var(--snt-navy-950)] border border-[var(--snt-navy-500)] text-[var(--snt-text-primary)] rounded-sm py-2.5 pl-10 pr-4 font-mono text-sm focus:outline-none focus:border-[var(--snt-accent)] transition-colors placeholder:text-[var(--snt-navy-500)]"
                  defaultValue="hunter2"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !socId}
              className="w-full py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  INITIALIZE SESSION
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-[var(--snt-text-tertiary)] mt-8 uppercase tracking-widest">
          RESTRICTED SYSTEM • UNAUTHORIZED ACCESS PROHIBITED
        </p>
      </div>
    </div>
  );
};

// Simple User icon since we didn't import it in this file scope above
const UserIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
