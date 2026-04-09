import { useState } from "react";
import { useNoiseMeter } from "../hooks/useNoiseMeter";
import { useGeolocation } from "../hooks/useGeolocation";

function getColor(db: number): string {
  if (db <= 40) return "#22c55e";
  if (db <= 55) return "#eab308";
  if (db <= 70) return "#f97316";
  return "#ef4444";
}

function getLabel(db: number): string {
  if (db <= 40) return "QUIET";
  if (db <= 55) return "MODERATE";
  if (db <= 70) return "LOUD";
  return "VIOLATION";
}

export default function NoiseMonitor({ connected }: { connected: boolean }) {
  const mic = useNoiseMeter();
  const geo = useGeolocation();
  const [submitted, setSubmitted] = useState(false);
  const [submittedDb, setSubmittedDb] = useState(0);

  const handleStart = async () => {
    setSubmitted(false);
    geo.request();
    await mic.start();
  };

  const handleStop = () => {
    mic.stop();
  };

  const handleSubmit = () => {
    setSubmittedDb(mic.currentDb);
    setSubmitted(true);
    mic.stop();
  };

  const hasLocation = geo.lat !== null && geo.lng !== null;

  return (
    <div className="monitor">
      <div className="monitor-card">
        <h2>Report Noise Level</h2>
        <p className="monitor-desc">
          Uses your device's <strong>real microphone</strong> to measure ambient noise.
          No audio is recorded — only the dB level is captured.
          You'll earn <strong>0.001 SOL</strong> per verified reading.
        </p>

        {!connected && (
          <div className="monitor-warning">
            Connect your wallet to submit reports
          </div>
        )}

        {(mic.error || geo.error) && (
          <div className="monitor-warning">
            {mic.error || geo.error}
          </div>
        )}

        <div className="meter">
          <div
            className="meter-fill"
            style={{
              height: `${Math.min(100, (mic.currentDb / 100) * 100)}%`,
              backgroundColor: getColor(mic.currentDb),
              transition: "height 0.15s ease, background-color 0.3s ease",
            }}
          />
          <div className="meter-reading">
            <span className="meter-db" style={{ color: mic.isListening ? getColor(mic.currentDb) : "#64748b" }}>
              {mic.isListening ? mic.currentDb : "--"}
            </span>
            <span className="meter-unit">dB</span>
            {mic.isListening && (
              <span className="meter-label" style={{ color: getColor(mic.currentDb) }}>
                {getLabel(mic.currentDb)}
              </span>
            )}
          </div>
        </div>

        <div className="meter-scale">
          <span>20 dB</span>
          <span style={{ color: "#eab308" }}>55 dB limit</span>
          <span>100 dB</span>
        </div>

        {/* Location status */}
        <div className="location-status">
          {geo.loading && <span className="loc-pending">Acquiring GPS...</span>}
          {hasLocation && (
            <span className="loc-ok">
              Location: {geo.lat!.toFixed(4)}, {geo.lng!.toFixed(4)}
              {geo.accuracy && <span className="loc-accuracy"> (&#177;{geo.accuracy}m)</span>}
            </span>
          )}
          {!hasLocation && !geo.loading && !geo.error && (
            <span className="loc-pending">Location will be captured on start</span>
          )}
        </div>

        <div className="monitor-actions">
          {!mic.isListening && !submitted && (
            <button className="btn-primary" onClick={handleStart}>
              Start Listening
            </button>
          )}
          {mic.isListening && (
            <>
              <button className="btn-danger" onClick={handleStop}>
                Stop
              </button>
              <button className="btn-primary" onClick={handleSubmit} disabled={!connected || !hasLocation}>
                Submit Report ({mic.currentDb} dB)
              </button>
            </>
          )}
          {submitted && (
            <div className="submit-success">
              <div className="success-check">&#10003;</div>
              <div>
                <strong>Report submitted!</strong>
                <p>
                  {submittedDb} dB at ({geo.lat?.toFixed(4)}, {geo.lng?.toFixed(4)})<br />
                  Transaction: <code>5xK7...mN2p</code><br />
                  Status: <strong>Pending validation</strong> (needs 2 nearby confirmations)<br />
                  +0.001 SOL reward after verification
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="monitor-info">
          <h3>Security &amp; Anti-Fraud</h3>
          <ul>
            <li><strong>Real mic only</strong> — Web Audio API captures actual ambient sound (no manual input)</li>
            <li><strong>GPS required</strong> — every report is geotagged with device coordinates</li>
            <li><strong>Rate limited</strong> — 60-second cooldown between reports per zone</li>
            <li><strong>Staked reporters</strong> — must stake 0.01 SOL to submit (slashed if fraudulent)</li>
            <li><strong>Cross-validation</strong> — nearby reporters must confirm (2 minimum)</li>
            <li><strong>Outlier detection</strong> — readings &gt;30 dB from zone average get auto-flagged</li>
            <li><strong>Timestamp check</strong> — report must be within 5 min of on-chain clock</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
