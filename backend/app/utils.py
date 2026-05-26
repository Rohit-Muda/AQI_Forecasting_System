AQI_BANDS = [
    (0, 50, "Good", "Air quality is satisfactory."),
    (51, 100, "Moderate", "Air quality is acceptable; sensitive groups should limit prolonged outdoor exertion."),
    (101, 150, "Unhealthy for Sensitive Groups", "Sensitive groups should reduce prolonged outdoor exertion."),
    (151, 200, "Unhealthy", "Reduce prolonged outdoor exertion."),
    (201, 300, "Very Unhealthy", "Avoid prolonged outdoor exertion."),
    (301, 500, "Hazardous", "Avoid outdoor activity completely."),
]


def aqi_result(aqi: int) -> tuple[str, str]:
    value = max(0, int(aqi))
    for low, high, category, advice in AQI_BANDS:
        if low <= value <= high:
            return category, advice
    return "Hazardous", "Avoid outdoor activity completely."
