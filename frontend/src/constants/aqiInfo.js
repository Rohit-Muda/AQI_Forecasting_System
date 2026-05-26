export const AQI_INTRO = {
  title: "What is the Air Quality Index (AQI)?",
  paragraphs: [
    "The Air Quality Index (AQI) is a standardized scale that translates pollutant concentrations into a single number so the public can quickly understand air quality and health risk.",
    "This app uses the US EPA AQI scale (0–500). Higher values mean worse air quality. Forecasts are powered by machine learning trained on Indian city data with weather and pollutant features.",
  ],
};

export const POLLUTANTS = [
  {
    id: "pm25",
    name: "PM2.5",
    fullName: "Fine particulate matter",
    unit: "µg/m³",
    about:
      "Particles smaller than 2.5 micrometers. They penetrate deep into lungs and bloodstream, often from combustion, dust, and industrial sources.",
    impact: "Major driver of respiratory and cardiovascular illness.",
  },
  {
    id: "pm10",
    name: "PM10",
    fullName: "Coarse particulate matter",
    unit: "µg/m³",
    about:
      "Particles up to 10 micrometers — dust, pollen, and smoke. Can irritate eyes, nose, and throat.",
    impact: "Worsens asthma and visibility on hazy days.",
  },
  {
    id: "no2",
    name: "NO₂",
    fullName: "Nitrogen dioxide",
    unit: "µg/m³",
    about: "Gas from vehicle exhaust and power plants. Contributes to smog and acid rain.",
    impact: "Inflames airways; harmful for children and people with asthma.",
  },
  {
    id: "so2",
    name: "SO₂",
    fullName: "Sulfur dioxide",
    unit: "µg/m³",
    about: "Released from burning fossil fuels containing sulfur (coal, oil).",
    impact: "Causes breathing difficulty and acid rain formation.",
  },
  {
    id: "co",
    name: "CO",
    fullName: "Carbon monoxide",
    unit: "µg/m³",
    about: "Odourless gas from incomplete combustion (vehicles, fires).",
    impact: "Reduces oxygen delivery in the body at high levels.",
  },
  {
    id: "o3",
    name: "O₃",
    fullName: "Ground-level ozone",
    unit: "µg/m³",
    about:
      "Formed when pollutants react in sunlight — not the same as the protective ozone layer high in the atmosphere.",
    impact: "Triggers chest pain, coughing, and lung damage with prolonged exposure.",
  },
];

export const WEATHER_FACTORS = [
  {
    name: "Temperature",
    detail: "Affects chemical reactions that form pollutants like ozone.",
  },
  {
    name: "Humidity",
    detail: "High humidity can trap particles and change how pollution disperses.",
  },
  {
    name: "Pressure & wind",
    detail: "Wind disperses pollutants; stagnant air allows buildup.",
  },
  {
    name: "Rainfall",
    detail: "Rain can wash particulates from the air, temporarily improving AQI.",
  },
];

export const HOW_IT_WORKS = [
  "Enter your city, current weather readings, and pollutant concentrations.",
  "The model applies the same preprocessing used during training (encoding, time features).",
  "XGBoost predicts US AQI based on patterns learned from historical Indian air quality data.",
  "Results include an AQI category and health guidance aligned with EPA breakpoints.",
];
