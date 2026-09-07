from __future__ import annotations

import csv
import io
import os
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from scapy.all import AsyncSniffer, IP, TCP, UDP, get_if_list
from scapy.config import conf

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / 'autoencoder_ids_model.pt'
SCALER_PATH = ROOT / 'autoencoder_scaler.pkl'
BATCH_SIZE = 500
DEFAULT_THRESHOLD = float(os.getenv('ANOMALY_THRESHOLD', '0.155269'))


class Autoencoder(nn.Module):
    def __init__(self, input_dim: int) -> None:
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 64), nn.ReLU(),
            nn.Linear(64, 32), nn.ReLU(),
            nn.Linear(32, 16), nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.Linear(16, 32), nn.ReLU(),
            nn.Linear(32, 64), nn.ReLU(),
            nn.Linear(64, input_dim),
        )

    def forward(self, values: torch.Tensor) -> torch.Tensor:
        return self.decoder(self.encoder(values))


class StartRequest(BaseModel):
    interface: str | None = None
    capture_filter: str | None = None


class ThresholdRequest(BaseModel):
    threshold: float


@dataclass
class FlowStats:
    flow_id: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    first_seen: float
    last_seen: float
    packet_times: list[float] = field(default_factory=list)
    fwd_lengths: list[float] = field(default_factory=list)
    bwd_lengths: list[float] = field(default_factory=list)
    fwd_iats: list[float] = field(default_factory=list)
    bwd_iats: list[float] = field(default_factory=list)
    flags: defaultdict[str, int] = field(default_factory=lambda: defaultdict(int))
    active_times: list[float] = field(default_factory=list)
    idle_times: list[float] = field(default_factory=list)
    total_packets: int = 0
    total_bytes: int = 0
    fwd_last_seen: float | None = None
    bwd_last_seen: float | None = None

    def add(self, timestamp: float, length: int, forward: bool, flags: str = '') -> None:
        self.last_seen = timestamp
        self.packet_times.append(timestamp)
        self.total_packets += 1
        self.total_bytes += length
        target = self.fwd_lengths if forward else self.bwd_lengths
        iats = self.fwd_iats if forward else self.bwd_iats
        last_seen = self.fwd_last_seen if forward else self.bwd_last_seen
        target.append(float(length))
        if last_seen is not None:
            iats.append(max(0.0, timestamp - last_seen) * 1_000_000)
        if forward:
            self.fwd_last_seen = timestamp
        else:
            self.bwd_last_seen = timestamp
        for flag in ('F', 'S', 'R', 'P', 'A', 'U', 'C', 'E'):
            if flag in flags:
                self.flags[flag] += 1

    @staticmethod
    def _stats(values: list[float]) -> tuple[float, float, float, float]:
        if not values:
            return 0.0, 0.0, 0.0, 0.0
        array = np.asarray(values, dtype=np.float64)
        return float(array.mean()), float(array.std()), float(array.max()), float(array.min())

    def features(self) -> dict[str, float]:
        duration = max(0.0, (self.last_seen - self.first_seen) * 1_000_000)
        all_lengths = self.fwd_lengths + self.bwd_lengths
        all_iats = self.fwd_iats + self.bwd_iats
        fwd_mean, fwd_std, fwd_max, fwd_min = self._stats(self.fwd_lengths)
        bwd_mean, bwd_std, bwd_max, bwd_min = self._stats(self.bwd_lengths)
        packet_mean, packet_std, packet_max, packet_min = self._stats(all_lengths)
        iat_mean, iat_std, iat_max, iat_min = self._stats(all_iats)
        fwd_iat_mean, fwd_iat_std, fwd_iat_max, fwd_iat_min = self._stats(self.fwd_iats)
        bwd_iat_mean, bwd_iat_std, bwd_iat_max, bwd_iat_min = self._stats(self.bwd_iats)
        active_mean, active_std, active_max, active_min = self._stats(self.active_times)
        idle_mean, idle_std, idle_max, idle_min = self._stats(self.idle_times)
        seconds = max(duration / 1_000_000, 1e-6)
        fwd_packets = len(self.fwd_lengths)
        bwd_packets = len(self.bwd_lengths)
        fwd_bytes = float(sum(self.fwd_lengths))
        bwd_bytes = float(sum(self.bwd_lengths))
        down_up = bwd_packets / max(fwd_packets, 1)
        return {
            'Flow Duration': duration,
            'Total Fwd Packets': fwd_packets,
            'Total Backward Packets': bwd_packets,
            'Total Length of Fwd Packets': fwd_bytes,
            'Total Length of Bwd Packets': bwd_bytes,
            'Fwd Packet Length Max': fwd_max,
            'Fwd Packet Length Min': fwd_min,
            'Fwd Packet Length Mean': fwd_mean,
            'Fwd Packet Length Std': fwd_std,
            'Bwd Packet Length Max': bwd_max,
            'Bwd Packet Length Min': bwd_min,
            'Bwd Packet Length Mean': bwd_mean,
            'Bwd Packet Length Std': bwd_std,
            'Flow Bytes/s': self.total_bytes / seconds,
            'Flow Packets/s': self.total_packets / seconds,
            'Flow IAT Mean': iat_mean,
            'Flow IAT Std': iat_std,
            'Flow IAT Max': iat_max,
            'Flow IAT Min': iat_min,
            'Fwd IAT Total': sum(self.fwd_iats),
            'Fwd IAT Mean': fwd_iat_mean,
            'Fwd IAT Std': fwd_iat_std,
            'Fwd IAT Max': fwd_iat_max,
            'Fwd IAT Min': fwd_iat_min,
            'Bwd IAT Total': sum(self.bwd_iats),
            'Bwd IAT Mean': bwd_iat_mean,
            'Bwd IAT Std': bwd_iat_std,
            'Bwd IAT Max': bwd_iat_max,
            'Bwd IAT Min': bwd_iat_min,
            'Fwd PSH Flags': self.flags['P'] if fwd_packets else 0,
            'Bwd PSH Flags': 0,
            'Fwd URG Flags': self.flags['U'] if fwd_packets else 0,
            'Bwd URG Flags': 0,
            'Fwd Header Length': fwd_packets * 20,
            'Bwd Header Length': bwd_packets * 20,
            'Fwd Packets/s': fwd_packets / seconds,
            'Bwd Packets/s': bwd_packets / seconds,
            'Min Packet Length': packet_min,
            'Max Packet Length': packet_max,
            'Packet Length Mean': packet_mean,
            'Packet Length Std': packet_std,
            'Packet Length Variance': packet_std ** 2,
            'FIN Flag Count': self.flags['F'],
            'SYN Flag Count': self.flags['S'],
            'RST Flag Count': self.flags['R'],
            'PSH Flag Count': self.flags['P'],
            'ACK Flag Count': self.flags['A'],
            'URG Flag Count': self.flags['U'],
            'CWE Flag Count': self.flags['C'],
            'ECE Flag Count': self.flags['E'],
            'Down/Up Ratio': down_up,
            'Average Packet Size': packet_mean,
            'Avg Fwd Segment Size': fwd_mean,
            'Avg Bwd Segment Size': bwd_mean,
            'Fwd Avg Bytes/Bulk': fwd_mean,
            'Fwd Avg Packets/Bulk': float(fwd_packets),
            'Fwd Avg Bulk Rate': fwd_bytes / seconds,
            'Bwd Avg Bytes/Bulk': bwd_mean,
            'Bwd Avg Packets/Bulk': float(bwd_packets),
            'Bwd Avg Bulk Rate': bwd_bytes / seconds,
            'Subflow Fwd Packets': fwd_packets,
            'Subflow Fwd Bytes': fwd_bytes,
            'Subflow Bwd Packets': bwd_packets,
            'Subflow Bwd Bytes': bwd_bytes,
            'act_data_pkt_fwd': fwd_packets,
            'min_seg_size_forward': fwd_min,
            'Active Mean': active_mean,
            'Active Std': active_std,
            'Active Max': active_max,
            'Active Min': active_min,
            'Idle Mean': idle_mean,
            'Idle Std': idle_std,
            'Idle Max': idle_max,
            'Idle Min': idle_min,
        }


