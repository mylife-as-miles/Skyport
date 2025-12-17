import { PassengerSegment, Venue } from '../types';
import { MOCK_VENUES } from './mockData';

// In a real Next.js Server Action, this would use fetch() to https://api.yelp.com/v3/ai/conversation
// and would hide the API key on the server.
// For this client-side demo, we simulate the latency and response parsing.

const LATENCY_MS = 2500;

export const findVenueForSegment = async (segment: PassengerSegment, location: string): Promise<Venue> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate API "thinking" and returning a result based on the prompt
      const options = MOCK_VENUES[segment];
      const randomVenue = options[Math.floor(Math.random() * options.length)];
      resolve(randomVenue);
    }, LATENCY_MS + Math.random() * 1000); // Add randomness to simulate different agent speeds
  });
};

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
