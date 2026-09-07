'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { TelemetryGrid } from '@/components/TelemetryGrid';
import { AutoencoderPanel } from '@/components/AutoencoderPanel';
import { BatchReport, CaptureStatus, EvaluatedFlow, LiveCapturePayload } from '@/types/nids';

const CAPTURE_API_BASE = process.env.NEXT_PUBLIC_CAPTURE_API_URL || 'http://127.0.0.1:8000';
const DEFAULT_STATUS: CaptureStatus = {
  running: false,
  interface: null,
  captureFilter: null,
  packetCount: 0,
  totalBytes: 0,
  batchNumber: 0,
  currentBatchPackets: 0,
  error: null,
  interfaces: [],
};

type CaptureState = 'offline' | 'connecting' | 'live';

export default function NIDSDashboard() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [captureState, setCaptureState] = useState<CaptureState>('offline');
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>(DEFAULT_STATUS);
  const [flows, setFlows] = useState<EvaluatedFlow[]>([]);
  const [batchHistory, setBatchHistory] = useState<BatchReport[]>([]);
  const [packetsPerSec, setPacketsPerSec] = useState(0);
  const [bandwidthKB, setBandwidthKB] = useState(0);
  const [anomalyThreshold, setAnomalyThreshold] = useState(0.155269);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [srcFilter, setSrcFilter] = useState('');
  const [dstFilter, setDstFilter] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('');
  const [portFilter, setPortFilter] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState('all');
  const filterQuery = useMemo(() => {
    const query = new URLSearchParams();
    if (srcFilter) query.set('src_ip', srcFilter);
    if (dstFilter) query.set('dst_ip', dstFilter);
    if (protocolFilter) query.set('protocol', protocolFilter);
    if (portFilter) query.set('port', portFilter);
    if (anomalyFilter !== 'all') query.set('anomaly', anomalyFilter);
    query.set('limit', '250');
    return query.toString();
  }, [anomalyFilter, dstFilter, portFilter, protocolFilter, srcFilter]);
  const activeBatchReport = batchHistory[activeBatchIndex] || null;
  const mountedRef = useRef(true);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('nids-theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateFromPayload = useCallback((payload: LiveCapturePayload) => {
    if (!mountedRef.current) return;
    setFlows(payload.flows || []);
    setBatchHistory(payload.batches || []);
    setCaptureStatus(payload.status || DEFAULT_STATUS);
    setPacketsPerSec(payload.packetsPerSec || 0);
    setBandwidthKB(payload.bandwidthKB || 0);
    if (payload.batches?.length) {
      setAnomalyThreshold(payload.batches[0].anomalyThreshold);
      setActiveBatchIndex(0);
    }
    setCaptureState(payload.status?.running ? 'live' : 'offline');
  }, []);

  const pollCapture = useCallback(async () => {
    const response = await fetch(`${CAPTURE_API_BASE}/api/live-flows?${filterQuery}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Capture service returned ${response.status}`);
    updateFromPayload(await response.json() as LiveCapturePayload);
  }, [filterQuery, updateFromPayload]);

  useEffect(() => {
    if (captureState !== 'live') return;
    const interval = setInterval(() => {
      void pollCapture().catch(() => setCaptureState('offline'));
    }, 1000);
    return () => clearInterval(interval);
  }, [captureState, pollCapture]);

  const handleStartCapture = useCallback(async () => {
    setCaptureState('connecting');
    try {
      const response = await fetch(`${CAPTURE_API_BASE}/api/capture/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Capture service unavailable');
      await pollCapture();
    } catch (error) {
      setCaptureStatus({ ...DEFAULT_STATUS, error: error instanceof Error ? error.message : 'Capture service unavailable' });
      setCaptureState('offline');
    }
  }, [pollCapture]);

  const handlePauseCapture = useCallback(async () => {
    await fetch(`${CAPTURE_API_BASE}/api/capture/stop`, { method: 'POST' }).catch(() => undefined);
    setCaptureState('offline');
  }, []);

  const handleReset = useCallback(() => {
    void handlePauseCapture();
    setFlows([]);
    setBatchHistory([]);
    setCaptureStatus(DEFAULT_STATUS);
    setActiveBatchIndex(0);
    setPacketsPerSec(0);
    setBandwidthKB(0);
  }, [handlePauseCapture]);

  const handleThresholdChange = useCallback(async (value: number) => {
    setAnomalyThreshold(value);
    await fetch(`${CAPTURE_API_BASE}/api/model/threshold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: value }),
    }).catch(() => undefined);
  }, []);

  const handleDownload = useCallback(() => {
    window.open(`${CAPTURE_API_BASE}/api/export.csv?${filterQuery}`, '_blank', 'noopener,noreferrer');
  }, [filterQuery]);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('nids-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1720px] flex-col gap-5 p-4 md:p-7">
      <TopNav
        captureState={captureState}
        theme={theme}
        onStart={handleStartCapture}
        onPause={handlePauseCapture}
        onReset={handleReset}
        onToggleTheme={handleToggleTheme}
      />

      {captureStatus.error && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          {captureStatus.error}. Install Npcap and run the capture service with the required permissions.
        </div>
      )}

      <TelemetryGrid
        packetsPerSec={packetsPerSec}
        bandwidthKB={bandwidthKB}
        totalPackets={captureStatus.packetCount}
        activeFlows={flows.length}
        bufferCount={captureStatus.currentBatchPackets}
        batchSize={500}
        anomalyCount={activeBatchReport?.anomalyCount ?? 0}
        anomalyTotal={activeBatchReport?.totalFlows ?? 0}
      />

      <AutoencoderPanel
        batchReport={activeBatchReport}
        batchHistory={batchHistory}
        anomalyThreshold={anomalyThreshold}
        onAnomalyThresholdChange={handleThresholdChange}
        onSelectBatchIndex={setActiveBatchIndex}
        flows={flows}
        filters={{ srcFilter, dstFilter, protocolFilter, portFilter, anomalyFilter }}
        onFilterChange={(name, value) => {
          if (name === 'srcFilter') setSrcFilter(value);
          if (name === 'dstFilter') setDstFilter(value);
          if (name === 'protocolFilter') setProtocolFilter(value);
          if (name === 'portFilter') setPortFilter(value);
          if (name === 'anomalyFilter') setAnomalyFilter(value);
        }}
        onDownload={handleDownload}
      />
    </main>
  );
}
