'use client';

import React from 'react';
import { ShieldAlert, Play, Pause, RotateCcw, Sun, Moon } from 'lucide-react';

type CaptureState = 'offline' | 'connecting' | 'live';

interface TopNavProps {
  captureState: CaptureState;
  theme: 'dark' | 'light';
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  captureState,
  theme,
  onStart,
  onPause,
  onReset,
  onToggleTheme,
}) => {
  const isStreaming = captureState === 'live';
  const isConnecting = captureState === 'connecting';

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
              AUTOENCODER MONITOR
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Local packet capture &bull; reconstruction-error detection &bull; benign baseline
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
          {isConnecting ? 'CONNECTING TO CAPTURE' : isStreaming ? 'LIVE CAPTURE ACTIVE' : 'CAPTURE OFFLINE'}
        </div>

        {/* Stream Buttons */}
        {!isStreaming && !isConnecting ? (
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
