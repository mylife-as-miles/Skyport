import { LiveFlight } from '../types';

// Default to ORD if no center provided
const DEFAULT_CENTER = { lat: 41.9742, lng: -87.9073 };

export async function fetchLiveFlights(center?: { lat: number; lng: number }): Promise<LiveFlight[]> {
  const c = center || DEFAULT_CENTER;
  
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
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const url = `https://opensky-network.org/api/states/all?lamin=${bbox.lamin}&lomin=${bbox.lomin}&lamax=${bbox.lamax}&lomax=${bbox.lomax}`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenSky API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.states) return generateMockFlights(c.lat, c.lng);

    return data.states.map((s: any) => ({
      icao24: s[0],
      callsign: s[1].trim() || 'N/A',
      longitude: s[5],
      latitude: s[6],
      velocity: s[9] || 0,
      true_track: s[10] || 0,
      on_ground: s[8],
      altitude: s[7] || 0
    })).slice(0, 50); // Limit to 50 planes for performance

  } catch (error) {
    // console.warn("OpenSky API unavailable, using simulation data.", error);
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