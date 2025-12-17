'use server';

import { Venue } from '../../types';

interface NextFetchRequestInit extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

interface YelpBusiness {
  id: string;
  name: string;
  location?: { address1?: string };
  rating: number;
  image_url: string;
  alias: string;
  price?: string;
  categories?: { title: string }[];
  is_closed: boolean;
  distance: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export async function searchNearbyPlaces(lat: number, lng: number, category: string = 'food'): Promise<Venue[]> {
    const apiKey = process.env.YELP_API_KEY;

    if (!apiKey) {
        console.warn("Yelp API Key missing, returning empty list (will trigger mock fallback).");
        return [];
    }

    try {
        const radius = 2000; // 2km radius (~1.2 miles)
        const limit = 10;
        
        const response = await fetch(
            `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&term=${category}&radius=${radius}&sort_by=rating&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                next: { revalidate: 3600 } // Cache for 1 hour
            } as NextFetchRequestInit
        );

        if (!response.ok) {
            throw new Error(`Yelp API Error: ${response.status}`);
        }

        const data = await response.json();
        const businesses = (data.businesses || []) as YelpBusiness[];
        
        return businesses.map((b) => ({
            id: b.id,
            name: b.name,
            address: b.location?.address1 || 'Terminal Concourse',
            rating: b.rating,
            imageUrl: b.image_url,
            yelpId: b.alias,
            price: b.price || '$$',
            category: b.categories?.[0]?.title || 'Venue',
            isOpen: !b.is_closed,
            distance: `${(b.distance * 0.000621371).toFixed(1)} mi`,
            coordinates: {
                lat: b.coordinates.latitude,
                lng: b.coordinates.longitude
            }
        }));

    } catch (error) {
        console.error("Yelp Search Action Failed:", error);
        return [];
    }
}

interface YelpAIResponse {
  message: {
    content: string;
    role: string;
  };
  chat_id: string;
}

export async function askYelpAI(query: string, chatId?: string, lat?: number, lng?: number): Promise<{ content: string; chatId: string }> {
  const apiKey = process.env.YELP_API_KEY;

  if (!apiKey) {
    return {
      content: "I am running in simulation mode. Please configure the YELP_API_KEY to enable live AI responses.",
      chatId: chatId || 'simulated-chat-id'
    };
  }

  try {
    const payload: any = {
      query,
      request_context: {
        skip_text_generation: false
      }
    };

    if (chatId) {
      payload.chat_id = chatId;
    }

    if (lat && lng) {
      payload.user_context = {
        latitude: lat,
        longitude: lng
      };
    }

    const response = await fetch('https://api.yelp.com/ai/chat/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Yelp AI API Error: ${response.status}`, errText);
      throw new Error(`Yelp AI API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the response matches expected structure, fallback if it varies
    const content = data.message?.content || data.response || "I processed your request.";
    const newChatId = data.chat_id || chatId || "new-session";

    return {
      content,
      chatId: newChatId
    };

  } catch (error) {
    console.error("Yelp AI Action Failed:", error);
    return {
      content: "I encountered an error connecting to the SkyPort Neural Network (Yelp API). Please try again.",
      chatId: chatId || 'error-session'
    };
  }
}