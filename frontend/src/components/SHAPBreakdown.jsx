/**
 * SHAPBreakdown — top contributing features to the current prediction.
 * Simple horizontal bar per factor, ranked by contribution percentage.
 */
export default function SHAPBreakdown({ contributions }) {
  if (!contributions || contributions.length === 0) return null;

  const [first, second, third] = contributions;
  let summary = `${first.feature} contributed most to this prediction (${first.percent}%)`;
  if (second) summary += `, followed by ${second.feature} (${second.percent}%)`;
  if (third) summary += ` and ${third.feature} (${third.percent}%)`;
  summary += ".";

  return (
    <section className="card shap">
      <div className="shap-header">
        <h3 className="shap-title">Why this prediction?</h3>
      </div>
      <div className="shap-body">
        <p className="shap-summary">{summary}</p>
        <ul className="shap-list" aria-label="Feature contributions">
          {contributions.map((c) => {
            const positive = c.impact >= 0;
            return (
              <li key={c.feature} className="shap-row">
                <span className="shap-feature">{c.feature}</span>
                <div className="shap-bar-wrap">
                  <div
                    className={`shap-bar ${positive ? "shap-bar--pos" : "shap-bar--neg"}`}
                    style={{ width: `${Math.max(4, c.percent)}%` }}
                    title={`${positive ? "+" : ""}${c.impact.toFixed(2)} AQI impact`}
                  />
                </div>
                <span className="shap-pct">
                  {c.percent}%
                </span>
              </li>
            );
          })}
        </ul>
        <p className="shap-note">
          Bar width = percentage of total absolute impact. Sign = direction of effect on AQI.
        </p>
      </div>
    </section>
  );
}
