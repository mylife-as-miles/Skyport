import { LiveFlight } from '../types';

// Default to ORD if no center provided
const DEFAULT_CENTER = { lat: 41.9742, lng: -87.9073 };

// Cache state
let lastFetchTime = 0;
let cachedFlights: LiveFlight[] = [];
let isRateLimited = false;
const CACHE_DURATION = 15000; // 15 seconds cache to be safe
const ERROR_BACKOFF = 60000; // 1 minute backoff on error

export async function fetchLiveFlights(center?: { lat: number; lng: number }): Promise<LiveFlight[]> {
  const c = center || DEFAULT_CENTER;
  const now = Date.now();

  // If we are rate limited or within cache duration, return cached or mock
  if (isRateLimited && now - lastFetchTime < ERROR_BACKOFF) {
      // console.log('Returning mock due to rate limit');
      return generateMockFlights(c.lat, c.lng);
  }

  if (now - lastFetchTime < CACHE_DURATION && cachedFlights.length > 0) {
      // console.log('Returning cached flights');
      return cachedFlights;
  }
  
  // Calculate dynamic BBOX (~0.7 degree window)
  const bbox = {
    lamin: c.lat - 0.35,
    lomin: c.lng - 0.35,
    lamax: c.lat + 0.35,
    lomax: c.lng + 0.35
  };

  try {
    // OpenSky Network API for anonymous users (limit: 400 requests/day, 10s resolution)
    // We use a timeout to fail fast if the API hangs or CORS blocks it
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://opensky-network.org/api/states/all?lamin=${bbox.lamin}&lomin=${bbox.lomin}&lamax=${bbox.lamax}&lomax=${bbox.lomax}`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 429) {
        console.warn("OpenSky Rate Limit Exceeded. Switching to simulation mode.");
        isRateLimited = true;
        lastFetchTime = now;
        return generateMockFlights(c.lat, c.lng);
    }

    if (!response.ok) {
      throw new Error(`OpenSky API Error: ${response.status}`);
    }

    const data = await response.json();
    lastFetchTime = now;
    isRateLimited = false; // Reset if successful
    
    if (!data.states) {
        cachedFlights = generateMockFlights(c.lat, c.lng);
        return cachedFlights;
    }

    const flights = data.states.map((s: any) => ({
      icao24: s[0],
      callsign: s[1].trim() || 'N/A',
      longitude: s[5],
      latitude: s[6],
      velocity: s[9] || 0,
      true_track: s[10] || 0,
      on_ground: s[8],
      altitude: s[7] || 0
    })).slice(0, 50); // Limit to 50 planes for performance

    cachedFlights = flights;
    return flights;

  } catch (error) {
    console.warn("OpenSky API unavailable, using simulation data.", error);
    // On network error, back off a bit but don't set permanent rate limit flag
    lastFetchTime = now;
    return generateMockFlights(c.lat, c.lng);
  }
}

// Deterministic simulation for demo/fallback
function generateMockFlights(centerLat: number, centerLng: number): LiveFlight[] {
  const mockFlights: LiveFlight[] = [];
  const count = 20;
  const now = Date.now() / 1000;

  for (let i = 0; i < count; i++) {
    // Create somewhat circular paths or lines based on time
    const seed = i * 100;
    const speed = 0.02 + (i % 5) * 0.005;
    const angle = (now * speed + seed) % (Math.PI * 2);
    
    const radius = 0.05 + (i % 3) * 0.08;
    const lat = centerLat + Math.sin(angle) * radius * 0.7; // Scale lat to reduce distortion
    const lng = centerLng + Math.cos(angle) * radius;

    // Calculate simulated heading (tangent to circle)
    let track = ((angle + Math.PI/2) * 180 / Math.PI) % 360;
    if (track < 0) track += 360;

    mockFlights.push({
      icao24: `sim-${i}`,
      callsign: `UA${200 + i}`,
      latitude: lat,
      longitude: lng,
      velocity: 150 + (i * 10),
      true_track: track,
      on_ground: false,
      altitude: 1000 + i * 500
    });
  }

  return mockFlights;
}
