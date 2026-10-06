import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.API_URL || import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 15000,
});

export async function fetchCities() {
  const { data } = await client.get("/cities");
  return data.cities;
}

export async function predictAQI(payload) {
  const { data } = await client.post("/predict", payload);
  return data;
}

export async function fetchAutofill(city) {
  const { data } = await client.get("/autofill", { params: { city } });
  return data;
}

export async function fetchForecast(city) {
  const { data } = await client.get("/forecast", { params: { city } });
  return data;
}

export function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  if (error.request) return "Cannot reach the API. Start the backend on port 8000.";
  return error.message || "Request failed.";
}
