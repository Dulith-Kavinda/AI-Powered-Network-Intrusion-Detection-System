export type ThreatLevel = 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';

export interface EvaluatedFlow {
  flowId: string;
  timestamp: string;
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  protocol: string;
  packetCount: number;
  byteRateKB: number;
  anomalyMSE: number;
  anomalyScore: number;
  isAnomaly: boolean;
  threatLevel: ThreatLevel;
  batchNumber: number;
}

export interface BatchReport {
  batchNumber: number;
  timestamp: string;
  totalFlows: number;
  anomalyCount: number;
  attackCount: number;
  benignCount: number;
  attackRate: number;
  avgMSE: number;
  anomalyThreshold: number;
  flowResults: EvaluatedFlow[];
}

export interface CaptureStatus {
  running: boolean;
  interface: string | null;
  captureFilter: string | null;
  packetCount: number;
  totalBytes: number;
  batchNumber: number;
  currentBatchPackets: number;
  error: string | null;
  interfaces: string[];
}

export interface LiveCapturePayload {
  flows: EvaluatedFlow[];
  batches: BatchReport[];
  packetsPerSec: number;
  bandwidthKB: number;
  totalPackets: number;
  status: CaptureStatus;
}
