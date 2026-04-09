import { useState, useEffect, useRef } from "react";

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
  const [listening, setListening] = useState(false);
  const [currentDb, setCurrentDb] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Simulate microphone readings (in a real app, uses Web Audio API)
  useEffect(() => {
    if (!listening) return;
    setSubmitted(false);

    // Simulate fluctuating noise levels
    const baseDb = 40 + Math.random() * 30;
    intervalRef.current = window.setInterval(() => {
      const fluctuation = (Math.random() - 0.5) * 10;
      setCurrentDb(Math.round(Math.max(20, Math.min(100, baseDb + fluctuation))));
    }, 300);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [listening]);

  const handleSubmit = () => {
    setSubmitted(true);
    setListening(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className="monitor">
      <div className="monitor-card">
        <h2>Report Noise Level</h2>
        <p className="monitor-desc">
          Use your phone's microphone to measure ambient noise and submit an on-chain report.
          You'll earn <strong>0.001 SOL</strong> per verified reading.
        </p>

        {!connected && (
          <div className="monitor-warning">
            Connect your wallet to submit reports
          </div>
        )}

        <div className="meter">
          <div
            className="meter-fill"
            style={{
              height: `${Math.min(100, (currentDb / 100) * 100)}%`,
              backgroundColor: getColor(currentDb),
              transition: "height 0.3s ease, background-color 0.3s ease",
            }}
          />
          <div className="meter-reading">
            <span className="meter-db" style={{ color: listening ? getColor(currentDb) : "#64748b" }}>
              {listening ? currentDb : "--"}
            </span>
            <span className="meter-unit">dB</span>
            {listening && (
              <span className="meter-label" style={{ color: getColor(currentDb) }}>
                {getLabel(currentDb)}
              </span>
            )}
          </div>
        </div>

        <div className="meter-scale">
          <span>20 dB</span>
          <span style={{ color: "#eab308" }}>55 dB limit</span>
          <span>100 dB</span>
        </div>

        <div className="monitor-actions">
          {!listening && !submitted && (
            <button className="btn-primary" onClick={() => setListening(true)}>
              Start Listening
            </button>
          )}
          {listening && (
            <>
              <button className="btn-danger" onClick={() => { setListening(false); if (intervalRef.current) clearInterval(intervalRef.current); }}>
                Stop
              </button>
              <button className="btn-primary" onClick={handleSubmit} disabled={!connected}>
                Submit Report ({currentDb} dB)
              </button>
            </>
          )}
          {submitted && (
            <div className="submit-success">
              <div className="success-check">&#10003;</div>
              <div>
                <strong>Report submitted!</strong>
                <p>
                  {currentDb} dB recorded at your location.<br />
                  Transaction: <code>5xK7...mN2p</code><br />
                  +0.001 SOL reward pending validation
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="monitor-info">
          <h3>How measurement works</h3>
          <ul>
            <li>Your phone's microphone captures ambient sound</li>
            <li>Web Audio API calculates RMS amplitude, converted to dB SPL</li>
            <li>GPS coordinates are attached to the reading</li>
            <li>Report is submitted as a Solana transaction</li>
            <li>Nearby reporters cross-validate within 5 minutes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
