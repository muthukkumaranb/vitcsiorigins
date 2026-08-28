import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, FastForward, Activity, ShieldAlert, Clock, RefreshCw, Radio } from 'lucide-react';
import { apiService } from '../../services/api';
import { SimulationStatus } from '../../types/security';

interface SimulationControlWidgetProps {
  onEventIngested?: () => void;
}

export const SimulationControlWidget: React.FC<SimulationControlWidgetProps> = ({ onEventIngested }) => {
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isProcessingStep, setIsProcessingStep] = useState(false);
  const [selectedMode, setSelectedMode] = useState('mixed');
  const [selectedInterval, setSelectedInterval] = useState(2000);
  const [connectionError, setConnectionError] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState<string>('');

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiService.getSimulationStatus();
      setStatus(data);
      setConnectionError(false);
      if (data.mode) setSelectedMode(data.mode);
      if (data.interval_ms) setSelectedInterval(data.interval_ms);
    } catch {
      setConnectionError(true);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 2000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  // Update relative time since last event
  useEffect(() => {
    if (!status?.last_event_timestamp) {
      setSecondsAgo('idle');
      return;
    }
    const updateTime = () => {
      const diff = Math.floor((Date.now() - new Date(status.last_event_timestamp!).getTime()) / 1000);
      if (diff < 3) setSecondsAgo('just now');
      else if (diff < 60) setSecondsAgo(`${diff}s ago`);
      else setSecondsAgo(`${Math.floor(diff / 60)}m ago`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [status?.last_event_timestamp]);

  const handleStart = async () => {
    setLoadingAction('start');
    try {
      const updated = await apiService.startSimulation(selectedMode, selectedInterval);
      setStatus(updated);
      await fetchStatus();
      if (onEventIngested) onEventIngested();
    } catch {
      setConnectionError(true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePause = async () => {
    setLoadingAction('pause');
    try {
      const updated = await apiService.pauseSimulation();
      setStatus(updated);
      await fetchStatus();
    } catch {
      setConnectionError(true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStop = async () => {
    setLoadingAction('stop');
    try {
      const updated = await apiService.stopSimulation();
      setStatus(updated);
      await fetchStatus();
    } catch {
      setConnectionError(true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction('reset');
    try {
      const updated = await apiService.resetSimulation();
      setStatus(updated);
      await fetchStatus();
      if (onEventIngested) onEventIngested();
    } catch {
      setConnectionError(true);
    } finally {
      setLoadingAction(null);
    }
  };


  const handleStep = async () => {
    if (isProcessingStep) return;
    setIsProcessingStep(true);
    try {
      await apiService.stepSimulation(selectedMode);
      await fetchStatus();
      if (onEventIngested) onEventIngested();
    } catch {
      setConnectionError(true);
    } finally {
      setIsProcessingStep(false);
    }
  };

  const state = status?.state || 'idle';
  const isRunning = state === 'running';
  const isStarting = state === 'starting' || loadingAction === 'start';
  const isPaused = state === 'paused';

  const scenarioLabels: Record<string, string> = {
    mixed: 'Mixed Traffic (80% Normal / 20% Attack)',
    normal_activity: 'Normal Business Baseline',
    privilege_abuse: 'Privileged Insider Abuse (5-Stage Chain)',
    account_takeover: 'Account Takeover & Exfiltration',
    data_exfiltration: 'Mass Data Exfiltration'
  };

  return (
    <div className="bg-[#0e131f] border border-[#1f293d] rounded-xl p-4 mb-6 shadow-xl shadow-black/50">
      {/* Top Header Row: Title, Status Badge, and Telemetry Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3.5 border-b border-[#1f293d]/80">
        {/* Left: Branding & Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/70 border border-cyan-800/60 rounded-lg text-cyan-400">
            <Radio className={`w-4 h-4 ${isRunning ? 'animate-pulse text-emerald-400' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black tracking-wider text-gray-200 uppercase">Live Telemetry Simulator</span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isRunning
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-sm shadow-emerald-950'
                  : isStarting
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  : isPaused
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : connectionError
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-ping' : isStarting ? 'bg-cyan-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-500'
                }`} />
                {isRunning
                  ? 'RUNNING'
                  : isStarting
                  ? 'STARTING...'
                  : isPaused
                  ? 'PAUSED'
                  : connectionError
                  ? 'ERROR'
                  : 'STOPPED'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isRunning
                ? `Active synthetic attack progression · ${scenarioLabels[selectedMode] || selectedMode}`
                : isStarting
                ? 'Connecting to real-time ingestion pipeline and feature extractor...'
                : isPaused
                ? 'Telemetry generation paused · Detection engine holding current state'
                : connectionError
                ? 'Telemetry endpoint unreachable. Check backend connectivity.'
                : 'Simulator stopped · Select a scenario and click Start to begin live detection'}
            </p>
          </div>
        </div>

        {/* Right: Metric Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-[#080b11] border border-[#1f293d] px-3 py-1.5 rounded-lg text-gray-300 font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-gray-400 font-sans">Events:</span>
            <span className="font-bold text-gray-100">{status?.total_stored_events ?? 412}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#080b11] border border-[#1f293d] px-3 py-1.5 rounded-lg text-gray-300 font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px] text-gray-400 font-sans">Alerts:</span>
            <span className="font-bold text-rose-400">{status?.alerts_triggered ?? 0}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-[#080b11] border border-[#1f293d] px-3 py-1.5 rounded-lg text-gray-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-gray-400 font-sans">Last:</span>
            <span className="font-medium text-cyan-300">{secondsAgo}</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar: Selectors & Unified Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-3.5">
        {/* Dropdowns: Scenario & Speed */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Scenario:</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              disabled={isRunning || isStarting}
              className="bg-[#080b11] border border-[#1f293d] text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-60 cursor-pointer"
            >
              <option value="mixed">Mixed Traffic (80% Normal / 20% Attack)</option>
              <option value="normal_activity">Normal Business Baseline</option>
              <option value="privilege_abuse">Privilege Abuse (5-Stage Chain)</option>
              <option value="account_takeover">Account Takeover &amp; Exfiltration</option>
              <option value="data_exfiltration">Mass Data Exfiltration</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Rate:</label>
            <select
              value={selectedInterval}
              onChange={(e) => setSelectedInterval(Number(e.target.value))}
              disabled={isRunning || isStarting}
              className="bg-[#080b11] border border-[#1f293d] text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-60 cursor-pointer"
            >
              <option value={1000}>1.0s (Fast)</option>
              <option value={2000}>2.0s (Normal)</option>
              <option value={3000}>3.0s (Relaxed)</option>
              <option value={5000}>5.0s (Slow)</option>
            </select>
          </div>
        </div>

        {/* Buttons: Cohesive Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Start / Pause Main Action Button */}
          {isRunning ? (
            <button
              onClick={handlePause}
              disabled={loadingAction === 'pause'}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-amber-950/60 disabled:opacity-50 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isStarting || loadingAction === 'start'}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-950/60 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPaused ? 'Resume' : isStarting ? 'Starting...' : 'Start'}</span>
            </button>
          )}

          {/* Step Button */}
          <button
            onClick={handleStep}
            disabled={isProcessingStep || isRunning || isStarting}
            title="Inject a single event into detection pipeline"
            className="flex items-center gap-1.5 bg-cyan-700/80 hover:bg-cyan-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-cyan-500/40 disabled:opacity-40 cursor-pointer"
          >
            <FastForward className={`w-3.5 h-3.5 ${isProcessingStep ? 'animate-spin' : ''}`} />
            <span>{isProcessingStep ? 'Stepping...' : 'Step'}</span>
          </button>

          {/* Stop Button */}
          {(isRunning || isPaused) && (
            <button
              onClick={handleStop}
              disabled={loadingAction === 'stop'}
              title="Stop continuous simulation"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Reset Baseline Button */}
          <button
            onClick={handleReset}
            disabled={loadingAction === 'reset' || isStarting}
            title="Reset live buffer to frozen 412 baseline events"
            className="flex items-center gap-1.5 bg-[#080b11] hover:bg-slate-800 text-gray-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-[#1f293d] disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Connection Error Retry */}
          {connectionError && (
            <button
              onClick={fetchStatus}
              className="flex items-center gap-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-rose-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Line on Active Operations */}
      {(isStarting || isProcessingStep) && (
        <div className="mt-3 w-full bg-[#1f293d] h-1 rounded-full overflow-hidden">
          <div className="bg-cyan-400 h-full rounded-full animate-pulse w-full"></div>
        </div>
      )}
    </div>
  );
};
