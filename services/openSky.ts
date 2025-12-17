import { LiveFlight, FlightPhase } from '../types';

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
      return generateMockFlights(c.lat, c.lng);
  }

  if (now - lastFetchTime < CACHE_DURATION && cachedFlights.length > 0) {
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
    // OpenSky Network API
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

    const flights: LiveFlight[] = data.states.map((s: any) => {
        const flight: LiveFlight = {
            icao24: s[0],
            callsign: s[1].trim() || 'N/A',
            longitude: s[5],
            latitude: s[6],
            velocity: s[9] || 0,
            true_track: s[10] || 0,
            on_ground: s[8],
            altitude: s[7] || 0,
            vertical_rate: s[11] || 0
        };
        flight.status = determineFlightStatus(flight);
        return flight;
    }).slice(0, 50);

    cachedFlights = flights;
    return flights;

  } catch (error) {
    console.warn("OpenSky API unavailable, using simulation data.", error);
    lastFetchTime = now;
    return generateMockFlights(c.lat, c.lng);
  }
}

function determineFlightStatus(flight: LiveFlight): FlightPhase {
    if (flight.on_ground) return 'Grounded';

    const vRate = flight.vertical_rate || 0;
    const alt = flight.altitude;
    const speed = flight.velocity;

    // Climbing / Departing
    if (vRate > 2.0) {
        return alt < 1500 ? 'Departing' : 'Climbing';
    }

    // Descending / Landing
    if (vRate < -2.0) {
        return alt < 1500 ? 'Landing' : 'Descending';
    }

    // Holding (Heuristic: Low speed, not climbing/descending much, moderate altitude)
    // 110 m/s is approx 213 knots. Holding speeds usually 200-265 knots.
    if (speed < 110 && alt > 1000) {
        return 'Holding';
    }

    return 'Cruising';
}

// Deterministic simulation for demo/fallback
function generateMockFlights(centerLat: number, centerLng: number): LiveFlight[] {
  const mockFlights: LiveFlight[] = [];
  const count = 20;
  const now = Date.now() / 1000;

  for (let i = 0; i < count; i++) {
    const seed = i * 100;
    const speed = 0.02 + (i % 5) * 0.005;
    const angle = (now * speed + seed) % (Math.PI * 2);
    
    const radius = 0.05 + (i % 3) * 0.08;
    const lat = centerLat + Math.sin(angle) * radius * 0.7;
    const lng = centerLng + Math.cos(angle) * radius;

    let track = ((angle + Math.PI/2) * 180 / Math.PI) % 360;
    if (track < 0) track += 360;

    // Simulate different phases based on index
    let vRate = 0;
    let alt = 1000 + i * 500;
    let vel = 150 + (i * 10);
    let onGround = false;

    if (i % 5 === 0) { vRate = 5; alt = 500; } // Departing
    else if (i % 5 === 1) { vRate = -5; alt = 800; } // Landing
    else if (i % 5 === 2) { vel = 100; vRate = 0; alt = 3000; } // Holding
    else if (i % 5 === 3) { onGround = true; alt = 0; vel = 0; } // Grounded

    const flight: LiveFlight = {
      icao24: `sim-${i}`,
      callsign: `UA${200 + i}`,
      latitude: lat,
      longitude: lng,
      velocity: vel,
      true_track: track,
      on_ground: onGround,
      altitude: alt,
      vertical_rate: vRate
    };

    flight.status = determineFlightStatus(flight);
    mockFlights.push(flight);
  }

  return mockFlights;
}
