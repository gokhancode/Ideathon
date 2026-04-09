export default function PitchPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>&times;</button>

        <h2 className="popup-title">DeciMap</h2>
        <p className="popup-subtitle">Decentralized Noise Monitoring on Solana</p>

        <div className="popup-body">
          <p>
            Zurich receives over <strong>6,500 noise complaints</strong> every year, but has virtually
            zero real-time monitoring infrastructure. Swiss law sets clear limits — 55 dB during the
            day, 45 dB at night — yet there's no data to enforce them.
          </p>
          <p>
            <strong>DeciMap</strong> fixes this by turning every smartphone into a noise sensor. Using
            the Web Audio API and GPS, anyone can measure ambient noise and submit a geotagged,
            timestamped reading directly to Solana. Reporters stake SOL to participate, readings are
            cross-validated by nearby users, and verified contributions earn rewards.
          </p>
          <p>
            The data is sold to municipalities, urban planners, and real estate platforms — replacing
            expensive fixed sensors at a fraction of the cost. Built on Solana for sub-second finality
            and sub-cent transaction costs.
          </p>
          <p>
            100% open source (MIT). Built with Anchor (Rust) + React + TypeScript.
          </p>
          <p className="popup-apology">
            I apologize for not being able to pitch in person. Please explore the demo and check out the
            full codebase below.
          </p>
        </div>

        <div className="popup-links">
          <a
            href="https://gamma.app/docs/DeciMap-tjgtdw2ed088vn2"
            target="_blank"
            rel="noopener noreferrer"
            className="popup-link pitch"
          >
            View Pitch Deck
          </a>
          <a
            href="https://github.com/gokhancode/Ideathon"
            target="_blank"
            rel="noopener noreferrer"
            className="popup-link github"
          >
            View on GitHub
          </a>
          <button className="popup-link demo" onClick={onClose}>
            Explore Demo
          </button>
        </div>

        <p className="popup-footer">
          Built at Superteam Career Day Ideathon, ETH Zurich — April 2026
        </p>
      </div>
    </div>
  );
}
