'use client';

import React from 'react';
import { Cpu, Layers, Sliders, ChevronRight, Binary, ShieldCheck } from 'lucide-react';
import { BatchReport } from '@/types/nids';

interface CascadePipelineHubProps {
  batchReport: BatchReport | null;
  batchHistory: BatchReport[];
  confThreshold: number;
  anomalyThreshold: number;
  onConfThresholdChange: (val: number) => void;
  onAnomalyThresholdChange: (val: number) => void;
  onSelectBatchIndex: (index: number) => void;
}

export const CascadePipelineHub: React.FC<CascadePipelineHubProps> = ({
  batchReport,
  batchHistory,
  confThreshold,
  anomalyThreshold,
  onConfThresholdChange,
  onAnomalyThresholdChange,
  onSelectBatchIndex,
}) => {
  return (
    <section className="p-5 md:p-6 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Dual-Stage Cascade AI Decision Pipeline (Multiclass &rarr; Anomaly Autoencoder)
          </h2>
        </div>

        {/* Batch History Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="batchHistory" className="text-xs text-[var(--text-secondary)] font-medium">
            Batch History:
          </label>
          <select
            id="batchHistory"
            onChange={(e) => onSelectBatchIndex(Number(e.target.value))}
            className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {batchHistory.map((b, idx) => (
              <option key={idx} value={idx}>
                Batch #{b.batchNumber} ({b.timestamp}) &bull; Risk: {b.batchRiskScore}/100 [{b.attackCount} Threats]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Pipeline Flowchart */}
      <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-3.5 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
        {/* Node 1 */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
            <Binary className="w-4 h-4 text-cyan-400" /> 1. Ingestion Buffer
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Captures bi-directional packets into <strong>500-flow batches</strong> with 47 statistical features.
          </p>
        </div>

        <div className="hidden md:flex justify-center text-cyan-400">
          <ChevronRight className="w-5 h-5" />
        </div>

        {/* Node 2 */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-cyan-500/50 shadow-md shadow-cyan-500/10 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Layers className="w-4 h-4" /> 2. Multiclass MLP (15 Classes)
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Identifies known signatures (DDoS, PortScan, Web Attacks). High confidence &rarr; <strong>Direct Match</strong>.
          </p>
        </div>

        <div className="hidden md:flex justify-center text-cyan-400">
          <ChevronRight className="w-5 h-5" />
        </div>

        {/* Node 3 */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-rose-500/30 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
            <ShieldCheck className="w-4 h-4" /> 3. Anomaly Autoencoder Fallback
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            If confidence &lt; {(confThreshold * 100).toFixed(0)}%: calculates <strong>Reconstruction MSE</strong> vs Threshold ({anomalyThreshold}) to detect <strong>Zero-Day Threats</strong>.
          </p>
        </div>
      </div>

      {/* Threshold Controls & Summary KPI Pills */}
      <div className="flex flex-wrap items-center justify-between gap-6 pt-2 border-t border-[var(--border-color)]">
        {/* Sliders */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-xs text-[var(--text-secondary)] font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Multiclass Confidence:
            </label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={confThreshold}
              onChange={(e) => onConfThresholdChange(Number(e.target.value))}
              className="w-28 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-md">
              {(confThreshold * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-[var(--text-secondary)] font-semibold">
              Anomaly MSE Threshold:
            </label>
            <input
              type="range"
              min="0.08"
              max="0.30"
              step="0.01"
              value={anomalyThreshold}
              onChange={(e) => onAnomalyThresholdChange(Number(e.target.value))}
              className="w-28 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-md">
              {anomalyThreshold.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Batch Summary KPI Pills */}
        <div className="flex flex-wrap gap-2.5">
          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
            <div className="text-sm font-extrabold font-mono text-cyan-400">
              {batchReport?.totalFlows ?? 500}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">Total Flows</div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
            <div className="text-sm font-extrabold font-mono text-rose-400">
              {batchReport?.attackCount ?? 0}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">Attacks Detected</div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
            <div className="text-sm font-extrabold font-mono text-emerald-400">
              {batchReport?.benignCount ?? 500}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">Benign Flows</div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
            <div className="text-sm font-extrabold font-mono text-amber-400">
              {batchReport?.escalatedCount ?? 0}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">Escalated to Anomaly</div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
            <div className="text-sm font-extrabold font-mono text-rose-400">
              {batchReport?.anomalyCount ?? 0}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">Verified Anomalies</div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
            <div className="text-sm font-extrabold font-mono text-[var(--text-primary)]">
              {batchReport?.avgMSE ? batchReport.avgMSE.toFixed(4) : '0.0520'}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">Average MSE</div>
          </div>
        </div>
      </div>
    </section>
  );
};
