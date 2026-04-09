// Real Zurich locations with simulated noise data
// Swiss noise limits: 55 dB day / 45 dB night (residential)

export interface NoiseReport {
  id: string;
  lat: number;
  lng: number;
  decibels: number;
  timestamp: string;
  reporter: string; // truncated wallet address
  location: string;
  category: "quiet" | "moderate" | "loud" | "violation";
}

export interface Zone {
  name: string;
  lat: number;
  lng: number;
  avgDecibels: number;
  reportCount: number;
  status: "compliant" | "warning" | "violation";
}

function categorize(db: number): NoiseReport["category"] {
  if (db <= 40) return "quiet";
  if (db <= 55) return "moderate";
  if (db <= 70) return "loud";
  return "violation";
}

// Mock reports around real Zurich locations
export const mockReports: NoiseReport[] = [
  // ETH Zurich / Universitätstrasse area
  { id: "r1", lat: 47.3763, lng: 8.5483, decibels: 42, timestamp: "2026-04-09T10:15:00Z", reporter: "7xKp...3mNv", location: "ETH Main Building", category: "moderate" },
  { id: "r2", lat: 47.3770, lng: 8.5495, decibels: 38, timestamp: "2026-04-09T10:20:00Z", reporter: "9bRt...xP2q", location: "Polyterrasse", category: "quiet" },
  { id: "r3", lat: 47.3755, lng: 8.5470, decibels: 51, timestamp: "2026-04-09T10:25:00Z", reporter: "3mWz...7kLp", location: "Tannenstrasse", category: "moderate" },

  // Zurich HB (main station) — noisy
  { id: "r4", lat: 47.3783, lng: 8.5402, decibels: 72, timestamp: "2026-04-09T09:00:00Z", reporter: "5tNx...2bKm", location: "Zürich HB Hall", category: "violation" },
  { id: "r5", lat: 47.3778, lng: 8.5395, decibels: 68, timestamp: "2026-04-09T09:05:00Z", reporter: "8pQr...1vXz", location: "Bahnhofstrasse (north)", category: "loud" },
  { id: "r6", lat: 47.3790, lng: 8.5410, decibels: 65, timestamp: "2026-04-09T09:10:00Z", reporter: "2jLm...9wRt", location: "Europaallee", category: "loud" },

  // Langstrasse — nightlife, known noisy area
  { id: "r7", lat: 47.3745, lng: 8.5285, decibels: 78, timestamp: "2026-04-09T01:30:00Z", reporter: "6wXz...4nBp", location: "Langstrasse (bars)", category: "violation" },
  { id: "r8", lat: 47.3740, lng: 8.5275, decibels: 74, timestamp: "2026-04-09T02:00:00Z", reporter: "1kRp...8mTz", location: "Helvetiaplatz", category: "violation" },
  { id: "r9", lat: 47.3750, lng: 8.5295, decibels: 62, timestamp: "2026-04-09T14:00:00Z", reporter: "4bNm...6xLq", location: "Longstreet Bar area", category: "loud" },

  // Seefeld / Lakefront — quieter residential
  { id: "r10", lat: 47.3540, lng: 8.5510, decibels: 35, timestamp: "2026-04-09T08:00:00Z", reporter: "7mKp...3wNz", location: "Zürichhorn Park", category: "quiet" },
  { id: "r11", lat: 47.3560, lng: 8.5490, decibels: 41, timestamp: "2026-04-09T08:15:00Z", reporter: "9xRt...1bPq", location: "Seefeld residential", category: "moderate" },
  { id: "r12", lat: 47.3530, lng: 8.5525, decibels: 32, timestamp: "2026-04-09T07:00:00Z", reporter: "2pWz...5kLm", location: "Lake promenade", category: "quiet" },

  // Oerlikon — urban/industrial
  { id: "r13", lat: 47.4095, lng: 8.5440, decibels: 63, timestamp: "2026-04-09T11:00:00Z", reporter: "8tNx...4bKp", location: "Oerlikon Marktplatz", category: "loud" },
  { id: "r14", lat: 47.4110, lng: 8.5455, decibels: 58, timestamp: "2026-04-09T11:15:00Z", reporter: "3jQr...7vXm", location: "MFO Park area", category: "loud" },

  // Niederdorf / Old Town — tourist noise
  { id: "r15", lat: 47.3728, lng: 8.5442, decibels: 59, timestamp: "2026-04-09T20:00:00Z", reporter: "5wLm...2nRz", location: "Niederdorfstrasse", category: "loud" },
  { id: "r16", lat: 47.3720, lng: 8.5435, decibels: 55, timestamp: "2026-04-09T19:30:00Z", reporter: "1kXz...9mBp", location: "Hirschenplatz", category: "moderate" },

  // Altstetten — near train tracks
  { id: "r17", lat: 47.3910, lng: 8.4885, decibels: 71, timestamp: "2026-04-09T07:30:00Z", reporter: "6pRt...3wKq", location: "Altstetten station", category: "violation" },
  { id: "r18", lat: 47.3905, lng: 8.4870, decibels: 54, timestamp: "2026-04-09T12:00:00Z", reporter: "4bNz...8xLm", location: "Badenerstrasse", category: "moderate" },
];

export const mockZones: Zone[] = [
  { name: "ETH Zurich Campus", lat: 47.3763, lng: 8.5483, avgDecibels: 44, reportCount: 312, status: "compliant" },
  { name: "Zürich HB Area", lat: 47.3783, lng: 8.5402, avgDecibels: 68, reportCount: 1847, status: "violation" },
  { name: "Langstrasse", lat: 47.3745, lng: 8.5285, avgDecibels: 71, reportCount: 2103, status: "violation" },
  { name: "Seefeld / Lakefront", lat: 47.3540, lng: 8.5510, avgDecibels: 36, reportCount: 458, status: "compliant" },
  { name: "Oerlikon", lat: 47.4095, lng: 8.5440, avgDecibels: 61, reportCount: 673, status: "warning" },
  { name: "Niederdorf / Altstadt", lat: 47.3728, lng: 8.5442, avgDecibels: 57, reportCount: 921, status: "warning" },
  { name: "Altstetten", lat: 47.3910, lng: 8.4885, avgDecibels: 63, reportCount: 534, status: "warning" },
];

export const protocolStats = {
  totalReports: 6848,
  activeReporters: 1243,
  zonesMonitored: 7,
  violations24h: 14,
  avgDecibels: 54,
  rewardsDistributed: 127.4, // SOL
};
