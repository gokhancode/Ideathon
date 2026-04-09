import { mockReports } from "../mockData";

function getColor(db: number): string {
  if (db <= 40) return "#22c55e";
  if (db <= 55) return "#eab308";
  if (db <= 70) return "#f97316";
  return "#ef4444";
}

export default function ReportList() {
  const sorted = [...mockReports].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="report-list">
      <h3>Recent Reports</h3>
      <div className="reports">
        {sorted.map((r) => (
          <div key={r.id} className="report-item">
            <div className="report-db" style={{ color: getColor(r.decibels) }}>
              {r.decibels} dB
            </div>
            <div className="report-info">
              <div className="report-location">{r.location}</div>
              <div className="report-meta">
                <code>{r.reporter}</code>
                <span>{new Date(r.timestamp).toLocaleTimeString("en-CH", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
