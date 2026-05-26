import { useState } from "react";
import Header from "./components/Header";
import AQIForm from "./components/AQIForm";
import AQIResult from "./components/AQIResult";
import AQIGuide from "./components/AQIGuide";
import { useTheme } from "./hooks/useTheme";
import { predictAQI, getErrorMessage } from "./services/api";

export default function App() {
  const { theme, toggle } = useTheme();
  const [view, setView] = useState("predict");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handlePredict = async (payload) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await predictAQI(payload));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden />
      <div className="page">
        <Header
          view={view}
          onViewChange={setView}
          theme={theme}
          onThemeToggle={toggle}
        />

        {view === "predict" ? (
          <div className="layout">
            <div className="main-col">
              <AQIForm onSubmit={handlePredict} loading={loading} />
            </div>
            <aside className="side">
              {error && <p className="error">{error}</p>}
              <AQIResult result={result} />
            </aside>
          </div>
        ) : (
          <AQIGuide />
        )}

        <footer className="footer">
          <p>
            US EPA AQI scale · Predictions from XGBoost · Not a substitute for
            official government air quality alerts
          </p>
        </footer>
      </div>
    </div>
  );
}
