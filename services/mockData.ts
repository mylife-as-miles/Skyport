import { PassengerGroup, Venue } from '../types';

export const INITIAL_PASSENGERS: PassengerGroup[] = [
  {
    id: 'PAX-001',
    name: 'Sterling Archer (CEO)',
    count: 1,
    segment: 'VIP',
    status: 'STRANDED',
  },
  {
    id: 'PAX-002',
    name: 'Robinson Family',
    count: 5,
    segment: 'FAMILY',
    status: 'STRANDED',
  },
  {
    id: 'PAX-003',
    name: 'Flight Crew UA492',
    count: 8,
    segment: 'ECONOMY',
    status: 'STRANDED',
  },
  {
    id: 'PAX-004',
    name: 'Ms. Lana Kane',
    count: 1,
    segment: 'VIP',
    status: 'STRANDED',
  },
  {
    id: 'PAX-005',
    name: 'Soccer Team "Cyclones"',
    count: 18,
    segment: 'ECONOMY',
    status: 'STRANDED',
  },
];

export const MOCK_VENUES: Record<string, Venue[]> = {
  VIP: [
    {
      id: "v-vip-1",
      name: "Le Bernardin",
      address: "155 W 51st St",
      rating: 4.8,
      yelpId: "vip-1",
      price: "$$$$",
      category: "Seafood",
      isOpen: true,
      distance: "0.3 mi",
      imageUrl: "https://picsum.photos/200/200?random=1"
    },
    {
      id: "v-vip-2",
      name: "Per Se",
      address: "10 Columbus Circle",
      rating: 4.7,
      yelpId: "vip-2",
      price: "$$$$",
      category: "French",
      isOpen: false,
      distance: "0.5 mi",
      imageUrl: "https://picsum.photos/200/200?random=2"
    }
  ],
  FAMILY: [
    {
      id: "v-fam-1",
      name: "Luigi's Big Pizza",
      address: "42 Broadway",
      rating: 4.2,
      yelpId: "fam-1",
      price: "$$",
      category: "Pizza",
      isOpen: true,
      distance: "0.1 mi",
      imageUrl: "https://picsum.photos/200/200?random=3"
    },
    {
      id: "v-fam-2",
      name: "Dave & Buster's",
      address: "234 42nd St",
      rating: 4.0,
      yelpId: "fam-2",
      price: "$$",
      category: "Arcade",
      isOpen: true,
      distance: "0.8 mi",
      imageUrl: "https://picsum.photos/200/200?random=4"
    }
  ],
  ECONOMY: [
    {
      id: "v-eco-1",
      name: "The Hangar Pub",
      address: "Terminal C",
      rating: 3.8,
      yelpId: "eco-1",
      price: "$",
      category: "Pub",
      isOpen: true,
      distance: "0.0 mi",
      imageUrl: "https://picsum.photos/200/200?random=5"
    },
    {
      id: "v-eco-2",
      name: "Metro Diner",
      address: "100 Main St",
      rating: 4.1,
      yelpId: "eco-2",
      price: "$",
      category: "Diner",
      isOpen: true,
      distance: "1.2 mi",
      imageUrl: "https://picsum.photos/200/200?random=6"
    }
  ]
};