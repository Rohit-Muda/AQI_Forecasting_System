import { getBandForAqi } from "../constants/aqi";

const CHART_HEIGHT = 120;
const BAR_MAX_AQI = 300;

/**
 * ForecastChart — SVG bar chart showing AQI forecast for each day.
 * Category-colored bars, date labels, AQI value on each bar.
 */
export default function ForecastChart({ forecast, loading }) {
  if (loading) {
    return (
      <section className="card forecast">
        <div className="forecast-header">
          <h3 className="forecast-title">5-Day AQI Forecast</h3>
        </div>
        <div className="forecast-body">
          <div className="forecast-skeleton" aria-busy="true" aria-label="Loading forecast...">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="forecast-skeleton-bar" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!forecast || !forecast.days || forecast.days.length === 0) return null;

  const { city, days } = forecast;
  const barCount = days.length;
  const svgWidth = 300;
  const barWidth = Math.floor((svgWidth - (barCount + 1) * 8) / barCount);
  const labelY = CHART_HEIGHT + 28;

  return (
    <section className="card forecast">
      <div className="forecast-header">
        <h3 className="forecast-title">
          {days.length}-Day AQI Forecast
          <span className="forecast-city">{city}</span>
        </h3>
      </div>
      <div className="forecast-body">
        <div className="forecast-chart-wrap" role="img" aria-label={`${days.length}-day AQI forecast for ${city}`}>
          <svg
            viewBox={`0 0 ${svgWidth} ${labelY + 4}`}
            className="forecast-svg"
            aria-hidden="true"
          >
            {days.map((day, i) => {
              const band = getBandForAqi(day.predicted_aqi);
              const barH = Math.max(
                8,
                Math.min(CHART_HEIGHT, (day.predicted_aqi / BAR_MAX_AQI) * CHART_HEIGHT)
              );
              const x = 8 + i * (barWidth + 8);
              const y = CHART_HEIGHT - barH;

              const dateObj = new Date(day.date + "T12:00:00");
              const dayLabel = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
              const dateLabel = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

              return (
                <g key={day.date}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barH}
                    rx={3}
                    fill={band.color}
                    opacity={0.9}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={band.color}
                  >
                    {day.predicted_aqi}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={CHART_HEIGHT + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    className="forecast-label"
                  >
                    {dayLabel}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={CHART_HEIGHT + 26}
                    textAnchor="middle"
                    fontSize="9"
                    className="forecast-sublabel"
                  >
                    {dateLabel}
                  </text>
                </g>
              );
            })}

            <line
              x1={4}
              y1={CHART_HEIGHT}
              x2={svgWidth - 4}
              y2={CHART_HEIGHT}
              strokeWidth="1"
              className="forecast-baseline"
            />
          </svg>
        </div>

        <div className="forecast-legend">
          {Array.from(new Set(days.map((d) => d.category))).map((cat) => {
            const band = getBandForAqi(
              days.find((d) => d.category === cat)?.predicted_aqi ?? 0
            );
            return (
              <span key={cat} className="forecast-legend-item">
                <span
                  className="forecast-legend-dot"
                  style={{ background: band.color }}
                />
                {cat}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
