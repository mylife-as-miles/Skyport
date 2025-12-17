export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: string;
}

export const getWeather = async (): Promise<WeatherData> => {
  try {
    // Fetch latest observations for KORD (Chicago O'Hare) from National Weather Service
    const response = await fetch('https://api.weather.gov/stations/KORD/observations/latest', {
      headers: {
        'User-Agent': 'SkyPortAI/1.0 (demo@skyport.ai)'
      }
    });

    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const data = await response.json();
    const props = data.properties;

    // Convert Celsius to Fahrenheit
    const tempC = props.temperature.value;
    const tempF = tempC !== null ? Math.round((tempC * 9/5) + 32) : 0;

    // Convert m/s (or km/h) to Knots. NWS usually returns value in unitCode "wmoUnit:m/s" or similar, 
    // but the 'value' property is the raw number. Assuming m/s or similar standard metric.
    // 1 m/s = 1.94384 knots.
    const windSpeedMs = props.windSpeed.value || 0;
    const windKnots = Math.round(windSpeedMs * 1.94384);

    // Visibility is usually in meters
    const visMiles = props.visibility.value 
      ? (props.visibility.value / 1609.34).toFixed(1) 
      : 'N/A';

    return {
      temp: tempF,
      condition: (props.textDescription || 'Unknown').toUpperCase(),
      humidity: Math.round(props.relativeHumidity.value || 0),
      windSpeed: windKnots,
      visibility: `${visMiles} mi`
    };

  } catch (error) {
    console.warn("Weather API unreachable, using fallback data:", error);
    // Fallback mock data if API fails
    return {
      temp: 58,
      condition: 'OVERCAST // OFFLINE',
      humidity: 65,
      windSpeed: 8,
      visibility: '10.0 mi'
    };
  }
};