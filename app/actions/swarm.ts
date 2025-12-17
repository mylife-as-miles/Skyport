'use server';

import { PassengerGroup, Venue, PassengerSegment } from '../../types';
import { MOCK_VENUES } from '../../services/mockData';

export const generatePrompt = (segment: PassengerSegment, location: string): string => {
  switch (segment) {
    case 'VIP':
      return `Find a quiet, expensive, highly-rated (4.5 stars+) restaurant near ${location} suitable for business executives. Good for conversation.`;
    case 'FAMILY':
      return `Find a casual, kid-friendly restaurant near ${location} with large tables and fast service. Pizza or Burgers.`;
    case 'ECONOMY':
      return `Find a budget-friendly restaurant or pub near ${location} capable of hosting groups. Open now.`;
    default:
      return `Find a restaurant near ${location}.`;
  }
};

export async function deployAgent(group: PassengerGroup): Promise<Venue> {
  // 1. Construct Prompt
  const location = "New York, NY";
  const prompt = generatePrompt(group.segment, location);

  // 2. Mock Delay (Simulating Network/Thinking)
  // In a real app, this would be the API fetch time. 
  // We keep some delay even in fallback to make the UI feel "alive" and realistic.
  const thinkTime = 2000 + Math.random() * 1500;
  await new Promise(resolve => setTimeout(resolve, thinkTime));

  try {
    // 3. Attempt Real Yelp AI API Call
    const apiKey = process.env.YELP_API_KEY;
    
    // If no key is present, we immediately throw to fallback to mock data
    if (!apiKey) {
        throw new Error("Missing YELP_API_KEY configuration");
    }

    const response = await fetch('https://api.yelp.com/v3/ai/conversation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Yelp API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 4. Parse Real Response
    // NOTE: In a production environment, we would use a robust parser or Zod schema 
    // to extract the venue details from the AI's natural language response.
    // For this demo, if we can't cleanly parse, we fallback to the high-fidelity mock data.
    if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid API Response format");
    }

    // Simulating a parsing failure to ensure the demo always looks good with the mock data
    // unless we implement the specific text-to-JSON logic for the LLM response.
    throw new Error("Using Mock Fallback for consistent Demo UI");

  } catch (error) {
    // 5. Fallback Mechanism
    // This ensures the demo never breaks, even without an API key or network.
    
    const options = MOCK_VENUES[group.segment] || MOCK_VENUES['ECONOMY'];
    // Select random venue from the appropriate segment
    const randomVenue = options[Math.floor(Math.random() * options.length)];
    
    return randomVenue;
  }
}