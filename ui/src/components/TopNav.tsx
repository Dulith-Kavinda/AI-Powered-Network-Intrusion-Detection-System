'use client';

import React from 'react';
import { ShieldAlert, Play, Pause, RotateCcw, Zap, Sun, Moon } from 'lucide-react';
import { TrafficScenario } from '@/types/nids';

interface TopNavProps {
  isStreaming: boolean;
  scenario: TrafficScenario;
  speed: number;
  theme: 'dark' | 'light';
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAnalyzeBatch: () => void;
  onScenarioChange: (scenario: TrafficScenario) => void;
  onSpeedChange: (speed: number) => void;
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isStreaming,
  scenario,
  speed,
  theme,
  onStart,
  onPause,
  onReset,
  onAnalyzeBatch,
  onScenarioChange,
  onSpeedChange,
  onToggleTheme,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-xl">
      {/* Brand */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--text-primary)] to-cyan-400 bg-clip-text text-transparent">
              AI-NIDS Console
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              CASCADE AI v2.4
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Live Network Packet Sniffer &bull; 500-Batch Intelligence &bull; Multiclass + Anomaly Autoencoder
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status Indicator */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
            isStreaming
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isStreaming
                ? 'bg-emerald-400 pulse-active shadow-[0_0_8px_#10b981]'
                : 'bg-amber-400'
            }`}
          />
          {isStreaming ? 'LIVE CAPTURE ACTIVE' : 'STREAM PAUSED'}
        </div>

        {/* Scenario Selector */}
        <select
          value={scenario}
          onChange={(e) => onScenarioChange(e.target.value as TrafficScenario)}
          className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          title="Select Traffic Scenario"
        >
          <option value="mixed">🌐 Mixed Real-World Traffic</option>
          <option value="ddos_blitz">⚡ DDoS & DoS Hulk Blitz</option>
          <option value="recon_probe">🔍 PortScan & Recon Sweep</option>
          <option value="web_attack">🛡️ Web Attacks (SQLi, XSS)</option>
          <option value="zero_day_stealth">☣️ Zero-Day Stealth Anomaly</option>
          <option value="pure_benign">✅ Normal Clean Enterprise</option>
        </select>

        {/* Speed Selector */}
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          title="Packet Ingestion Rate"
        >
          <option value={2}>Slow Rate (10 flows/s)</option>
          <option value={5}>Normal Rate (25 flows/s)</option>
          <option value={15}>High Speed (75 flows/s)</option>
          <option value={35}>Ultra Turbo (175 flows/s)</option>
        </select>

        {/* Stream Buttons */}
        {!isStreaming ? (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start Capture
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] transition-all cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 fill-current" /> Pause
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all cursor-pointer"
          title="Reset Flow Buffer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Instant 500 Batch Trigger */}
        <button
          onClick={onAnalyzeBatch}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-current" /> Analyze 500 Batch
        </button>

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-cyan-500 transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Executive Light' : 'Cyber Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
        </button>
      </div>
    </header>
  );
};
