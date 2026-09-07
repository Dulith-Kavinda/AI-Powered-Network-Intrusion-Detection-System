'use client';

import React from 'react';
import { X, Cpu, Network, Info, ArrowRight } from 'lucide-react';
import { EvaluatedFlow } from '@/types/nids';
import { DEFAULT_ANOMALY_THRESHOLD, DEFAULT_CONFIDENCE_THRESHOLD } from '@/lib/aiEngine';

interface FlowModalProps {
  flow: EvaluatedFlow | null;
  onClose: () => void;
}

export const FlowModal: React.FC<FlowModalProps> = ({ flow, onClose }) => {
  if (!flow) return null;

  const raw = flow.rawFeatures;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-modal)] border border-cyan-500/40 p-6 md:p-8 shadow-2xl shadow-cyan-500/10 flex flex-col gap-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pr-8 border-b border-[var(--border-color)] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-extrabold text-[var(--text-primary)] font-mono">
                Flow Inspection: <span className="text-cyan-400">{flow.flowId}</span>
              </h3>
              <span
                className="text-xs font-extrabold px-3 py-1 rounded-md uppercase border"
                style={{
                  borderColor: flow.severityColor,
                  color: flow.severityColor,
                  backgroundColor: `${flow.severityColor}22`
                }}
              >
                {flow.threatLevel} THREAT
              </span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              Captured: <strong>{flow.timestamp}</strong> &bull; Protocol: <strong>{flow.protocol}</strong> &bull; Duration: <strong>{flow.flowDurationMs} ms</strong>
            </div>
          </div>
        </div>

        {/* Cascade Decision Trail */}
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Cpu className="w-4 h-4" /> Cascade AI Decision Trail
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 text-xs">
            {/* Step 1 */}
            <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <div className="font-bold text-[var(--text-primary)]">Multiclass MLP</div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Class: <strong className="text-cyan-400">{flow.multiclassPrediction}</strong> ({flow.multiclassConfidence}%)
                </div>
              </div>
            </div>

            <div className="hidden md:flex justify-center text-[var(--text-muted)]">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Step 2 */}
            <div
              className={`p-3 rounded-lg bg-[var(--bg-card)] border flex items-start gap-2.5 ${
                flow.escalatedToAnomaly ? 'border-amber-500/50 bg-amber-500/5' : 'border-[var(--border-color)]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <div className="font-bold text-[var(--text-primary)]">Cascade Check</div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  {flow.escalatedToAnomaly ? (
                    <span className="text-amber-400 font-semibold">
                      Confidence &lt; {(DEFAULT_CONFIDENCE_THRESHOLD * 100).toFixed(0)}% &rarr; Escalated!
                    </span>
                  ) : (
                    <span>High Confidence &rarr; Direct Match</span>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex justify-center text-[var(--text-muted)]">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Step 3 */}
            <div
              className={`p-3 rounded-lg bg-[var(--bg-card)] border flex items-start gap-2.5 ${
                flow.isAnomaly ? 'border-rose-500/50 bg-rose-500/10' : 'border-[var(--border-color)]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <div className="font-bold text-[var(--text-primary)]">Autoencoder MSE</div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  {flow.anomalyMSE !== null ? (
                    <>
                      MSE: <strong className={flow.isAnomaly ? 'text-rose-400' : 'text-emerald-400'}>{flow.anomalyMSE}</strong> (Threshold: {DEFAULT_ANOMALY_THRESHOLD})
                    </>
                  ) : (
                    'Not required (Cleared)'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning Alert */}
          <div className="p-3 rounded-lg bg-cyan-500/10 border-l-4 border-cyan-400 text-xs text-[var(--text-primary)] flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>AI Reasoning:</strong> {flow.reasoning}
            </div>
          </div>
        </div>

        {/* Feature Attributes Matrix */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
            <Network className="w-4 h-4 text-cyan-400" /> Network Flow Attributes (CICIDS2017 Matrix)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Source IP:Port</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{flow.srcIp}:{flow.srcPort}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Destination IP:Port</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{flow.dstIp}:{flow.dstPort}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Total Fwd / Bwd Packets</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{raw.total_fwd_packets} / {raw.total_bwd_packets}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Fwd Packet Len Max/Min</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{raw.fwd_packet_length_max} / {raw.fwd_packet_length_min} B</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Fwd Packet Len Mean</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{raw.fwd_packet_length_mean} B</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Flow Throughput Rate</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{flow.byteRateKB} KB/s ({Math.round(raw.flow_packets_s)} pkts/s)</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Flow IAT Mean / Max</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{raw.flow_iat_mean.toFixed(1)} / {raw.flow_iat_max} &mu;s</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Flags (SYN / RST / ACK)</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">SYN: {raw.syn_flag_count} | RST: {raw.rst_flag_count} | ACK: {raw.ack_flag_count}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Init Window Fwd / Bwd</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{raw.init_win_bytes_forward} / {raw.init_win_bytes_backward} B</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Active / Idle Mean</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{raw.active_mean.toFixed(1)} / {raw.idle_mean.toFixed(1)} ms</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Reconstruction MSE</div>
              <div className={`text-xs font-mono font-extrabold ${flow.isAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                {flow.anomalyMSE !== null ? flow.anomalyMSE : 'N/A (Normal)'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Confidence Score</div>
              <div className="text-xs font-mono font-bold text-cyan-400">{flow.confidenceScore}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
