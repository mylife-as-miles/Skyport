import { ChatMessage, Venue } from '../types';
import { searchNearbyPlaces, askYelpAI } from '../app/actions/yelp';

// Realistic names to generate mock data
const VENUE_PREFIXES = ['Sky', 'Cloud', 'Aero', 'Jet', 'Terminal', 'Runway', 'Pilot', 'Horizon'];
const VENUE_TYPES = ['Grill', 'Lounge', 'Cafe', 'Bistro', 'Market', 'Bar', 'Sushi', 'Burger'];

export async function fetchAmenities(lat: number, lng: number): Promise<Venue[]> {
    try {
        // Try Real API first
        const realData = await searchNearbyPlaces(lat, lng, 'restaurants');
        if (realData && realData.length > 0) {
            return realData;
        }
    } catch (e) {
        // Ignore error and fall through to mock
    }

    // Fallback: Generate deterministic mock venues around the center
    return generateMockVenues(lat, lng);
}

function generateMockVenues(lat: number, lng: number): Venue[] {
    const venues: Venue[] = [];
    const count = 5;
    
    for (let i = 0; i < count; i++) {
        // Scatter around center
        const angle = (Math.PI * 2 * i) / count;
        const radius = 0.003 + (Math.random() * 0.002); // Small radius for "terminal" feel
        const vLat = lat + Math.sin(angle) * radius * 0.7;
        const vLng = lng + Math.cos(angle) * radius;
        
        const prefix = VENUE_PREFIXES[Math.floor(Math.random() * VENUE_PREFIXES.length)];
        const type = VENUE_TYPES[Math.floor(Math.random() * VENUE_TYPES.length)];
        
        let cat = 'Restaurant';
        if (type === 'Cafe') cat = 'Coffee';
        if (type === 'Lounge') cat = 'Lounge';
        if (type === 'Bar') cat = 'Nightlife';

        venues.push({
            id: `mock-${i}-${lat.toFixed(4)}`,
            name: `${prefix} ${type}`,
            address: `Concourse ${String.fromCharCode(65 + i)}, Gate ${10 + i}`,
            rating: 3.5 + Math.random() * 1.5,
            yelpId: `mock-venue-${i}`,
            price: Math.random() > 0.5 ? '$$' : '$$$',
            category: cat,
            imageUrl: `https://source.unsplash.com/random/300x200/?${cat.toLowerCase()},restaurant`,
            isOpen: Math.random() > 0.2, // 80% open
            distance: '0.2 mi',
            coordinates: { lat: vLat, lng: vLng }
        });
    }
    
    return venues;
}

export const MOCK_PLACES: Venue[] = []; 

// Store chat ID in module scope for the session (Client-side singleton behavior)
let currentChatId: string | undefined = undefined;

export async function sendUserMessage(text: string, location?: { lat: number, lng: number }): Promise<ChatMessage> {
  let content = '';
  let attachments: Venue[] = [];
  
  try {
    const response = await askYelpAI(text, currentChatId, location?.lat, location?.lng);
    content = response.content;
    currentChatId = response.chatId;

    // Optional: If the response implies specific places, we could parse them or do a secondary search.
    // For now, if the user asked about food, we'll auto-attach amenities nearby.
    const lowerText = text.toLowerCase();
    if ((lowerText.includes('find') || lowerText.includes('search') || lowerText.includes('near')) && location) {
        attachments = await fetchAmenities(location.lat, location.lng);
    }

  } catch (e) {
    console.error("AI Service Error", e);
    content = "I'm having trouble connecting to the SkyPort network. Please try again.";
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    role: 'assistant',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    attachments
  };
}