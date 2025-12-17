import { ChatMessage, Venue } from '../types';
import { searchNearbyPlaces } from '../app/actions/yelp';
import { GoogleGenAI } from "@google/genai";

// Initialize with a mock key if missing to prevent crash, but warn
const apiKey = process.env.API_KEY || 'mock_key';
let ai: GoogleGenAI | null = null;

try {
    ai = new GoogleGenAI({ apiKey });
} catch (error) {
    console.warn("Failed to initialize GoogleGenAI:", error);
}

// Realistic names for fallback mock data generation
const VENUE_PREFIXES = ['Sky', 'Cloud', 'Aero', 'Jet', 'Terminal', 'Runway', 'Pilot', 'Horizon', 'Voyager', 'Navigator'];
const VENUE_TYPES = ['Grill', 'Lounge', 'Cafe', 'Bistro', 'Market', 'Bar', 'Sushi', 'Burger', 'Suites', 'Inn', 'Pub'];

export async function fetchAmenities(lat: number, lng: number): Promise<Venue[]> {
    try {
        const realData = await searchNearbyPlaces(lat, lng, 'hotels,restaurants,bars,cafes');
        if (realData && realData.length > 0) {
            return realData;
        }
    } catch (e) {
        console.warn("Real Yelp search failed, using fallback.", e);
    }
    return generateMockVenues(lat, lng);
}

function generateMockVenues(lat: number, lng: number): Venue[] {
    const venues: Venue[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
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

export async function sendUserMessage(text: string, location?: { lat: number, lng: number }): Promise<ChatMessage> {
  let content = '';
  let attachments: Venue[] = [];
  
  if (!ai || apiKey === 'mock_key') {
      // Return a friendly offline message if AI is not configured
      content = "I am currently offline or missing my API key. Please check your configuration. I can still track flights and show nearby places if you select an airport.";

      // Basic keyword matching for demo purposes
      const lowerText = text.toLowerCase();
      if (location && (lowerText.includes('food') || lowerText.includes('hotel'))) {
          attachments = await fetchAmenities(location.lat, location.lng);
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments
      };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Updated model
      contents: text,
      config: {
        systemInstruction: `You are SkyPort AI, a professional enterprise airline crisis management assistant. 
        Your goal is to assist stranded passengers and flight crews. 
        Be concise, professional, and high-tech in your tone. 
        Current location context: ${location ? `Lat: ${location.lat}, Lng: ${location.lng}` : 'Unknown'}.
        If the user asks for places to stay, eat, or wait, mention that you are scanning the local grid for options.`
      }
    });

    content = response.text || "Neural link stable. Awaiting further commands.";

    const lowerText = text.toLowerCase();
    const triggers = ['food', 'eat', 'drink', 'stay', 'hotel', 'cafe', 'coffee', 'bar', 'lounge', 'where', 'find', 'near'];
    if (triggers.some(t => lowerText.includes(t)) && location) {
        attachments = await fetchAmenities(location.lat, location.lng);
    }
  } catch (e) {
    console.error("Gemini AI Service Error", e);
    content = "Neural link interrupted. System is operating in restricted mode. Please check local terminal environment variables.";
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    role: 'assistant',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    attachments
  };
}