class CaptureController:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.sniffer: AsyncSniffer | None = None
        self.interface: str | None = None
        self.capture_filter: str | None = None
        self.started_at: float | None = None
        self.packet_count = 0
        self.total_bytes = 0
        self.batch_number = 0
        self.current_batch_packets = 0
        self.flows: dict[tuple[Any, ...], FlowStats] = {}
        self.completed: deque[dict[str, Any]] = deque(maxlen=5000)
        self.batches: deque[dict[str, Any]] = deque(maxlen=100)
        self.error: str | None = None
        self.threshold = DEFAULT_THRESHOLD
        self.scaler = joblib.load(SCALER_PATH)
        self.model = Autoencoder(len(self.scaler.feature_names_in_))
        self.model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
        self.model.eval()

    def start(self, interface: str | None, capture_filter: str | None) -> None:
        self.stop()
        if os.name == 'nt' and not conf.use_pcap:
            self.error = 'Npcap with WinPcap-compatible mode is required for Windows packet capture'
            raise RuntimeError(self.error)
        self.interface = interface or os.getenv('CAPTURE_INTERFACE')
        self.capture_filter = capture_filter or None
        self.error = None
        self.packet_count = 0
        self.total_bytes = 0
        self.current_batch_packets = 0
        self.batch_number = 0
        self.flows.clear()
        self.completed.clear()
        self.batches.clear()
        self.started_at = time.time()
        try:
            self.sniffer = AsyncSniffer(
                iface=self.interface,
                filter=self.capture_filter,
                prn=self.on_packet,
                store=False,
            )
            self.sniffer.start()
        except Exception as exc:
            self.error = str(exc)
            self.sniffer = None
            raise

    def stop(self) -> None:
        if self.sniffer is not None:
            self.sniffer.stop()
            self.sniffer = None

    def on_packet(self, packet: Any) -> None:
        if IP not in packet:
            return
        now = float(getattr(packet, 'time', time.time()))
        ip = packet[IP]
        protocol = 'TCP' if TCP in packet else 'UDP' if UDP in packet else str(ip.proto)
        transport = packet[TCP] if TCP in packet else packet[UDP] if UDP in packet else None
        src_port = int(getattr(transport, 'sport', 0))
        dst_port = int(getattr(transport, 'dport', 0))
        flags = str(getattr(transport, 'flags', '')) if transport is not None else ''
        key = (ip.src, src_port, ip.dst, dst_port, protocol)
        reverse_key = (ip.dst, dst_port, ip.src, src_port, protocol)
        length = int(len(packet))
        with self.lock:
            flow = self.flows.get(key)
            forward = True
            if flow is None:
                flow = self.flows.get(reverse_key)
                forward = False
            if flow is None:
                flow = FlowStats(
                    flow_id=f'LIVE-{self.packet_count + 1:08d}',
                    src_ip=ip.src,
                    dst_ip=ip.dst,
                    src_port=src_port,
                    dst_port=dst_port,
                    protocol=protocol,
                    first_seen=now,
                    last_seen=now,
                )
                self.flows[key] = flow
            flow.add(now, length, forward, flags)
            self.packet_count += 1
            self.total_bytes += length
            self.current_batch_packets += 1
            if self.current_batch_packets >= BATCH_SIZE:
                self.finish_batch()
                self.current_batch_packets = 0

    def score_flow(self, flow: FlowStats, batch_number: int) -> dict[str, Any]:
        values = flow.features()
        ordered = pd.DataFrame([[values[name] for name in self.scaler.feature_names_in_]], columns=self.scaler.feature_names_in_)
        scaled = self.scaler.transform(ordered).astype(np.float32)
        with torch.no_grad():
            tensor = torch.from_numpy(scaled)
            reconstructed = self.model(tensor).numpy()
        mse = float(np.mean(np.square(scaled - reconstructed)))
        is_anomaly = mse >= self.threshold
        score = min(1.0, mse / max(self.threshold * 2.5, 1e-9))
        return {
            'flowId': flow.flow_id,
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S', time.localtime(flow.last_seen)),
            'srcIp': flow.src_ip,
            'srcPort': flow.src_port,
            'dstIp': flow.dst_ip,
            'dstPort': flow.dst_port,
            'protocol': flow.protocol,
            'packetCount': flow.total_packets,
            'byteRateKB': round(values['Flow Bytes/s'] / 1024, 2),
            'anomalyMSE': round(mse, 6),
            'anomalyScore': round(score * 100, 1),
            'isAnomaly': is_anomaly,
            'threatLevel': 'Critical' if score > 0.8 else 'High' if is_anomaly else 'Safe',
            'batchNumber': batch_number,
        }

    def finish_batch(self) -> None:
        self.batch_number += 1
        touched = sorted(self.flows.values(), key=lambda flow: flow.last_seen)[-BATCH_SIZE:]
        results = [self.score_flow(flow, self.batch_number) for flow in touched]
        anomaly_count = sum(1 for result in results if result['isAnomaly'])
        report = {
            'batchNumber': self.batch_number,
            'timestamp': time.strftime('%H:%M:%S'),
            'totalFlows': len(results),
            'anomalyCount': anomaly_count,
            'attackCount': anomaly_count,
            'benignCount': len(results) - anomaly_count,
            'attackRate': round(anomaly_count / max(len(results), 1) * 100, 1),
            'avgMSE': round(sum(result['anomalyMSE'] for result in results) / max(len(results), 1), 6),
            'anomalyThreshold': self.threshold,
            'flowResults': results,
        }
        self.batches.append(report)
        self.completed.extend(results)

    def filtered(self, src_ip: str | None, dst_ip: str | None, protocol: str | None, port: int | None, anomaly: bool | None) -> list[dict[str, Any]]:
        results = list(self.completed)
        if src_ip:
            results = [item for item in results if src_ip in item['srcIp']]
        if dst_ip:
            results = [item for item in results if dst_ip in item['dstIp']]
        if protocol:
            results = [item for item in results if item['protocol'].lower() == protocol.lower()]
        if port is not None:
            results = [item for item in results if item['srcPort'] == port or item['dstPort'] == port]
        if anomaly is not None:
            results = [item for item in results if item['isAnomaly'] == anomaly]
        return list(reversed(results))


