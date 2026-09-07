'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { PieChart, GitFork, Activity, Radio } from 'lucide-react';
import { BatchReport, CLASS_COLORS, RawFlowFeatures } from '@/types/nids';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsSectionProps {
  batchReport: BatchReport | null;
  throughputHistory: { labels: string[]; packets: number[]; bandwidthKB: number[] };
  tickerFlows: RawFlowFeatures[];
  theme: 'dark' | 'light';
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  batchReport,
  throughputHistory,
  tickerFlows,
  theme,
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
  const surfaceBg = isDark ? '#1a2234' : '#ffffff';

  // 1. Threat Distribution Donut Data
  const threatDistData = useMemo(() => {
    if (!batchReport?.classCounts) {
      return {
        labels: ['BENIGN'],
        datasets: [{ data: [500], backgroundColor: ['#10b981'], borderColor: surfaceBg, borderWidth: 2 }]
      };
    }

    const labels = Object.keys(batchReport.classCounts);
    const data = Object.values(batchReport.classCounts);
    const bgColors = labels.map(lbl => CLASS_COLORS[lbl] || '#94a3b8');

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: bgColors,
          borderColor: surfaceBg,
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    };
  }, [batchReport, surfaceBg]);

  const threatDistOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          boxWidth: 10,
          padding: 12,
          font: { family: 'Inter', size: 10 }
        }
      }
    }
  };

  // 2. Cascade AI Routing Bar Data
  const cascadeRoutingData = useMemo(() => {
    if (!batchReport) {
      return {
        labels: ['Direct Benign', 'Direct Attack', 'Escalated', 'Anomaly Confirmed', 'Anomaly Cleared'],
        datasets: [{ data: [450, 0, 50, 0, 50], backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#ff0055', '#06b6d4'] }]
      };
    }

    const total = batchReport.totalFlows;
    const escalated = batchReport.escalatedCount;
    const direct = total - escalated;
    const anomalyConfirmed = batchReport.anomalyCount;
    const anomalyCleared = escalated - anomalyConfirmed;
    const directAttack = batchReport.attackCount - anomalyConfirmed;
    const directBenign = Math.max(0, direct - directAttack);

    return {
      labels: ['Direct Benign', 'Direct Attack', 'Escalated', 'Anomaly Confirmed', 'Anomaly Cleared'],
      datasets: [
        {
          label: 'Flow Count (out of 500)',
          data: [directBenign, directAttack, escalated, anomalyConfirmed, anomalyCleared],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(239, 68, 68, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(255, 0, 85, 0.9)',
            'rgba(6, 182, 212, 0.85)'
          ],
          borderRadius: 6
        }
      ]
    };
  }, [batchReport]);

  const cascadeRoutingOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
      },
      y: {
        grid: { display: false },
        ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // 3. Anomaly Autoencoder MSE Data
  const anomalyMSEData = useMemo(() => {
    const threshold = batchReport?.anomalyThreshold ?? 0.155269;
    const escalated = batchReport?.flowResults.filter(f => f.escalatedToAnomaly) || [];
    
    // If few or none escalated, generate sample scatter
    const points = escalated.length > 0 
      ? escalated.map((f, i) => ({ x: i + 1, y: f.anomalyMSE ?? 0.05 }))
      : Array.from({ length: 30 }, (_, i) => ({ x: i + 1, y: 0.03 + Math.random() * 0.08 }));

    const pointColors = points.map(p => (p.y > threshold ? '#ff0055' : '#10b981'));
    const pointRadii = points.map(p => (p.y > threshold ? 5 : 3));

    return {
      datasets: [
        {
          label: 'Reconstruction Error (MSE)',
          data: points,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: pointRadii,
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: `Anomaly Threshold (${threshold})`,
          data: [
            { x: 1, y: threshold },
            { x: points.length || 30, y: threshold }
          ],
          borderColor: '#ef4444',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [batchReport]);

  const anomalyMSEOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Inter', size: 10 } },
        min: 0,
        max: 0.55
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, boxWidth: 10, font: { size: 10 } }
      }
    }
  };

  // 4. Real-Time Throughput Line Data
  const throughputData = useMemo(() => {
    return {
      labels: throughputHistory.labels,
      datasets: [
        {
          label: 'Packets / sec',
          data: throughputHistory.packets,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Bandwidth (KB/s)',
          data: throughputHistory.bandwidthKB,
          borderColor: '#10b981',
          borderWidth: 2,
          borderDash: [3, 3],
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [throughputHistory]);

  const throughputOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
      },
      y: {
        type: 'linear',
        position: 'left',
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } }
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: textColor, font: { size: 10 } }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, boxWidth: 10, font: { size: 10 } }
      }
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Threat Classification (4 cols) */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex flex-col">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] mb-3">
          <PieChart className="w-4 h-4 text-cyan-400" /> Batch Threat Classification
        </div>
        <div className="relative h-60 w-full">
          <Doughnut data={threatDistData} options={threatDistOptions} />
        </div>
      </div>

      {/* 2. Cascade Decision Breakdown (4 cols) */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex flex-col">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] mb-3">
          <GitFork className="w-4 h-4 text-cyan-400" /> Cascade Decision Breakdown
        </div>
        <div className="relative h-60 w-full">
          <Bar data={cascadeRoutingData} options={cascadeRoutingOptions} />
        </div>
      </div>

      {/* 3. Autoencoder MSE Curve (4 cols) */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex flex-col">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] mb-3">
          <Activity className="w-4 h-4 text-cyan-400" /> Autoencoder MSE vs Anomaly Threshold
        </div>
        <div className="relative h-60 w-full">
          <Line data={anomalyMSEData} options={anomalyMSEOptions} />
        </div>
      </div>

      {/* 4. Live Throughput Timeline (8 cols) */}
      <div className="lg:col-span-8 p-5 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex flex-col">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] mb-3">
          <Activity className="w-4 h-4 text-cyan-400" /> Real-Time Traffic Throughput Timeline
        </div>
        <div className="relative h-48 w-full">
          <Line data={throughputData} options={throughputOptions} />
        </div>
      </div>

      {/* 5. Live Packet Sniffer Ticker Feed (4 cols) */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] shadow-md flex flex-col">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] mb-3">
          <Radio className="w-4 h-4 text-cyan-400" /> Live Packet Sniffer Feed
        </div>
        <div className="h-48 overflow-y-auto rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 flex flex-col gap-1.5 font-mono text-[11px]">
          {tickerFlows.length === 0 ? (
            <div className="text-[var(--text-muted)] text-center py-16 font-sans text-xs">
              Waiting for live packets...
            </div>
          ) : (
            tickerFlows.map((f, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border-l-2 ${
                  f.ground_truth_label !== 'BENIGN'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-200'
                    : 'border-emerald-500 text-[var(--text-primary)]'
                }`}
              >
                <span className="text-[10px] text-[var(--text-muted)]">{f.timestamp}</span>
                <span className="truncate max-w-[140px] text-[10px]">
                  {f.src_ip}:{f.src_port} &rarr; {f.dst_ip}:{f.dst_port}
                </span>
                <span className="text-[10px] uppercase font-bold text-cyan-400">{f.protocol}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                    f.is_zero_day
                      ? 'bg-rose-600 text-white'
                      : f.ground_truth_label !== 'BENIGN'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {f.is_zero_day ? 'Zero-Day' : f.ground_truth_label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
