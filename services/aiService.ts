import { ChatMessage, Venue, MapCommand } from '../types';
import { searchNearbyPlaces, askYelpAI } from '../app/actions/yelp';
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
  let command: MapCommand | undefined;
  
  if (!ai || apiKey === 'mock_key') {
      content = "I am currently offline or missing my API key. Please check your configuration. I can still track flights and show nearby places if you select an airport.";
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

  // Check if query is best served by Yelp AI (e.g., specific venue questions, comparisons, discovery)
  const lowerText = text.toLowerCase();
  const yelpKeywords = ['find', 'recommend', 'restaurant', 'cafe', 'hotel', 'bar', 'food', 'place', 'near', 'reservation', 'price'];
  const isYelpQuery = yelpKeywords.some(k => lowerText.includes(k));

  if (isYelpQuery && location) {
       // Hybrid Approach: Ask Yelp AI for the content
       try {
           const yelpResponse = await askYelpAI(text, undefined, location.lat, location.lng);
           content = yelpResponse.content;

           // Still try to fetch markers for the map if relevant
           if (lowerText.includes('find') || lowerText.includes('recommend') || lowerText.includes('near')) {
              attachments = await fetchAmenities(location.lat, location.lng);
           }

           return {
                id: Math.random().toString(36).substr(2, 9),
                role: 'assistant',
                content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                attachments
           };
       } catch (e) {
           console.warn("Yelp AI failed, falling back to Gemini", e);
       }
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

        **FLIGHT STATUS AWARENESS:**
        You can now filter flights based on their live status:
        - HOLDING: Flights circling or moving slowly at altitude (potential delays).
        - LANDING: Flights descending below 1500m.
        - DEPARTING: Flights climbing below 1500m.
        - CRUISING: Flights in level flight.
        - GROUNDED: Flights on the ground.

        Use this knowledge to answer queries like "Any flights holding?" or "Is flight UA123 landing?".

        **CAPABILITIES:**
        1. You can control the map interface. To do so, output a valid JSON block at the very end of your response.
        2. To Move the Map: {"type": "FLY_TO", "target": {"lat": 40.7128, "lng": -74.0060, "label": "New York"}}
        3. To Scan for Amenities: {"type": "SCAN_AREA", "query": "hotels"} (Use this if the user asks for places, but try to move the map first if a location is mentioned).

        If the user mentions a specific city or airport code (e.g., JFK, London, Tokyo), GENERATE the coordinates for that location in the JSON block.
        If the user asks for places to stay, eat, or wait, mention that you are scanning the local grid for options.`
      }
    });

    const rawText = response.text || "Neural link stable. Awaiting further commands.";

    const jsonMatch = rawText.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
        try {
            const potentialCommand = JSON.parse(jsonMatch[0]);
            if (potentialCommand.type === 'FLY_TO' || potentialCommand.type === 'SCAN_AREA') {
                command = potentialCommand;
                content = rawText.replace(jsonMatch[0], '').trim();
            } else {
                content = rawText;
            }
        } catch (e) {
            console.warn("Failed to parse AI command JSON", e);
            content = rawText;
        }
    } else {
        content = rawText;
    }

    if (command?.type === 'SCAN_AREA' && location) {
         attachments = await fetchAmenities(location.lat, location.lng);
    }
    else if (!command && isYelpQuery && location) {
        // Fallback for attachments if Gemini handled the text but it was place-related
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
    attachments,
    command
  };
}
