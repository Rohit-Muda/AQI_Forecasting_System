import { getBandForAqi } from "../constants/aqi";

/**
 * Displays model-predicted AQI score as the primary focal point,
 * with category, health advice, and AQI scale bar below.
 */
export default function AQIResult({ result }) {
  if (!result) {
    return (
      <section className="result result--empty card">
        <div className="result-placeholder-icon" aria-hidden>
          &#9711;
        </div>
        <h3>Your forecast appears here</h3>
        <p>Fill in the form and run a prediction to see AQI, category, and health guidance.</p>
      </section>
    );
  }

  const band = getBandForAqi(result.predicted_aqi);

  return (
    <section className="result card" style={{ borderTop: `3px solid ${band.color}` }}>
      <div className="result-score-wrap">
        <span className="result-score" style={{ color: band.color }}>
          {result.predicted_aqi}
        </span>
        <span className="result-score-label">US AQI</span>
      </div>
      <p className="result-category" style={{ color: band.color }}>{result.category}</p>
      <p className="result-advice">{result.health_advice}</p>
      <p className="result-band-desc">{band.description}</p>
      <div className="aqi-scale">
        <div className="aqi-scale-bar">
          {[
            { color: "#16a34a" },
            { color: "#d97706" },
            { color: "#ea580c" },
            { color: "#dc2626" },
            { color: "#7e22ce" },
            { color: "#9f1239" },
          ].map((seg, i) => (
            <div key={i} className="aqi-scale-segment" style={{ background: seg.color }} />
          ))}
          <span
            className="aqi-scale-marker"
            style={{ left: `${Math.min(100, (result.predicted_aqi / 500) * 100)}%` }}
            aria-hidden
          />
        </div>
        <div className="aqi-scale-labels">
          <span>0</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
          <span>300</span>
          <span>500+</span>
        </div>
      </div>
    </section>
  );
}
