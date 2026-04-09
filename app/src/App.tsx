import { useState, useEffect } from "react";
import NoiseMap from "./components/NoiseMap";
import Dashboard from "./components/Dashboard";
import ReportList from "./components/ReportList";
import NoiseMonitor from "./components/NoiseMonitor";
import HowItWorks from "./components/HowItWorks";
import PitchPopup from "./components/PitchPopup";
import "./styles.css";

type Tab = "map" | "dashboard" | "monitor" | "how";

export default function App() {
  const [tab, setTab] = useState<Tab>("map");
  const [walletConnected, setWalletConnected] = useState(false);
  const [showPopup, setShowPopup] = useState(true);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">dB</span>
            <div>
              <h1>DeciMap</h1>
              <span className="tagline">Decentralized Noise Monitoring on Solana</span>
            </div>
          </div>
        </div>
        <nav className="nav">
          <button className={`nav-btn ${tab === "map" ? "active" : ""}`} onClick={() => setTab("map")}>
            Noise Map
          </button>
          <button className={`nav-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
            Dashboard
          </button>
          <button className={`nav-btn ${tab === "monitor" ? "active" : ""}`} onClick={() => setTab("monitor")}>
            Report Noise
          </button>
          <button className={`nav-btn ${tab === "how" ? "active" : ""}`} onClick={() => setTab("how")}>
            How It Works
          </button>
        </nav>
        <button
          className={`wallet-btn ${walletConnected ? "connected" : ""}`}
          onClick={() => setWalletConnected(!walletConnected)}
        >
          {walletConnected ? "7xKp...3mNv" : "Connect Wallet"}
        </button>
      </header>

      {showPopup && <PitchPopup onClose={() => setShowPopup(false)} />}

      <main className="main">
        {tab === "map" && (
          <div className="map-layout">
            <div className="map-container">
              <NoiseMap />
            </div>
            <aside className="sidebar">
              <ReportList />
            </aside>
          </div>
        )}
        {tab === "dashboard" && <Dashboard />}
        {tab === "monitor" && <NoiseMonitor connected={walletConnected} />}
        {tab === "how" && <HowItWorks />}
      </main>
    </div>
  );
}
