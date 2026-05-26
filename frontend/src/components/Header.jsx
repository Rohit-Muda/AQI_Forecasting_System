import ThemeToggle from "./ThemeToggle";

const NAV = [
  { id: "predict", label: "Forecast" },
  { id: "guide", label: "About AQI" },
];

export default function Header({ view, onViewChange, theme, onThemeToggle }) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo" aria-hidden>
          <span className="logo-ring" />
          <span className="logo-core" />
        </div>
        <div>
          <h1>AQI Forecast</h1>
          <p>Machine learning air quality predictions for India</p>
        </div>
      </div>

      <nav className="header-nav" aria-label="Main">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-btn ${view === item.id ? "is-active" : ""}`}
            onClick={() => onViewChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <ThemeToggle theme={theme} onToggle={onThemeToggle} />
    </header>
  );
}
