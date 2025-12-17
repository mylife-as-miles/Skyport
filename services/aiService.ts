import { ChatMessage, Venue } from '../types';
import { searchNearbyPlaces, askYelpAI } from '../app/actions/yelp';

// Realistic names for mock data generation
const VENUE_PREFIXES = ['Sky', 'Cloud', 'Aero', 'Jet', 'Terminal', 'Runway', 'Pilot', 'Horizon', 'Voyager', 'Navigator'];
const VENUE_TYPES = ['Grill', 'Lounge', 'Cafe', 'Bistro', 'Market', 'Bar', 'Sushi', 'Burger', 'Suites', 'Inn', 'Pub'];

export async function fetchAmenities(lat: number, lng: number): Promise<Venue[]> {
    try {
        // Broaden the search to include hotels, bars, and cafes alongside restaurants
        const realData = await searchNearbyPlaces(lat, lng, 'hotels,restaurants,bars,cafes');
        if (realData && realData.length > 0) {
            return realData;
        }
    } catch (e) {
        console.warn("Real Yelp search failed, using fallback.", e);
    }

    // Fallback: Generate deterministic mock venues around the center
    return generateMockVenues(lat, lng);
}

function generateMockVenues(lat: number, lng: number): Venue[] {
    const venues: Venue[] = [];
    const count = 8;
    
    for (let i = 0; i < count; i++) {
        // Scatter around center
        const angle = (Math.PI * 2 * i) / count;
        const radius = 0.004 + (Math.random() * 0.003); 
        const vLat = lat + Math.sin(angle) * radius * 0.7;
        const vLng = lng + Math.cos(angle) * radius;
        
        const prefix = VENUE_PREFIXES[Math.floor(Math.random() * VENUE_PREFIXES.length)];
        const type = VENUE_TYPES[Math.floor(Math.random() * VENUE_TYPES.length)];
        
        let cat = 'Restaurant';
        if (type === 'Cafe') cat = 'Coffee & Tea';
        else if (type === 'Lounge' || type === 'Bar' || type === 'Pub') cat = 'Nightlife';
        else if (type === 'Suites' || type === 'Inn') cat = 'Hotels & Travel';

        venues.push({
            id: `mock-${i}-${lat.toFixed(4)}`,
            name: `${prefix} ${type}`,
            address: `Zone ${String.fromCharCode(65 + i)}, Sector ${10 + i}`,
            rating: 3.8 + Math.random() * 1.2,
            yelpId: `mock-venue-${i}`,
            price: Math.random() > 0.4 ? '$$' : '$$$',
            category: cat,
            imageUrl: `https://picsum.photos/300/200?random=${i}`,
            isOpen: Math.random() > 0.15,
            distance: `${(radius * 60).toFixed(1)} mi`,
            coordinates: { lat: vLat, lng: vLng }
        });
    }
    
    return venues;
}

export const MOCK_PLACES: Venue[] = []; 

// Store chat ID in module scope for the session
let currentChatId: string | undefined = undefined;

export async function sendUserMessage(text: string, location?: { lat: number, lng: number }): Promise<ChatMessage> {
  let content = '';
  let attachments: Venue[] = [];
  
  try {
    const response = await askYelpAI(text, currentChatId, location?.lat, location?.lng);
    content = response.content;
    currentChatId = response.chatId;

    const lowerText = text.toLowerCase();
    // Keywords to trigger amenity search
    const triggers = ['food', 'eat', 'drink', 'stay', 'hotel', 'cafe', 'coffee', 'bar', 'lounge', 'where', 'find', 'near'];
    if (triggers.some(t => lowerText.includes(t)) && location) {
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