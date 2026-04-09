# DeciMap — Decentralized Noise Monitoring on Solana

> **DePIN that turns every phone into a noise sensor. Crowdsourced, incentivized, on-chain.**

Built at Superteam Career Day Ideathon, ETH Zurich — April 2026.

---

## The Problem

**Zurich has noise laws but no data to enforce them.**

| Fact | Data | Source |
|------|------|--------|
| Noise complaints per year | **6,500+** (rising) | Zurich Municipal Police |
| Swiss legal limit (residential day/night) | **55 dB / 45 dB** | Swiss Noise Abatement Ordinance (LSV) |
| Real-time hyperlocal monitoring points | **~0** | Current system relies on sporadic inspections |
| Nighttime urban heat island effect | **+5-7°C** | MeteoSwiss |
| Residents citing noise as concern | **Growing** | City of Zurich surveys |

The current process: resident files complaint → inspector arrives days/weeks later → noise is gone → complaint is dismissed. **There is no persistent, real-time measurement.**

This is not unique to Zurich. Every city in the world faces the same problem. Swiss noise limits exist in law but are unenforceable without data.

---

## The Solution

**DeciMap** is a DePIN (Decentralized Physical Infrastructure Network) on Solana that crowdsources noise monitoring using smartphones.

### How It Works

```
1. MEASURE → Phone microphone captures ambient dB level + GPS coordinates
2. SUBMIT  → Noise reading submitted as a Solana transaction (immutable, timestamped, geotagged)
3. VALIDATE → Nearby reporters cross-reference readings. Outliers are flagged.
4. EARN    → Valid reports earn SOL rewards. More contributions = more earnings.
```

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Phone App  │────▶│ Solana       │────▶│  On-chain State  │
│             │     │ Program      │     │                  │
│ - Mic API   │     │ (Anchor)     │     │ - NoiseReport    │
│ - GPS       │     │              │     │ - Zone           │
│ - Wallet    │     │ - submit()   │     │ - ReporterProfile│
└─────────────┘     │ - validate() │     └──────────────────┘
                    │ - reward()   │              │
                    └──────────────┘              ▼
                                         ┌──────────────────┐
                                         │  Data Consumers  │
                                         │ - City of Zurich │
                                         │ - Researchers    │
                                         │ - Urban planners │
                                         │ - Real estate    │
                                         └──────────────────┘
```

---

## Why Solana?

| Feature | Why It Matters |
|---------|---------------|
| **400ms finality** | Noise events are time-sensitive — stale data is useless |
| **~$0.0005/tx** | Makes micropayments for individual reports viable |
| **State compression** | Store millions of reports cheaply (same tech as cNFTs) |
| **DePIN ecosystem** | Helium, Hivemapper, Render — Solana is the DePIN chain |

---

## On-Chain Program

Written in Anchor (Rust). Located in `programs/decimap/src/lib.rs`.

### Instructions

- **`create_zone`** — Define a monitoring zone (e.g., "Langstrasse", "ETH Campus")
- **`init_profile`** — Initialize a reporter profile (tracks contributions)
- **`submit_report`** — Submit a noise reading (dB, lat, lng, timestamp)
- **`claim_rewards`** — Claim SOL rewards based on validated report count

### Accounts

- **Zone** — Geographic monitoring area with running average dB
- **NoiseReport** — Individual reading (PDA seeded by zone + reporter + index)
- **ReporterProfile** — Tracks total reports and rewards claimed

---

## Demo App

Interactive React frontend with mock Zurich data. Located in `app/`.

### Features

- **Noise Map** — Dark-themed Leaflet map with real Zurich locations, color-coded noise markers, zone overlays
- **Dashboard** — Protocol stats, zone comparison table, token economics
- **Report Noise** — Simulated microphone measurement UI with dB meter
- **How It Works** — Full pitch: problem, solution, architecture, business model, roadmap

### Run locally

```bash
cd app
npm install
npm run dev
```

---

## Business Model

### Revenue Streams

1. **B2G (City Contracts)** — Sell aggregated, real-time noise data to municipal governments. Zurich already spends budget on noise monitoring — this replaces expensive fixed sensors with crowdsourced coverage at 100x lower cost.

2. **B2B (Real Estate)** — Noise data is critical for property valuation. Real estate platforms and developers pay for historical noise profiles of locations.

3. **Protocol Fees** — 5% fee on data marketplace transactions. Flows to protocol treasury + stakers.

### Token Economics

| Action | Reward |
|--------|--------|
| Submit verified noise reading | 0.001 SOL |
| Validate nearby report | 0.0005 SOL |
| Stake as validator | Earn share of data marketplace fees |

---

## Roadmap

- **Phase 1 — MVP** *(current)*: Phone-based noise capture, Solana program, map visualization
- **Phase 2 — Validation**: Cross-reporter validation, reputation scoring, anti-spoofing
- **Phase 3 — Data Marketplace**: API for cities/businesses, subscription model, token governance
- **Phase 4 — Hardware**: Dedicated low-cost sensor nodes (ESP32 + MEMS mic), LoRa mesh, 24/7 coverage

---

## Market Context

- DePIN on Solana hit **$2.6M monthly revenue** (Jan 2026) with **650+ active projects**
- Helium alone accounts for **60% of DePIN fees** — proving the model works
- Environmental monitoring remains **underserved** in DePIN — no dominant noise/air quality network exists
- Zurich is the **#1 Smart City** (IMD Index, 7 consecutive years) but lacks crowdsourced sensor infrastructure

---

## Tech Stack

- **Smart Contract**: Anchor (Rust) on Solana
- **Frontend**: React + TypeScript + Vite
- **Map**: Leaflet with CartoDB dark tiles
- **Noise Capture**: Web Audio API (AudioContext + AnalyserNode)
- **Geolocation**: Browser Geolocation API
- **Wallet**: Solana Wallet Adapter

---

## Team

Built at Superteam Career Day Ideathon, ETH Zurich.

## License

MIT
