'use client';

import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Table as TableIcon } from 'lucide-react';
import { EvaluatedFlow, CLASS_COLORS, ThreatLevel } from '@/types/nids';

interface FlowTableProps {
  flows: EvaluatedFlow[];
  onSelectFlow: (flow: EvaluatedFlow) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export const FlowTable: React.FC<FlowTableProps> = ({
  flows,
  onSelectFlow,
  onExportJson,
  onExportCsv,
}) => {
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterThreat, setFilterThreat] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return flows.filter((f) => {
      const matchesQuery =
        !q ||
        f.flowId.toLowerCase().includes(q) ||
        f.srcIp.includes(q) ||
        f.dstIp.includes(q) ||
        String(f.dstPort).includes(q) ||
        f.finalClass.toLowerCase().includes(q) ||
        f.decisionPath.toLowerCase().includes(q);

      const matchesClass =
        filterClass === 'ALL' ||
        (filterClass === 'ATTACKS_ONLY' && f.finalClass !== 'BENIGN') ||
        (filterClass === 'ESCALATED_ONLY' && f.escalatedToAnomaly) ||
        (filterClass === 'ANOMALY_ONLY' && f.isAnomaly) ||
        f.finalClass === filterClass;

      const matchesThreat = filterThreat === 'ALL' || f.threatLevel === filterThreat;

      return matchesQuery && matchesClass && matchesThreat;
    });
  }, [flows, search, filterClass, filterThreat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPageFlows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <section className="p-5 md:p-6 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-xl flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
          <TableIcon className="w-4 h-4 text-cyan-400" />
          <span>500-Batch Network Flow Explorer</span>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus-within:border-cyan-500 max-w-sm w-full">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by IP, Port, ID, Class, Decision..."
            className="bg-transparent border-none outline-none text-xs text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Filter Controls & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setPage(1);
            }}
            className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-2.5 py-1.5 font-medium cursor-pointer"
          >
            <option value="ALL">All Classes</option>
            <option value="ATTACKS_ONLY">Attacks & Anomalies Only</option>
            <option value="ESCALATED_ONLY">Escalated to Autoencoder Only</option>
            <option value="ANOMALY_ONLY">Verified Anomalies Only</option>
            <option value="BENIGN">BENIGN (Normal)</option>
            <option value="DDoS">DDoS</option>
            <option value="PortScan">PortScan</option>
            <option value="DoS Hulk">DoS Hulk</option>
            <option value="DoS GoldenEye">DoS GoldenEye</option>
            <option value="DoS slowloris">DoS slowloris</option>
            <option value="Web Attack - Sql Injection">Web SQLi</option>
            <option value="Web Attack - XSS">Web XSS</option>
            <option value="Web Attack - Brute Force">Web Brute Force</option>
            <option value="FTP-Patator">FTP-Patator</option>
            <option value="SSH-Patator">SSH-Patator</option>
            <option value="Zero-Day Anomaly">Zero-Day Anomaly</option>
          </select>

          {/* Threat Level Filter */}
          <select
            value={filterThreat}
            onChange={(e) => {
              setFilterThreat(e.target.value as ThreatLevel | 'ALL');
              setPage(1);
            }}
            className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-2.5 py-1.5 font-medium cursor-pointer"
          >
            <option value="ALL">All Threats</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Safe">Safe</option>
          </select>

          {/* Export Buttons */}
          <button
            onClick={onExportJson}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] cursor-pointer"
            title="Export Batch Report as JSON"
          >
            <Download className="w-3 h-3" /> JSON
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] cursor-pointer"
            title="Export Batch Flows as CSV"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="bg-[var(--bg-surface)] text-[var(--text-secondary)] uppercase text-[10px] tracking-wider font-semibold border-b border-[var(--border-color)]">
              <th className="py-3 px-3.5 whitespace-nowrap">Flow ID</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Time</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Source IP:Port</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Destination IP:Port</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Protocol</th>
              <th className="py-3 px-3.5 whitespace-nowrap">AI Detection Result</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Confidence</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Cascade Decision Path</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Threat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] font-mono text-[11px]">
            {currentPageFlows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-xs font-sans text-[var(--text-muted)]">
                  No network flows matching current search or filters.
                </td>
              </tr>
            ) : (
              currentPageFlows.map((flow) => {
                const color = CLASS_COLORS[flow.finalClass] || '#94a3b8';
                return (
                  <tr
                    key={flow.flowId}
                    onClick={() => onSelectFlow(flow)}
                    className={`cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)] ${
                      flow.finalClass !== 'BENIGN' ? 'bg-rose-500/[0.03]' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3.5 font-bold text-cyan-400 whitespace-nowrap">
                      {flow.flowId}
                    </td>
                    <td className="py-2.5 px-3.5 text-[var(--text-secondary)] whitespace-nowrap font-mono text-[10px]">
                      {flow.timestamp}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {flow.srcIp}:{flow.srcPort}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-bold text-[var(--text-primary)]">
                      {flow.dstIp}:{flow.dstPort}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-[10px] uppercase font-bold text-cyan-400 font-sans">
                        {flow.protocol}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-sans">
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                        style={{ borderColor: color, color: color, backgroundColor: `${color}15` }}
                      >
                        {flow.finalClass}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-[var(--bg-input)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${flow.confidenceScore}%`, backgroundColor: flow.severityColor }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-primary)] font-mono">
                          {flow.confidenceScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-sans">
                      {flow.escalatedToAnomaly ? (
                        flow.isAnomaly ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Autoencoder High MSE
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            Autoencoder Normal
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-500/15 text-[var(--text-secondary)]">
                          Direct Multiclass
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-sans">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                        style={{
                          borderColor: flow.severityColor,
                          color: flow.severityColor,
                          backgroundColor: `${flow.severityColor}18`
                        }}
                      >
                        {flow.threatLevel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-1">
        <span>
          Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length} flows
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span className="text-xs font-mono font-bold text-[var(--text-primary)] px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
