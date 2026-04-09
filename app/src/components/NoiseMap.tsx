import { useEffect, useRef } from "react";
import L from "leaflet";
import { mockReports, mockZones } from "../mockData";

function getColor(db: number): string {
  if (db <= 40) return "#22c55e"; // green — quiet
  if (db <= 55) return "#eab308"; // yellow — moderate
  if (db <= 70) return "#f97316"; // orange — loud
  return "#ef4444"; // red — violation
}

function getZoneColor(status: string): string {
  if (status === "compliant") return "#22c55e";
  if (status === "warning") return "#f97316";
  return "#ef4444";
}

export default function NoiseMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([47.3769, 8.5417], 13); // Zurich center

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add zone circles
    mockZones.forEach((zone) => {
      L.circle([zone.lat, zone.lng], {
        radius: 400,
        color: getZoneColor(zone.status),
        fillColor: getZoneColor(zone.status),
        fillOpacity: 0.1,
        weight: 1,
        dashArray: "5,5",
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;padding:4px">
            <strong>${zone.name}</strong><br/>
            Avg: <strong>${zone.avgDecibels} dB</strong><br/>
            Reports: ${zone.reportCount.toLocaleString()}<br/>
            Status: <span style="color:${getZoneColor(zone.status)};font-weight:600">${zone.status.toUpperCase()}</span>
          </div>`
        );
    });

    // Add noise report markers
    mockReports.forEach((report) => {
      const color = getColor(report.decibels);
      const size = Math.max(8, Math.min(20, report.decibels / 5));

      L.circleMarker([report.lat, report.lng], {
        radius: size,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;padding:4px">
            <strong>${report.decibels} dB</strong> — ${report.location}<br/>
            <span style="color:${color};font-weight:600">${report.category.toUpperCase()}</span><br/>
            Reporter: <code>${report.reporter}</code><br/>
            ${new Date(report.timestamp).toLocaleTimeString("en-CH")}
          </div>`
        );
    });

    // Legend
    const legend = new L.Control({ position: "bottomright" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "noise-legend");
      div.innerHTML = `
        <div style="background:rgba(0,0,0,0.85);padding:10px 14px;border-radius:8px;color:#fff;font-family:Inter,sans-serif;font-size:12px">
          <div style="font-weight:600;margin-bottom:6px">Noise Level</div>
          <div><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#22c55e;margin-right:6px"></span> &le;40 dB — Library</div>
          <div><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#eab308;margin-right:6px"></span> 41-55 dB — Conversation</div>
          <div><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#f97316;margin-right:6px"></span> 56-70 dB — Traffic</div>
          <div><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ef4444;margin-right:6px"></span> &gt;70 dB — Violation</div>
          <div style="margin-top:6px;color:#94a3b8;font-size:10px">Swiss limit: 55 dB day / 45 dB night</div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
