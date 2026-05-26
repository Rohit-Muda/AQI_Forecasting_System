import { aqiToPercent, getBandForAqi } from "../constants/aqi";

export default function AQIGauge({ aqi, category }) {
  const percent = aqiToPercent(aqi);
  const band = getBandForAqi(aqi);
  const color = band.color;

  return (
    <div className="aqi-gauge" style={{ "--gauge-color": color }}>
      <div
        className="aqi-gauge-ring"
        style={{
          background: `conic-gradient(${color} ${percent * 3.6}deg, var(--gauge-track) 0deg)`,
        }}
      >
        <div className="aqi-gauge-inner">
          <span className="aqi-gauge-value">{aqi}</span>
          <span className="aqi-gauge-unit">US AQI</span>
        </div>
      </div>
      <p className="aqi-gauge-category">{category}</p>
    </div>
  );
}
