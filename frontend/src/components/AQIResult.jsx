import AQIGauge from "./AQIGauge";
import AQIScale from "./AQIScale";
import { getBandForAqi } from "../constants/aqi";

export default function AQIResult({ result }) {
  if (!result) {
    return (
      <section className="result result--empty card">
        <div className="result-placeholder-icon" aria-hidden>
          ◎
        </div>
        <h3>Your forecast appears here</h3>
        <p>Fill in the form and run a prediction to see AQI, category, and health guidance.</p>
        <AQIScale />
      </section>
    );
  }

  const band = getBandForAqi(result.predicted_aqi);

  return (
    <section
      className="result card"
      style={{ "--accent": band.color, "--accent-glow": `${band.color}33` }}
    >
      <AQIGauge aqi={result.predicted_aqi} category={result.category} />
      <p className="result-advice">{result.health_advice}</p>
      <p className="result-band-desc">{band.description}</p>
      <AQIScale activeAqi={result.predicted_aqi} />
    </section>
  );
}
