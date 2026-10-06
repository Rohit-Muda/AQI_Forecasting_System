import { useState, useCallback } from "react";
import Header from "./components/Header";
import AQIForm from "./components/AQIForm";
import AQIResult from "./components/AQIResult";
import SHAPBreakdown from "./components/SHAPBreakdown";
import ForecastChart from "./components/ForecastChart";
import AQIGuide from "./components/AQIGuide";
import { useTheme } from "./hooks/useTheme";
import { predictAQI, fetchForecast, getErrorMessage } from "./services/api";

export default function App() {
  const { theme, toggle } = useTheme();
  const [view, setView] = useState("predict");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Called by AQIForm when city changes (to trigger forecast fetch)
  const handleCityChange = useCallback(async (city) => {
    setForecast(null);
    setForecastLoading(true);
    try {
      const data = await fetchForecast(city);
      setForecast(data);
    } catch {
      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  }, []);

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
              <AQIForm
                onSubmit={handlePredict}
                loading={loading}
                onCityChange={handleCityChange}
              />
            </div>
            <aside className="side">
              {error && <p className="error">{error}</p>}
              <AQIResult result={result} />
              {result && result.shap_top && result.shap_top.length > 0 && (
                <SHAPBreakdown contributions={result.shap_top} />
              )}
              <ForecastChart
                forecast={forecast}
                loading={forecastLoading}
              />
            </aside>
          </div>
        ) : (
          <AQIGuide />
        )}

        <footer className="footer">
          <p>
            US EPA AQI scale · Predictions from XGBoost · Live weather and air quality via OpenWeatherMap · Not a substitute for official government air quality alerts
          </p>
        </footer>
      </div>
    </div>
  );
}
