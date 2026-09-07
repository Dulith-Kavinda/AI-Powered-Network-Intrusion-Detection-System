'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopNav } from '@/components/TopNav';
import { TelemetryGrid } from '@/components/TelemetryGrid';
import { CascadePipelineHub } from '@/components/CascadePipelineHub';
import { ChartsSection } from '@/components/ChartsSection';
import { FlowTable } from '@/components/FlowTable';
import { FlowModal } from '@/components/FlowModal';
import { trafficSimulator } from '@/lib/trafficSimulator';
import { aiCascadeEngine, DEFAULT_CONFIDENCE_THRESHOLD, DEFAULT_ANOMALY_THRESHOLD } from '@/lib/aiEngine';
import { RawFlowFeatures, EvaluatedFlow, BatchReport, TrafficScenario } from '@/types/nids';

export default function NIDSDashboard() {
  // App Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Simulation & Stream State
  const [isStreaming, setIsStreaming] = useState(false);
  const [scenario, setScenario] = useState<TrafficScenario>('mixed');
  const [speed, setSpeed] = useState(5);

  // Flow Buffer & History
  const [buffer, setBuffer] = useState<RawFlowFeatures[]>([]);
  const [batchHistory, setBatchHistory] = useState<BatchReport[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  // Live Metrics
  const [packetsPerSec, setPacketsPerSec] = useState(0);
  const [bandwidthKB, setBandwidthKB] = useState(0);
  const [totalPackets, setTotalPackets] = useState(0);
  const [throughputHistory, setThroughputHistory] = useState<{
    labels: string[];
    packets: number[];
    bandwidthKB: number[];
  }>({
    labels: [],
    packets: [],
    bandwidthKB: []
  });
  const [tickerFlows, setTickerFlows] = useState<RawFlowFeatures[]>([]);

  // Thresholds
  const [confThreshold, setConfThreshold] = useState(DEFAULT_CONFIDENCE_THRESHOLD);
  const [anomalyThreshold, setAnomalyThreshold] = useState(DEFAULT_ANOMALY_THRESHOLD);

  // Selected Modal Flow
  const [selectedFlow, setSelectedFlow] = useState<EvaluatedFlow | null>(null);

  // Active batch report
  const activeBatchReport = batchHistory[activeBatchIndex] || null;

  // Refs for loop
  const bufferRef = useRef<RawFlowFeatures[]>([]);
  bufferRef.current = buffer;
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const totalPacketsRef = useRef(totalPackets);
  totalPacketsRef.current = totalPackets;

  // Execute 500 batch AI
  const executeBatchAnalysis = useCallback(
    (flowsToAnalyze: RawFlowFeatures[]) => {
      const batchNum = batchHistory.length + 1;
      const report = aiCascadeEngine.evaluateBatch(flowsToAnalyze, batchNum);

      setBatchHistory((prev) => [report, ...prev]);
      setActiveBatchIndex(0);
    },
    [batchHistory.length]
  );

  // Instant trigger
  const handleAnalyzeBatchNow = useCallback(() => {
    const freshBatch = trafficSimulator.generateBatch(500, scenarioRef.current);
    executeBatchAnalysis(freshBatch);
  }, [executeBatchAnalysis]);

  // Start initial batch on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem('nids-theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Run initial batch
    const initialBatch = trafficSimulator.generateBatch(500, 'mixed');
    const initialReport = aiCascadeEngine.evaluateBatch(initialBatch, 1);
    setBatchHistory([initialReport]);
  }, []);

  // Theme toggle
  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('nids-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Stream ticker loop (runs when isStreaming is true)
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const count = speedRef.current;
      const newFlows: RawFlowFeatures[] = [];
      let deltaPackets = 0;
      let deltaBytes = 0;

      for (let i = 0; i < count; i++) {
        const flow = trafficSimulator.generateFlow(scenarioRef.current);
        newFlows.push(flow);

        const pkts = flow.total_fwd_packets + flow.total_bwd_packets;
        const bytes = flow.total_length_fwd_packets + flow.total_length_bwd_packets;
        deltaPackets += pkts;
        deltaBytes += bytes;
      }

      setTotalPackets((prev) => prev + deltaPackets);
      setPacketsPerSec(Math.round(deltaPackets * 5));
      setBandwidthKB(parseFloat(((deltaBytes * 5) / 1024).toFixed(1)));

      setTickerFlows((prev) => [...newFlows.reverse(), ...prev].slice(0, 30));

      const updatedBuffer = [...bufferRef.current, ...newFlows];
      if (updatedBuffer.length >= 500) {
        const batchToAnalyze = updatedBuffer.slice(0, 500);
        setBuffer(updatedBuffer.slice(500));
        executeBatchAnalysis(batchToAnalyze);
      } else {
        setBuffer(updatedBuffer);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isStreaming, executeBatchAnalysis]);

  // Throughput history recorder (1s tick)
  useEffect(() => {
    const interval = setInterval(() => {
      const timeStr = new Date().toTimeString().split(' ')[0];
      setThroughputHistory((prev) => {
        const labels = [...prev.labels, timeStr].slice(-20);
        const pkts = [...prev.packets, packetsPerSec].slice(-20);
        const bw = [...prev.bandwidthKB, bandwidthKB].slice(-20);
        return { labels, packets: pkts, bandwidthKB: bw };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [packetsPerSec, bandwidthKB]);

  // Export JSON
  const handleExportJson = () => {
    if (!activeBatchReport) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeBatchReport, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `ai_nids_batch_${activeBatchReport.batchNumber}.json`);
    dl.click();
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!activeBatchReport) return;
    const flows = activeBatchReport.flowResults;
    const headers = ['flow_id', 'timestamp', 'src_ip', 'src_port', 'dst_ip', 'dst_port', 'protocol', 'final_class', 'confidence', 'escalated_to_anomaly', 'anomaly_mse', 'threat_level'];
    let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';

    flows.forEach((f) => {
      const row = [f.flowId, f.timestamp, f.srcIp, f.srcPort, f.dstIp, f.dstPort, f.protocol, `"${f.finalClass}"`, f.confidenceScore, f.escalatedToAnomaly, f.anomalyMSE || '', f.threatLevel];
      csvContent += row.join(',') + '\n';
    });

    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `ai_nids_batch_${activeBatchReport.batchNumber}.csv`);
    dl.click();
  };

  return (
    <main className="min-h-screen p-4 md:p-7 max-w-[1720px] mx-auto flex flex-col gap-5">
      {/* 1. Header & Top Controls */}
      <TopNav
        isStreaming={isStreaming}
        scenario={scenario}
        speed={speed}
        theme={theme}
        onStart={() => setIsStreaming(true)}
        onPause={() => setIsStreaming(false)}
        onReset={() => {
          setIsStreaming(false);
          setBuffer([]);
          setTotalPackets(0);
          setPacketsPerSec(0);
          setBandwidthKB(0);
        }}
        onAnalyzeBatch={handleAnalyzeBatchNow}
        onScenarioChange={(scen) => {
          setScenario(scen);
          trafficSimulator.setScenario(scen);
        }}
        onSpeedChange={setSpeed}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Telemetry & Speedometer Metrics */}
      <TelemetryGrid
        packetsPerSec={packetsPerSec}
        bandwidthKB={bandwidthKB}
        totalPackets={totalPackets}
        activeFlows={buffer.length}
        bufferCount={buffer.length}
        batchSize={500}
        batchRiskScore={activeBatchReport?.batchRiskScore ?? 0}
      />

      {/* 3. Cascade AI Pipeline Hub */}
      <CascadePipelineHub
        batchReport={activeBatchReport}
        batchHistory={batchHistory}
        confThreshold={confThreshold}
        anomalyThreshold={anomalyThreshold}
        onConfThresholdChange={(val) => {
          setConfThreshold(val);
          aiCascadeEngine.setConfidenceThreshold(val);
        }}
        onAnomalyThresholdChange={(val) => {
          setAnomalyThreshold(val);
          aiCascadeEngine.setAnomalyThreshold(val);
        }}
        onSelectBatchIndex={setActiveBatchIndex}
      />

      {/* 4. Interactive Charts Section */}
      <ChartsSection
        batchReport={activeBatchReport}
        throughputHistory={throughputHistory}
        tickerFlows={tickerFlows}
        theme={theme}
      />

      {/* 5. 500-Batch Network Flow Explorer Table */}
      <FlowTable
        flows={activeBatchReport?.flowResults || []}
        onSelectFlow={setSelectedFlow}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
      />

      {/* 6. Deep Flow Feature Modal Dialog */}
      <FlowModal flow={selectedFlow} onClose={() => setSelectedFlow(null)} />
    </main>
  );
}
