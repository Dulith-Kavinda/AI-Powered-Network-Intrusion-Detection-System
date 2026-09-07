export type ThreatLevel = 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';

export type TrafficScenario = 
  | 'mixed' 
  | 'ddos_blitz' 
  | 'recon_probe' 
  | 'web_attack' 
  | 'zero_day_stealth' 
  | 'pure_benign';

export interface RawFlowFeatures {
  flow_id: string;
  timestamp: string;
  src_ip: string;
  src_port: number;
  dst_ip: string;
  dst_port: number;
  protocol: string;
  flow_duration: number;
  total_fwd_packets: number;
  total_bwd_packets: number;
  total_length_fwd_packets: number;
  total_length_bwd_packets: number;
  fwd_packet_length_max: number;
  fwd_packet_length_min: number;
  fwd_packet_length_mean: number;
  fwd_packet_length_std: number;
  bwd_packet_length_max: number;
  bwd_packet_length_min: number;
  flow_bytes_s: number;
  flow_packets_s: number;
  flow_iat_mean: number;
  flow_iat_std: number;
  flow_iat_max: number;
  flow_iat_min: number;
  fwd_iat_total: number;
  bwd_iat_total: number;
  fwd_header_length: number;
  bwd_header_length: number;
  fin_flag_count: number;
  syn_flag_count: number;
  rst_flag_count: number;
  psh_flag_count: number;
  ack_flag_count: number;
  urg_flag_count: number;
  init_win_bytes_forward: number;
  init_win_bytes_backward: number;
  act_data_pkt_fwd: number;
  min_seg_size_forward: number;
  active_mean: number;
  active_std: number;
  active_max: number;
  active_min: number;
  idle_mean: number;
  idle_std: number;
  idle_max: number;
  idle_min: number;
  ground_truth_label: string;
  is_zero_day?: boolean;
  web_attack_signature?: string | null;
}

export interface EvaluatedFlow {
  flowId: string;
  timestamp: string;
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  protocol: string;
  flowDurationMs: string;
  packetCount: number;
  byteRateKB: string;
  rawFeatures: RawFlowFeatures;
  
  // Multiclass predictions
  multiclassPrediction: string;
  multiclassConfidence: number;
  multiclassProbabilities: number[];
  
  // Cascade status
  escalatedToAnomaly: boolean;
  anomalyMSE: number | null;
  anomalyScore: number | null;
  isAnomaly: boolean;
  
  // Final Decision
  finalClass: string;
  confidenceScore: number;
  threatLevel: ThreatLevel;
  severityColor: string;
  decisionPath: string;
  reasoning: string;
}

export interface BatchReport {
  batchNumber: number;
  timestamp: string;
  durationMs: string;
  totalFlows: number;
  batchRiskScore: number;
  attackCount: number;
  benignCount: number;
  attackRate: number;
  escalatedCount: number;
  anomalyCount: number;
  avgMSE: number;
  anomalyThreshold: number;
  confidenceThreshold: number;
  classCounts: Record<string, number>;
  threatCounts: Record<ThreatLevel, number>;
  flowResults: EvaluatedFlow[];
}

export const AI_CLASSES = [
  'BENIGN',
  'Bot',
  'DDoS',
  'DoS GoldenEye',
  'DoS Hulk',
  'DoS Slowhttptest',
  'DoS slowloris',
  'FTP-Patator',
  'Heartbleed',
  'Infiltration',
  'PortScan',
  'SSH-Patator',
  'Web Attack - Brute Force',
  'Web Attack - Sql Injection',
  'Web Attack - XSS',
  'Zero-Day Anomaly'
] as const;

export const CLASS_COLORS: Record<string, string> = {
  'BENIGN': '#10b981',
  'Bot': '#ec4899',
  'DDoS': '#ef4444',
  'DoS GoldenEye': '#f97316',
  'DoS Hulk': '#dc2626',
  'DoS Slowhttptest': '#ea580c',
  'DoS slowloris': '#f59e0b',
  'FTP-Patator': '#8b5cf6',
  'Heartbleed': '#e11d48',
  'Infiltration': '#d946ef',
  'PortScan': '#3b82f6',
  'SSH-Patator': '#a855f7',
  'Web Attack - Brute Force': '#06b6d4',
  'Web Attack - Sql Injection': '#0284c7',
  'Web Attack - XSS': '#0d9488',
  'Zero-Day Anomaly': '#ff0055'
};
