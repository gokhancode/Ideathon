export default function HowItWorks() {
  return (
    <div className="how-it-works">
      <section className="problem-section">
        <h2>The Problem</h2>
        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-stat">6,500+</div>
            <div className="problem-label">Noise complaints per year in Zurich</div>
            <div className="problem-source">Source: Zurich Municipal Police</div>
          </div>
          <div className="problem-card">
            <div className="problem-stat">55 / 45 dB</div>
            <div className="problem-label">Swiss legal noise limits (day/night residential)</div>
            <div className="problem-source">Source: Swiss Noise Abatement Ordinance (LSV)</div>
          </div>
          <div className="problem-card">
            <div className="problem-stat">~0</div>
            <div className="problem-label">Real-time hyperlocal noise monitoring points</div>
            <div className="problem-source">Current enforcement relies on sporadic inspections</div>
          </div>
        </div>
        <p className="problem-summary">
          Zurich has noise laws but no data to enforce them. Complaints are filed, inspectors show up days later,
          and the noise is gone. <strong>The city has rules without measurement.</strong>
        </p>
      </section>

      <section className="solution-section">
        <h2>The Solution: DeciMap</h2>
        <p>A DePIN (Decentralized Physical Infrastructure Network) on Solana that turns every phone into a noise sensor.</p>

        <div className="flow-diagram">
          <div className="flow-step">
            <div className="flow-num">1</div>
            <h3>Measure</h3>
            <p>Open the app, your phone microphone captures ambient noise levels (dB SPL) with GPS coordinates.</p>
          </div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">
            <div className="flow-num">2</div>
            <h3>Submit</h3>
            <p>Noise reading is submitted as a Solana transaction — immutable, timestamped, geotagged.</p>
          </div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">
            <div className="flow-num">3</div>
            <h3>Validate</h3>
            <p>Nearby reporters cross-reference readings. Outliers are flagged. Consensus determines truth.</p>
          </div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">
            <div className="flow-num">4</div>
            <h3>Earn</h3>
            <p>Valid reports earn SOL rewards. The more you contribute, the more you earn.</p>
          </div>
        </div>
      </section>

      <section className="why-solana-section">
        <h2>Why Solana?</h2>
        <div className="why-grid">
          <div className="why-card">
            <h3>Speed</h3>
            <p>400ms finality. Noise events are time-sensitive — stale data is useless.</p>
          </div>
          <div className="why-card">
            <h3>Cost</h3>
            <p>~$0.0005 per transaction. Makes micropayments for individual reports viable.</p>
          </div>
          <div className="why-card">
            <h3>DePIN Ecosystem</h3>
            <p>Helium, Hivemapper, Render — Solana is the DePIN chain. DeciMap fits the ecosystem.</p>
          </div>
          <div className="why-card">
            <h3>Compression</h3>
            <p>State compression for storing millions of reports cheaply — same tech as compressed NFTs.</p>
          </div>
        </div>
      </section>

      <section className="arch-section">
        <h2>Architecture</h2>
        <div className="arch-diagram">
          <pre>{`
  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
  │  Phone App  │────▶│ Solana       │────▶│  On-chain State  │
  │             │     │ Program      │     │                  │
  │ - Mic API   │     │ (Anchor)     │     │ - NoiseReport    │
  │ - GPS       │     │              │     │ - Zone           │
  │ - Wallet    │     │ - submit()   │     │ - ReporterProfile│
  └─────────────┘     │ - validate() │     └──────────────────┘
                      │ - reward()   │              │
                      └──────────────┘              │
                                                    ▼
                                           ┌──────────────────┐
                                           │  Data Consumers  │
                                           │                  │
                                           │ - City of Zurich │
                                           │ - Researchers    │
                                           │ - Urban planners │
                                           │ - Real estate    │
                                           └──────────────────┘
          `}</pre>
        </div>
      </section>

      <section className="security-section">
        <h2>Anti-Fraud &amp; Security</h2>
        <p style={{ color: "var(--text-dim)", marginBottom: 20, lineHeight: 1.6 }}>
          Crowdsourced data is only valuable if it's trustworthy. DeciMap implements multiple layers
          of on-chain and client-side fraud prevention.
        </p>
        <div className="security-grid">
          <div className="security-card">
            <div className="security-icon">&#128274;</div>
            <h3>Stake-to-Report</h3>
            <p>Reporters must stake <strong>0.01 SOL</strong> before submitting. Fraudulent reporters are slashed — making fake data economically irrational.</p>
          </div>
          <div className="security-card">
            <div className="security-icon">&#128101;</div>
            <h3>Cross-Validation</h3>
            <p>Every report needs <strong>2+ nearby reporters</strong> to confirm. A lone fake reading can't pass consensus. Validators are also staked.</p>
          </div>
          <div className="security-card">
            <div className="security-icon">&#9202;</div>
            <h3>Rate Limiting</h3>
            <p><strong>60-second cooldown</strong> per reporter per zone. Prevents spam flooding and makes bot attacks expensive (each report costs tx fees + time).</p>
          </div>
          <div className="security-card">
            <div className="security-icon">&#128200;</div>
            <h3>Outlier Detection</h3>
            <p>Readings <strong>&gt;30 dB from zone average</strong> are auto-flagged. Flagged reports require extra validation before rewards are paid.</p>
          </div>
          <div className="security-card">
            <div className="security-icon">&#128205;</div>
            <h3>GPS + Timestamp</h3>
            <p>Reports must include device GPS coordinates. Timestamps must be <strong>within 5 minutes</strong> of on-chain clock — prevents replaying old data.</p>
          </div>
          <div className="security-card">
            <div className="security-icon">&#127911;</div>
            <h3>Real Mic Only</h3>
            <p>Web Audio API captures actual microphone input — no manual dB entry. Echo cancellation and noise suppression <strong>disabled</strong> for raw readings.</p>
          </div>
        </div>

        <div className="security-future">
          <h3>Future Layers (Phase 2+)</h3>
          <ul>
            <li><strong>WiFi fingerprinting</strong> — verify location via nearby access point BSSIDs</li>
            <li><strong>Reputation decay</strong> — score degrades over time without consistent valid reports</li>
            <li><strong>Hardware attestation</strong> — dedicated sensors with secure enclaves sign readings at chip level</li>
            <li><strong>Statistical anomaly detection</strong> — ML model flags impossible readings (e.g., 30 dB at Zurich HB rush hour)</li>
          </ul>
        </div>
      </section>

      <section className="revenue-section">
        <h2>Business Model</h2>
        <div className="revenue-grid">
          <div className="revenue-card">
            <h3>B2G (City Contracts)</h3>
            <p>Sell aggregated, real-time noise data to municipal governments. Zurich already spends on noise monitoring — this replaces expensive fixed sensors with crowdsourced coverage.</p>
          </div>
          <div className="revenue-card">
            <h3>B2B (Real Estate)</h3>
            <p>Noise data is critical for property valuation. Real estate platforms and developers pay for historical noise profiles of locations.</p>
          </div>
          <div className="revenue-card">
            <h3>Protocol Fees</h3>
            <p>5% fee on data marketplace transactions. Flows to protocol treasury + stakers.</p>
          </div>
        </div>
      </section>

      <section className="roadmap-section">
        <h2>Roadmap</h2>
        <div className="roadmap">
          <div className="roadmap-phase active">
            <div className="phase-marker" />
            <div>
              <h3>Phase 1 — MVP (Now)</h3>
              <p>Phone-based noise capture, Solana program, map visualization, mock rewards</p>
            </div>
          </div>
          <div className="roadmap-phase">
            <div className="phase-marker" />
            <div>
              <h3>Phase 2 — Validation</h3>
              <p>Cross-reporter validation, reputation scoring, anti-fraud (spoofing detection)</p>
            </div>
          </div>
          <div className="roadmap-phase">
            <div className="phase-marker" />
            <div>
              <h3>Phase 3 — Data Marketplace</h3>
              <p>API for cities/businesses, subscription model, token governance for zone management</p>
            </div>
          </div>
          <div className="roadmap-phase">
            <div className="phase-marker" />
            <div>
              <h3>Phase 4 — Hardware</h3>
              <p>Dedicated low-cost sensor nodes (ESP32 + mic), LoRa mesh networking, 24/7 coverage</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
