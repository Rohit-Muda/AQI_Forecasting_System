import { useEffect, useState } from "react";
import { fetchCities } from "../services/api";

const SECTIONS = [
  {
    title: "Location",
    icon: "📍",
    fields: [{ key: "city", label: "City", type: "select" }],
  },
  {
    title: "Weather",
    icon: "🌤",
    fields: [
      { key: "temperature", label: "Temperature (°C)", min: -50, max: 60 },
      { key: "humidity", label: "Humidity (%)", min: 0, max: 100 },
      { key: "pressure", label: "Pressure (hPa)", min: 800, max: 1100 },
      { key: "wind_speed", label: "Wind speed (km/h)", min: 0, max: 200 },
      { key: "rainfall", label: "Rainfall (mm)", min: 0, max: 500 },
    ],
  },
  {
    title: "Pollutants",
    icon: "💨",
    fields: [
      { key: "pm25", label: "PM2.5 (µg/m³)", min: 0, max: 1000 },
      { key: "pm10", label: "PM10 (µg/m³)", min: 0, max: 1500 },
      { key: "no2", label: "NO₂ (µg/m³)", min: 0, max: 500 },
      { key: "so2", label: "SO₂ (µg/m³)", min: 0, max: 500 },
      { key: "co", label: "CO (µg/m³)", min: 0, max: 5000 },
      { key: "o3", label: "O₃ (µg/m³)", min: 0, max: 500 },
    ],
  },
];

const empty = Object.fromEntries(
  SECTIONS.flatMap((s) => s.fields).map((f) => [f.key, f.type === "select" ? "" : ""])
);

function validate(values) {
  const errors = {};
  if (!values.city) errors.city = "Select a city.";

  for (const section of SECTIONS) {
    for (const field of section.fields) {
      if (field.type === "select") continue;
      const raw = values[field.key];
      if (raw === "") {
        errors[field.key] = "Required.";
        continue;
      }
      const num = Number(raw);
      if (Number.isNaN(num) || num < field.min || num > field.max) {
        errors[field.key] = `Enter ${field.min}–${field.max}.`;
      }
    }
  }
  return errors;
}

export default function AQIForm({ onSubmit, loading }) {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetchCities()
      .then((list) => {
        setCities(list);
        if (list.length) setValues((v) => ({ ...v, city: list[0] }));
      })
      .catch(() => setErrors({ city: "Start the backend to load cities." }));
  }, []);

  const set = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      city: values.city,
      temperature: Number(values.temperature),
      humidity: Number(values.humidity),
      pressure: Number(values.pressure),
      wind_speed: Number(values.wind_speed),
      rainfall: Number(values.rainfall),
      pm25: Number(values.pm25),
      pm10: Number(values.pm10),
      no2: Number(values.no2),
      so2: Number(values.so2),
      co: Number(values.co),
      o3: Number(values.o3),
    });
  };

  return (
    <form className="card form" onSubmit={submit}>
      <div className="form-intro">
        <h2>Prediction inputs</h2>
        <p>Provide current readings — the model estimates US AQI from learned patterns.</p>
      </div>
      {SECTIONS.map((section) => (
        <fieldset key={section.title} className="section" disabled={loading}>
          <legend>
            <span className="section-icon" aria-hidden>{section.icon}</span>
            {section.title}
          </legend>
          <div className="grid">
            {section.fields.map((field) => (
              <label key={field.key} className="field">
                <span>{field.label}</span>
                {field.type === "select" ? (
                  <select
                    value={values.city}
                    onChange={(e) => set("city", e.target.value)}
                    disabled={!cities.length}
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    step="any"
                    min={field.min}
                    max={field.max}
                    value={values[field.key]}
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                )}
                {errors[field.key] && <em>{errors[field.key]}</em>}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <button type="submit" disabled={loading}>
        {loading ? "Predicting…" : "Predict AQI"}
      </button>
    </form>
  );
}
