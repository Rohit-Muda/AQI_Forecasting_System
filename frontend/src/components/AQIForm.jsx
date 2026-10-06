import { useEffect, useState, useCallback, useRef } from "react";
import { fetchCities, fetchAutofill } from "../services/api";

const SECTIONS = [
  {
    title: "Location",
    fields: [{ key: "city", label: "City", type: "select" }],
  },
  {
    title: "Weather conditions",
    autofillGroup: "weather",
    fields: [
      { key: "temperature", label: "Temperature (°C)", min: -50, max: 60 },
      { key: "humidity", label: "Humidity (%)", min: 0, max: 100 },
      { key: "pressure", label: "Pressure (hPa)", min: 800, max: 1100 },
      { key: "wind_speed", label: "Wind speed (km/h)", min: 0, max: 200 },
      { key: "rainfall", label: "Rainfall (mm)", min: 0, max: 500 },
    ],
  },
  {
    title: "Pollutant levels",
    autofillGroup: "air",
    fields: [
      { key: "pm25", label: "PM2.5 (µg/m³)", min: 0, max: 1000 },
      { key: "pm10", label: "PM10 (µg/m³)", min: 0, max: 1500 },
      { key: "no2", label: "NO2 (µg/m³)", min: 0, max: 500 },
      { key: "so2", label: "SO2 (µg/m³)", min: 0, max: 500 },
      { key: "co", label: "CO (µg/m³)", min: 0, max: 5000 },
      { key: "o3", label: "O3 (µg/m³)", min: 0, max: 500 },
    ],
  },
];

const NUMERIC_KEYS = SECTIONS.flatMap((s) =>
  s.fields.filter((f) => f.type !== "select").map((f) => f.key)
);

const emptyValues = () =>
  Object.fromEntries(
    SECTIONS.flatMap((s) => s.fields).map((f) => [f.key, ""])
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
        errors[field.key] = `Enter ${field.min} to ${field.max}.`;
      }
    }
  }
  return errors;
}

export default function AQIForm({ onSubmit, loading, onAutofill, onCityChange }) {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillStatus, setAutofillStatus] = useState("idle");
  const [autofilled, setAutofilled] = useState(new Set());
  const autofillAbortRef = useRef(null);

  useEffect(() => {
    fetchCities()
      .then((list) => {
        setCities(list);
        if (list.length) {
          const firstCity = list[0];
          setValues((v) => ({ ...v, city: firstCity }));
          triggerAutofill(firstCity);
          onCityChange?.(firstCity);
        }
      })
      .catch(() => setErrors({ city: "Start the backend to load cities." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerAutofill = useCallback(
    async (city) => {
      if (autofillAbortRef.current) {
        autofillAbortRef.current = false;
      }
      const token = {};
      autofillAbortRef.current = token;

      setAutofillLoading(true);
      setAutofillStatus("loading");
      setAutofilled(new Set());

      try {
        const data = await fetchAutofill(city);
        if (autofillAbortRef.current !== token) return;

        const filledKeys = new Set();
        setValues((prev) => {
          const next = { ...prev };
          for (const key of NUMERIC_KEYS) {
            if (data[key] !== null && data[key] !== undefined) {
              next[key] = String(parseFloat(data[key].toFixed(2)));
              filledKeys.add(key);
            }
          }
          return next;
        });
        setAutofilled(filledKeys);
        setAutofillStatus(data.source || "none");
        onAutofill?.(data);
      } catch {
        if (autofillAbortRef.current !== token) return;
        setAutofillStatus("none");
        onAutofill?.({ live_aqi: null });
      } finally {
        if (autofillAbortRef.current === token) {
          setAutofillLoading(false);
        }
      }
    },
    [onAutofill]
  );

  const set = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setAutofilled((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleCityChange = (newCity) => {
    set("city", newCity);
    onCityChange?.(newCity);
    triggerAutofill(newCity);
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
        <p>Provide current readings. The model estimates US AQI from learned patterns.</p>
      </div>

      {SECTIONS.map((section) => (
        <fieldset key={section.title} className="section" disabled={loading}>
          <legend>
            {section.title}
            {section.autofillGroup && autofillStatus === "loading" && (
              <span className="autofill-badge autofill-badge--loading" aria-live="polite">
                <span className="autofill-spinner" aria-hidden />
                Fetching live data
              </span>
            )}
            {section.autofillGroup && autofillStatus === "full" && (
              <span className="autofill-badge autofill-badge--ok">Live data loaded</span>
            )}
            {section.autofillGroup && autofillStatus === "partial" && (
              <span className="autofill-badge autofill-badge--partial">Partial live data</span>
            )}
          </legend>
          <div className="grid">
            {section.fields.map((field) => (
              <label
                key={field.key}
                className={`field ${autofilled.has(field.key) ? "field--autofilled" : ""}`}
              >
                <span>{field.label}</span>
                {field.type === "select" ? (
                  <select
                    value={values.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={!cities.length || autofillLoading}
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
                    placeholder={autofillLoading ? "Loading..." : ""}
                  />
                )}
                {errors[field.key] && <em>{errors[field.key]}</em>}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <button type="submit" disabled={loading || autofillLoading}>
        {loading ? "Predicting..." : "Predict AQI"}
      </button>
    </form>
  );
}
