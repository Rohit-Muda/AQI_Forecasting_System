import { AQI_BANDS } from "../constants/aqi";
import {
  AQI_INTRO,
  HOW_IT_WORKS,
  POLLUTANTS,
  WEATHER_FACTORS,
} from "../constants/aqiInfo";
import AQIScale from "./AQIScale";

export default function AQIGuide() {
  return (
    <div className="guide">
      <section className="guide-hero card">
        <span className="guide-badge">Air quality education</span>
        <h2>{AQI_INTRO.title}</h2>
        {AQI_INTRO.paragraphs.map((text) => (
          <p key={text.slice(0, 40)}>{text}</p>
        ))}
        <AQIScale />
      </section>

      <section className="guide-section">
        <h3>US AQI scale & health guidance</h3>
        <p className="guide-lead">
          EPA breakpoints used by this app. Colors match standard AQI reporting.
        </p>
        <div className="band-grid">
          {AQI_BANDS.map((band) => (
            <article
              key={band.category}
              className="band-card card"
              style={{ "--band-color": band.color }}
            >
              <header>
                <span className="band-range">
                  {band.min}–{band.max === 500 ? "500+" : band.max}
                </span>
                <h4>{band.category}</h4>
              </header>
              <p>{band.description}</p>
              <footer>
                <strong>Health:</strong> {band.health}
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-section">
        <h3>Pollutants explained</h3>
        <p className="guide-lead">
          Values are in micrograms per cubic meter (µg/m³), matching the training dataset.
        </p>
        <div className="pollutant-grid">
          {POLLUTANTS.map((p) => (
            <article key={p.id} className="pollutant-card card">
              <div className="pollutant-head">
                <span className="pollutant-symbol">{p.name}</span>
                <span className="pollutant-unit">{p.unit}</span>
              </div>
              <h4>{p.fullName}</h4>
              <p>{p.about}</p>
              <p className="pollutant-impact">
                <strong>Health impact:</strong> {p.impact}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-section">
        <h3>Weather factors</h3>
        <div className="weather-grid">
          {WEATHER_FACTORS.map((w) => (
            <div key={w.name} className="weather-card card">
              <h4>{w.name}</h4>
              <p>{w.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="guide-section card guide-steps">
        <h3>How this app works</h3>
        <ol>
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.slice(0, 30)}>
              <span className="step-num">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
