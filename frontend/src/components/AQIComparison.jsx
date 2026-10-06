import { getBandForAqi } from "../constants/aqi";

/**
 * AQIComparison — shows model-predicted AQI vs live-reported AQI side by side.
 * Only renders when both values are available.
 */
export default function AQIComparison({ predictedAqi, predictedCategory, liveAqi }) {
  if (predictedAqi == null || liveAqi == null) return null;

  const diff = Math.abs(predictedAqi - liveAqi);
  const liveBand = getBandForAqi(liveAqi);
  const predBand = getBandForAqi(predictedAqi);
  const pctDiff = predictedAqi > 0 ? Math.round((diff / predictedAqi) * 100) : 0;

  return (
    <section className="card comparison">
      <h3 className="comparison-title">
        <span className="comparison-icon" aria-hidden>🔬</span>
        Predicted vs Live Reported
      </h3>

      <div className="comparison-grid">
        <div className="comparison-item">
          <span className="comparison-label">Model Predicted</span>
          <span
            className="comparison-value"
            style={{ color: predBand.color }}
          >
            {predictedAqi}
          </span>
          <span className="comparison-category" style={{ color: predBand.color }}>
            {predictedCategory || predBand.category}
          </span>
        </div>

        <div className="comparison-divider" aria-hidden>
          <span className="comparison-vs">vs</span>
        </div>

        <div className="comparison-item">
          <span className="comparison-label">Live Reported</span>
          <span
            className="comparison-value"
            style={{ color: liveBand.color }}
          >
            {liveAqi}
          </span>
          <span className="comparison-category" style={{ color: liveBand.color }}>
            {liveBand.category}
          </span>
        </div>
      </div>

      <div className="comparison-diff">
        <span className="comparison-diff-label">Difference</span>
        <span className="comparison-diff-value">
          ±{diff}
          <span className="comparison-diff-pct"> ({pctDiff}% variance)</span>
        </span>
        {diff <= 15 && (
          <span className="comparison-trust comparison-trust--good">
            ✓ Good model agreement
          </span>
        )}
        {diff > 15 && diff <= 40 && (
          <span className="comparison-trust comparison-trust--moderate">
            ~ Moderate variance
          </span>
        )}
        {diff > 40 && (
          <span className="comparison-trust comparison-trust--high">
            ⚠ High variance — check inputs
          </span>
        )}
      </div>
    </section>
  );
}
