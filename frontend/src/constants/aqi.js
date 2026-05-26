export const AQI_BANDS = [
  {
    min: 0,
    max: 50,
    category: "Good",
    color: "#00c853",
    description: "Air quality is satisfactory with little or no health risk.",
    health: "Enjoy outdoor activities.",
  },
  {
    min: 51,
    max: 100,
    category: "Moderate",
    color: "#ffd600",
    description: "Acceptable air quality; some pollutants may affect sensitive people.",
    health: "Unusually sensitive people should limit prolonged outdoor exertion.",
  },
  {
    min: 101,
    max: 150,
    category: "Unhealthy for Sensitive Groups",
    color: "#ff9100",
    description: "Sensitive groups may experience health effects; general public is less likely affected.",
    health: "Children, elderly, and those with respiratory issues should reduce outdoor activity.",
  },
  {
    min: 151,
    max: 200,
    category: "Unhealthy",
    color: "#ff1744",
    description: "Everyone may begin to experience health effects; sensitive groups at greater risk.",
    health: "Reduce prolonged outdoor exertion.",
  },
  {
    min: 201,
    max: 300,
    category: "Very Unhealthy",
    color: "#d500f9",
    description: "Health alert — everyone may experience serious health effects.",
    health: "Avoid prolonged outdoor exertion.",
  },
  {
    min: 301,
    max: 500,
    category: "Hazardous",
    color: "#6d1b1b",
    description: "Emergency conditions — entire population is likely affected.",
    health: "Avoid outdoor activity completely.",
  },
];

export const CATEGORY_COLORS = Object.fromEntries(
  AQI_BANDS.map((b) => [b.category, b.color])
);

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || "#64748b";
}

export function getBandForAqi(aqi) {
  const value = Math.max(0, Number(aqi) || 0);
  return (
    AQI_BANDS.find((b) => value >= b.min && value <= b.max) ||
    AQI_BANDS[AQI_BANDS.length - 1]
  );
}

export function aqiToPercent(aqi) {
  return Math.min(100, Math.max(0, (Number(aqi) / 500) * 100));
}
