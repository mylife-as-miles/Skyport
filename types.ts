// Legacy Types for Compatibility with CyberMap
export type PassengerSegment = 'VIP' | 'FAMILY' | 'ECONOMY';
export type PassengerStatus = 'STRANDED' | 'ANALYZING' | 'BOOKED' | 'FAILED';

export interface PassengerGroup {
  id: string;
  name: string;
  count: number;
  segment: PassengerSegment;
  status: PassengerStatus;
  assignedVenue?: Venue;
}

export type LogType = 'INFO' | 'SUCCESS' | 'ERROR' | 'YELP_API' | 'SYSTEM';
export interface AgentLog {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
  passengerId?: string;
}

// New Travel Assistant Types
export interface Venue {
  id: string;
  name: string;
  address: string;
  rating: number;
  imageUrl?: string;
  yelpId: string;
  price?: string;
  category: string;
  isOpen: boolean;
  distance: string; // e.g., "0.4 mi"
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: Venue[]; // Places recommended in this turn
}

export interface LiveFlight {
  icao24: string;
  callsign: string;
  longitude: number;
  latitude: number;
  velocity: number; // m/s
  true_track: number; // degrees
  on_ground: boolean;
  altitude: number; // meters
}