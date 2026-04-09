import { protocolStats, mockZones } from "../mockData";

function getStatusColor(status: string): string {
  if (status === "compliant") return "#22c55e";
  if (status === "warning") return "#f97316";
  return "#ef4444";
}

function getDbBarWidth(db: number): string {
  return `${Math.min(100, (db / 80) * 100)}%`;
}

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{protocolStats.totalReports.toLocaleString()}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{protocolStats.activeReporters.toLocaleString()}</div>
          <div className="stat-label">Active Reporters</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{protocolStats.zonesMonitored}</div>
          <div className="stat-label">Zones Monitored</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-value">{protocolStats.violations24h}</div>
          <div className="stat-label">Violations (24h)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{protocolStats.avgDecibels} dB</div>
          <div className="stat-label">City Average</div>
        </div>
        <div className="stat-card sol">
          <div className="stat-value">{protocolStats.rewardsDistributed} SOL</div>
          <div className="stat-label">Rewards Distributed</div>
        </div>
      </div>

      <div className="zones-section">
        <h2>Zone Overview</h2>
        <div className="zones-table">
          <div className="zone-header">
            <span>Zone</span>
            <span>Avg dB</span>
            <span>Reports</span>
            <span>Status</span>
          </div>
          {mockZones
            .sort((a, b) => b.avgDecibels - a.avgDecibels)
            .map((zone) => (
              <div key={zone.name} className="zone-row">
                <span className="zone-name">{zone.name}</span>
                <span className="zone-db">
                  <div className="db-bar-bg">
                    <div
                      className="db-bar-fill"
                      style={{
                        width: getDbBarWidth(zone.avgDecibels),
                        backgroundColor: getStatusColor(zone.status),
                      }}
                    />
                  </div>
                  <span>{zone.avgDecibels} dB</span>
                </span>
                <span className="zone-reports">{zone.reportCount.toLocaleString()}</span>
                <span className="zone-status" style={{ color: getStatusColor(zone.status) }}>
                  {zone.status.toUpperCase()}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="economics-section">
        <h2>Token Economics</h2>
        <div className="econ-grid">
          <div className="econ-card">
            <h3>Earn</h3>
            <p>Submit verified noise readings from your phone. Earn <strong>0.001 SOL</strong> per validated report.</p>
          </div>
          <div className="econ-card">
            <h3>Validate</h3>
            <p>Cross-reference nearby reports. Validators stake SOL and earn fees for confirming data accuracy.</p>
          </div>
          <div className="econ-card">
            <h3>Consume</h3>
            <p>Cities & researchers buy aggregated noise data. Revenue flows back to reporters and validators.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
