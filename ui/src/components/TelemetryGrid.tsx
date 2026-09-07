'use client';

import React from 'react';
import { Gauge, Activity, Network, AlertTriangle } from 'lucide-react';

interface TelemetryGridProps {
  packetsPerSec: number;
  bandwidthKB: number;
  totalPackets: number;
  activeFlows: number;
  bufferCount: number;
  batchSize: number;
  batchRiskScore: number;
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({
  packetsPerSec,
  bandwidthKB,
  totalPackets,
  activeFlows,
  bufferCount,
  batchSize,
  batchRiskScore,
}) => {
  const progressPct = Math.min(100, (bufferCount / batchSize) * 100);
  const circleRadius = 38;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  let riskBadge = { text: 'LOW RISK', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  if (batchRiskScore > 75) {
    riskBadge = { text: 'CRITICAL THREAT', color: 'text-rose-400 bg-rose-500/20 border-rose-500/40 critical-glow' };
  } else if (batchRiskScore > 50) {
    riskBadge = { text: 'HIGH RISK', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' };
  } else if (batchRiskScore > 25) {
    riskBadge = { text: 'ELEVATED RISK', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Packet Throughput */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex items-center gap-4 hover:border-cyan-500/40 transition-all">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <Gauge className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">Packet Speed</div>
          <div className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">
            {packetsPerSec.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">Packets / second</div>
        </div>
      </div>

      {/* 2. Bandwidth Rate */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex items-center gap-4 hover:border-emerald-500/40 transition-all">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">Live Bandwidth</div>
          <div className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">
            {bandwidthKB.toFixed(1)} <span className="text-sm font-normal text-[var(--text-muted)]">KB/s</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">Real-time throughput</div>
        </div>
      </div>

      {/* 3. Ingested Packets */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex items-center gap-4 hover:border-purple-500/40 transition-all">
        <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
          <Network className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">Ingested Traffic</div>
          <div className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">
            {totalPackets.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">Buffered flows: {activeFlows}</div>
        </div>
      </div>

      {/* 4. 500-Batch Progress Ring */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex items-center justify-between hover:border-cyan-500/40 transition-all">
        <div>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">500 Batch Buffer</div>
          <div className="text-xl font-extrabold font-mono text-[var(--text-primary)]">
            {bufferCount} <span className="text-xs text-[var(--text-muted)] font-normal">/ {batchSize}</span>
          </div>
          <div className="text-[11px] text-cyan-400 font-medium">{progressPct.toFixed(1)}% Accumulated</div>
        </div>
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
            <circle
              className="text-[var(--border-color)]"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r={circleRadius}
              cx="44"
              cy="44"
            />
            <circle
              className="text-cyan-400 transition-all duration-300 ease-out"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={circleRadius}
              cx="44"
              cy="44"
            />
          </svg>
          <span className="absolute text-[11px] font-extrabold font-mono text-cyan-400">
            {Math.round(progressPct)}%
          </span>
        </div>
      </div>

      {/* 5. Batch Threat Index */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex items-center gap-4 hover:border-rose-500/40 transition-all">
        <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">Threat Score</div>
          <div className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">
            {batchRiskScore}<span className="text-sm font-normal text-[var(--text-muted)]">/100</span>
          </div>
          <div className="mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${riskBadge.color}`}>
              {riskBadge.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
