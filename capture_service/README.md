# Local Capture Service

This service captures real Windows packets with Scapy, builds 74 CICFlowMeter-compatible features, scores each completed 500-packet batch with `autoencoder_ids_model.pt` and `autoencoder_scaler.pkl`, and serves filtered flow results to the UI.

## Windows prerequisite

Install Npcap from https://npcap.com/ with **WinPcap API-compatible mode** enabled. Run the service from an elevated terminal if the adapter requires it.

## Run

```powershell
Set-Location D:\dulith_doc\peojects\AI_NIDS
& 'C:\Users\Dulith Kavinda\miniconda3\envs\intel_py310\python.exe' -m uvicorn capture_service.server:app --host 127.0.0.1 --port 8000
```

The UI connects to `http://127.0.0.1:8000` by default. Override it with `NEXT_PUBLIC_CAPTURE_API_URL` when needed.

Endpoints:

- `POST /api/capture/start` starts the local adapter capture.
- `POST /api/capture/stop` stops capture.
- `GET /api/live-flows` returns model-scored flows and batch history. It supports `src_ip`, `dst_ip`, `protocol`, `port`, and `anomaly` filters.
- `GET /api/export.csv` downloads the filtered flow results.
