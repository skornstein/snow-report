import { WeatherData, DailyForecast } from './types';

// Mount Snow Base Area approx coordinates
const LAT = 42.9602;
const LON = -72.8942;

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
    // Fetch current and daily forecast
    // Params: 
    // - current: temperature_2m, relative_humidity_2m, is_day, precipitation, rain, showers, snowfall, weather_code, wind_speed_10m, wind_direction_10m, wind_gusts_10m
    // - daily: weather_code, temperature_2m_max, temperature_2m_min, precipitation_sum, rain_sum, showers_sum, snowfall_sum, wind_speed_10m_max, wind_gusts_10m_max
    // - timezone: auto
    // - temperature_unit: fahrenheit
    // - wind_speed_unit: mph
    // - precipitation_unit: inch

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max&forecast_days=10&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York`;

    try {
        const res = await fetch(url, { next: { revalidate: 600 } } as any); // Cache for 10 mins
        if (!res.ok) throw new Error('Failed to fetch weather data');
        const data = await res.json();

        return normalizeWeatherData(data);
    } catch (error) {
        console.error('Weather fetch error:', error);
        // Return empty fallback or throw
        throw error;
    }
}

function normalizeWeatherData(data: any): WeatherData {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const dailyForecasts: DailyForecast[] = daily.time.map((date: string, i: number) => ({
        date,
        highF: Math.round(daily.temperature_2m_max[i]),
        lowF: Math.round(daily.temperature_2m_min[i]),
        windMph: Math.round(daily.wind_speed_10m_max[i]),
        precipIn: daily.precipitation_sum[i],
        snowIn: daily.snowfall_sum[i],
        conditions: decodeWeatherCode(daily.weather_code[i]),
    })).slice(0, 10); // Keep all days, UI will slice as needed

    // Process Hourly: Get next 24 hours from "now"
    const currentHourIndex = hourly.time.findIndex((t: string) => t >= current.time);
    const startIndex = currentHourIndex === -1 ? 0 : currentHourIndex;
    const next24Hours = hourly.time.slice(startIndex, startIndex + 24).map((time: string, i: number) => {
        const idx = startIndex + i;
        return {
            time,
            tempF: Math.round(hourly.temperature_2m[idx]),
            windMph: Math.round(hourly.wind_speed_10m[idx]),
            conditions: decodeWeatherCode(hourly.weather_code[idx]),
        };
    });

    return {
        currentTempF: Math.round(current.temperature_2m),
        todayHighF: Math.round(daily.temperature_2m_max[0]),
        todayLowF: Math.round(daily.temperature_2m_min[0]),
        windMph: Math.round(current.wind_speed_10m),
        windGustMph: Math.round(current.wind_gusts_10m),
        conditions: decodeWeatherCode(current.weather_code),
        daily: dailyForecasts,
        hourly: next24Hours,
        source: 'Open-Meteo',
        fetchedAt: new Date().toISOString(),
    };
}

function decodeWeatherCode(code: number): string {
    // WMO Weather interpretation codes (WW)
    // 0: Clear sky
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    // 45, 48: Fog
    // 51, 53, 55: Drizzle
    // 56, 57: Freezing Drizzle
    // 61, 63, 65: Rain
    // 66, 67: Freezing Rain
    // 71, 73, 75: Snow fall
    // 77: Snow grains
    // 80, 81, 82: Rain showers
    // 85, 86: Snow showers
    // 95: Thunderstorm
    // 96, 99: Thunderstorm with hail

    if (code === 0) return 'Sunny';
    if (code <= 3) return 'Cloudy';
    if (code <= 48) return 'Fog';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain Showers';
    if (code <= 86) return 'Snow Showers';
    return 'Storm';
}