controller = CaptureController()
app = FastAPI(title='AI-NIDS Local Capture Service')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://localhost:3001'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def status_payload() -> dict[str, Any]:
    return {
        'running': controller.sniffer is not None,
        'interface': controller.interface,
        'captureFilter': controller.capture_filter,
        'packetCount': controller.packet_count,
        'totalBytes': controller.total_bytes,
        'batchNumber': controller.batch_number,
        'currentBatchPackets': controller.current_batch_packets,
        'error': controller.error,
        'interfaces': get_if_list(),
        'captureBackend': 'libpcap' if conf.use_pcap else 'native',
    }


@app.get('/api/capture/status')
def capture_status() -> dict[str, Any]:
    return status_payload()


@app.post('/api/capture/start')
def capture_start(request: StartRequest) -> dict[str, Any]:
    try:
        controller.start(request.interface, request.capture_filter)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f'Packet capture could not start: {exc}') from exc
    return status_payload()


@app.post('/api/capture/stop')
def capture_stop() -> dict[str, Any]:
    controller.stop()
    return status_payload()


@app.post('/api/model/threshold')
def set_threshold(request: ThresholdRequest) -> dict[str, float]:
    controller.threshold = max(0.001, request.threshold)
    return {'threshold': controller.threshold}


@app.get('/api/live-flows')
def live_flows(
    src_ip: str | None = None,
    dst_ip: str | None = None,
    protocol: str | None = None,
    port: int | None = None,
    anomaly: bool | None = None,
    limit: int = Query(100, ge=1, le=1000),
) -> dict[str, Any]:
    results = controller.filtered(src_ip, dst_ip, protocol, port, anomaly)[:limit]
    batches = list(reversed(controller.batches))
    packets_per_sec = 0.0
    if controller.started_at is not None:
        packets_per_sec = controller.packet_count / max(time.time() - controller.started_at, 1)
    return {
        'flows': results,
        'batches': batches,
        'packetsPerSec': round(packets_per_sec, 1),
        'bandwidthKB': round(controller.total_bytes / max(time.time() - (controller.started_at or time.time()), 1) / 1024, 1),
        'totalPackets': controller.packet_count,
        'status': status_payload(),
    }


@app.get('/api/export.csv')
def export_csv(
    src_ip: str | None = None,
    dst_ip: str | None = None,
    protocol: str | None = None,
    port: int | None = None,
    anomaly: bool | None = None,
) -> StreamingResponse:
    results = controller.filtered(src_ip, dst_ip, protocol, port, anomaly)
    output = io.StringIO()
    if results:
        writer = csv.DictWriter(output, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)
    else:
        output.write('flowId,timestamp,srcIp,srcPort,dstIp,dstPort,protocol,packetCount,byteRateKB,anomalyMSE,anomalyScore,isAnomaly,threatLevel,batchNumber\n')
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv', headers={'Content-Disposition': 'attachment; filename=ai_nids_live_flows.csv'})


@app.get('/api/interfaces')
def interfaces() -> dict[str, list[str]]:
    return {'interfaces': get_if_list()}
