import { AQI_BANDS } from "../constants/aqi";

export default function AQIScale({ activeAqi = null }) {
  return (
    <div className="aqi-scale">
      <div className="aqi-scale-bar">
        {AQI_BANDS.map((band) => (
          <div
            key={band.category}
            className="aqi-scale-segment"
            style={{ background: band.color }}
            title={`${band.min}–${band.max}: ${band.category}`}
          />
        ))}
        {activeAqi != null && (
          <span
            className="aqi-scale-marker"
            style={{ left: `${Math.min(100, (activeAqi / 500) * 100)}%` }}
            aria-hidden
          />
        )}
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
  );
}
