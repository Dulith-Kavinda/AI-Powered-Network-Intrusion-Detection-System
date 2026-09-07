'use client';

import React from 'react';
import { Activity, BrainCircuit, CheckCircle2, CircleAlert, Download, FileCog, Gauge, SlidersHorizontal } from 'lucide-react';
import { BatchReport, EvaluatedFlow } from '@/types/nids';

interface AutoencoderPanelProps {
  batchReport: BatchReport | null;
  batchHistory: BatchReport[];
  anomalyThreshold: number;
  onAnomalyThresholdChange: (value: number) => void;
  onSelectBatchIndex: (index: number) => void;
  flows: EvaluatedFlow[];
  filters: Record<'srcFilter' | 'dstFilter' | 'protocolFilter' | 'portFilter' | 'anomalyFilter', string>;
  onFilterChange: (name: keyof AutoencoderPanelProps['filters'], value: string) => void;
  onDownload: () => void;
}

export const AutoencoderPanel: React.FC<AutoencoderPanelProps> = ({
  batchReport,
  batchHistory,
  anomalyThreshold,
  onAnomalyThresholdChange,
  onSelectBatchIndex,
  flows,
  filters,
  onFilterChange,
  onDownload,
}) => {
  const anomalyRate = batchReport && batchReport.totalFlows > 0
    ? (batchReport.anomalyCount / batchReport.totalFlows) * 100
    : 0;
  const topAnomalies = (batchReport?.flowResults || flows)
    .filter((flow) => flow.isAnomaly)
    .sort((a, b) => (b.anomalyMSE ?? 0) - (a.anomalyMSE ?? 0))
    .slice(0, 6) ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-color)] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Autoencoder anomaly monitor</h2>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Single model
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
              Every flow is scored by reconstruction error. Higher MSE means the traffic differs further from the benign baseline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-[11px]">
          <FileCog className="h-4 w-4 text-cyan-300" />
          <span className="font-mono text-[var(--text-secondary)]">autoencoder_ids_model.pt</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-[var(--text-primary)]">Python service model</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Flow filters</span>
        <FilterInput label="Source IP" value={filters.srcFilter} onChange={(value) => onFilterChange('srcFilter', value)} />
        <FilterInput label="Destination IP" value={filters.dstFilter} onChange={(value) => onFilterChange('dstFilter', value)} />
        <FilterInput label="Port" value={filters.portFilter} onChange={(value) => onFilterChange('portFilter', value)} />
        <select
          aria-label="Protocol filter"
          value={filters.protocolFilter}
          onChange={(event) => onFilterChange('protocolFilter', event.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-2.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-cyan-400"
        >
          <option value="">All protocols</option>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="ICMP">ICMP</option>
        </select>
        <select
          aria-label="Anomaly filter"
          value={filters.anomalyFilter}
          onChange={(event) => onFilterChange('anomalyFilter', event.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-2.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-cyan-400"
        >
          <option value="all">All results</option>
          <option value="true">Anomalies only</option>
          <option value="false">Normal only</option>
        </select>
        <button
          type="button"
          onClick={onDownload}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-400/20"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] md:p-6">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Flows scored" value={(batchReport?.totalFlows ?? 0).toLocaleString()} icon={<Activity className="h-4 w-4" />} />
            <Metric label="Anomalies" value={(batchReport?.anomalyCount ?? 0).toLocaleString()} tone="rose" icon={<CircleAlert className="h-4 w-4" />} />
            <Metric label="Anomaly rate" value={`${anomalyRate.toFixed(1)}%`} tone="amber" icon={<Gauge className="h-4 w-4" />} />
            <Metric label="Average MSE" value={(batchReport?.avgMSE ?? 0).toFixed(4)} tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} />
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Reconstruction threshold</p>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">Flows above this MSE are flagged.</p>
              </div>
              <span className="rounded-md bg-cyan-400/10 px-2 py-1 font-mono text-sm font-bold text-cyan-300">
                {anomalyThreshold.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-cyan-300" />
              <input
                aria-label="Reconstruction threshold"
                type="range"
                min="0.01"
                max="0.60"
                step="0.001"
                value={anomalyThreshold}
                onChange={(event) => onAnomalyThresholdChange(Number(event.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
              <span>0.010</span>
              <span>0.600</span>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Highest reconstruction errors</h3>
              <span className="text-[10px] text-[var(--text-muted)]">Current batch</span>
            </div>
            {topAnomalies.length > 0 ? (
              <div className="space-y-2">
                {topAnomalies.map((flow) => (
                  <div key={flow.flowId} className="flex items-center justify-between gap-3 rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] text-[var(--text-primary)]">{flow.flowId}</p>
                      <p className="truncate text-[10px] text-[var(--text-muted)]">{flow.srcIp} → {flow.dstIp}:{flow.dstPort} · {flow.protocol}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold text-rose-300">{(flow.anomalyMSE ?? 0).toFixed(4)} MSE</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border-color)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                No anomalies in the current batch.
              </div>
            )}
          </div>

          <AnomalyTimeline batches={batchHistory} />
        </div>

        <aside className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Batch history</h3>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Select a run to inspect its scores.</p>
            </div>
            <Activity className="h-4 w-4 text-cyan-300" />
          </div>
          <div className="space-y-2">
            {batchHistory.map((batch, index) => {
              const rate = batch.totalFlows > 0 ? (batch.anomalyCount / batch.totalFlows) * 100 : 0;
              const active = batch === batchReport;
              return (
                <button
                  key={`${batch.batchNumber}-${batch.timestamp}`}
                  type="button"
                  onClick={() => onSelectBatchIndex(index)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${active ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-[var(--border-color)] hover:border-cyan-400/30'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Batch #{batch.batchNumber}</span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">{batch.timestamp}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text-secondary)]">{batch.anomalyCount} anomalies</span>
                    <span className={rate > 10 ? 'text-rose-300' : 'text-emerald-300'}>{rate.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border-color)]">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(100, rate * 3)}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
};

function Metric({ label, value, icon, tone = 'cyan' }: { label: string; value: string; icon: React.ReactNode; tone?: 'cyan' | 'rose' | 'amber' | 'emerald' }) {
  const tones = {
    cyan: 'border-cyan-400/20 bg-cyan-400/5 text-cyan-300',
    rose: 'border-rose-400/20 bg-rose-400/5 text-rose-300',
    amber: 'border-amber-400/20 bg-amber-400/5 text-amber-300',
    emerald: 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300',
  };

  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="mb-2 flex items-center gap-2">{icon}<span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</span></div>
      <p className="font-mono text-xl font-extrabold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      aria-label={`${label} filter`}
      placeholder={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-28 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-2.5 py-2 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-cyan-400"
    />
  );
}

function AnomalyTimeline({ batches }: { batches: BatchReport[] }) {
  const points = batches.slice(0, 24).reverse();
  const maxRate = Math.max(1, ...points.map((batch) => batch.attackRate));

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Anomaly rate over time</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">One point per completed 500-packet batch.</p>
        </div>
        <span className="font-mono text-[10px] text-cyan-300">{points.length} batches</span>
      </div>
      {points.length > 0 ? (
        <div className="flex h-28 items-end gap-1 border-b border-l border-[var(--border-color)] px-2 pb-0">
          {points.map((batch) => (
            <div key={batch.batchNumber} className="group relative flex h-full flex-1 items-end" title={`Batch ${batch.batchNumber}: ${batch.attackRate.toFixed(1)}%`}>
              <div className="w-full rounded-t-sm bg-cyan-400/80 transition-colors group-hover:bg-rose-400" style={{ height: `${Math.max(4, (batch.attackRate / maxRate) * 100)}%` }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-[var(--border-color)] text-xs text-[var(--text-muted)]">Waiting for the first 500-packet batch.</div>
      )}
    </div>
  );
}
