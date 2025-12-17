import React, { useState, useEffect, useRef } from 'react';
import { Radio, LocateFixed, Search, Radar, MapPin, X, Plane, Globe, ChevronDown, Crosshair, Utensils, Maximize2, Minimize2, ZoomIn, ZoomOut, Home, Activity, ShieldAlert, Cpu } from 'lucide-react';
import L from 'leaflet';
import { PassengerGroup, LiveFlight, Venue } from '../types';
import { fetchLiveFlights } from '../services/openSky';
import { fetchAmenities } from '../services/aiService';
import { US_AIRPORTS, Airport } from '../services/airportData';
import { AnimatePresence, motion } from 'framer-motion';

const MotionDiv = motion.div as any;

const INITIAL_CENTER = US_AIRPORTS.find(a => a.code === 'ORD')?.coords || [41.9742, -87.9073];

interface CyberMapProps {
  passengers: PassengerGroup[];
  searchQuery?: string;
  onMapMove?: (center: { lat: number, lng: number }) => void;
}

export default function CyberMap({ passengers, searchQuery, onMapMove }: CyberMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for map objects
  const aircraftMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const trailsRef = useRef<{ [key: string]: L.Polyline }>({});
  const positionHistoryRef = useRef<{ [key: string]: [number, number][] }>({});
  const airportMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const amenityMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const zoneLayerRef = useRef<L.LayerGroup | null>(null);

  // Refs for Simulation
  const flightsRef = useRef<LiveFlight[]>([]);
  const lastFrameTime = useRef<number>(0);
  const animFrameId = useRef<number>(0);
  
  // UI State
  const [loadingRadar, setLoadingRadar] = useState(true);
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<LiveFlight | null>(null);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'AIR' | 'GND'>('ALL');
  const [isExpanded, setIsExpanded] = useState(false);
  const [radarTick, setRadarTick] = useState(0);
  
  // Navigation State
  const [mapCenter, setMapCenter] = useState<[number, number]>(INITIAL_CENTER as [number, number]);
  const [showAirportList, setShowAirportList] = useState(false);
  const [airportSearch, setAirportSearch] = useState('');

  // --- 1. INITIALIZE MAP ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
        center: mapCenter,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true
    });

    // Dark Matter Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Initialize Layers
    zoneLayerRef.current = L.layerGroup().addTo(map);

    // --- Events ---
    map.on('moveend', () => {
        const c = map.getCenter();
        const newCenter: [number, number] = [c.lat, c.lng];
        setMapCenter(newCenter); 
        if (onMapMove) {
            onMapMove({ lat: c.lat, lng: c.lng });
        }
    });

    // --- Render Airports ---
    US_AIRPORTS.forEach(airport => {
        const icon = L.divIcon({
            className: 'airport-icon',
            html: `<div class="w-3 h-3 bg-slate-900 border border-emerald-500 rounded-sm rotate-45 flex items-center justify-center hover:bg-emerald-900 transition-colors shadow-[0_0_8px_#10b981] group cursor-pointer">
                    <div class="w-0.5 h-0.5 bg-emerald-400 rounded-full group-hover:scale-150 transition-transform"></div>
                   </div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const marker = L.marker(airport.coords, { icon })
            .addTo(map)
            .on('click', () => {
                handleAirportSelect(airport);
            });
            
        airportMarkersRef.current[airport.code] = marker;
    });

    mapRef.current = map;

    const initialAirport = US_AIRPORTS.find(a => a.code === 'ORD');
    if (initialAirport) {
        setSelectedAirport(initialAirport);
        highlightAirportZone(initialAirport, map);
        loadAmenities(initialAirport.coords);
    }
    
    if (onMapMove) {
        onMapMove({ lat: mapCenter[0], lng: mapCenter[1] });
    }

    return () => {
        map.remove();
        mapRef.current = null;
    };
  }, []);

  // --- RESIZE HANDLER ---
  useEffect(() => {
      const resizeObserver = new ResizeObserver(() => {
          if (mapRef.current) {
              mapRef.current.invalidateSize();
          }
      });
      if (containerRef.current) {
          resizeObserver.observe(containerRef.current);
      }
      return () => resizeObserver.disconnect();
  }, []);

  // --- KEYBOARD & ZOOM HANDLERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        toggleFullScreen();
      }
      if (e.key.toLowerCase() === 'f' && e.target === document.body) {
        toggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleHome = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(INITIAL_CENTER as [number, number], 12, { animate: true });
  };

  // --- 2. FETCH FLIGHT DATA LOOP ---
  useEffect(() => {
    let isMounted = true;
    
    const fetchNow = async () => {
        try {
            const data = await fetchLiveFlights({ lat: mapCenter[0], lng: mapCenter[1] });
            if (!isMounted) return;
            flightsRef.current = data; 
            setLoadingRadar(false);
            setRadarTick(t => t + 1); // Signal that we have fresh data for markers
        } catch (e) {
            console.error("Flight fetch failed", e);
        }
    };

    fetchNow();
    const interval = setInterval(fetchNow, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [mapCenter]);

  // --- 3. AMENITY LOADER ---
  const loadAmenities = async (coords: [number, number]) => {
      if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return;
      setLoadingAmenities(true);
      
      // Remove existing markers
      Object.values(amenityMarkersRef.current).forEach((m: L.Marker) => m.remove());
      amenityMarkersRef.current = {};

      const venues = await fetchAmenities(coords[0], coords[1]);
      
      if (!mapRef.current) return;

      venues.forEach(place => {
          if (!place.coordinates) return;
          
          let iconContent = '🍴';
          let borderColor = 'border-blue-500';
          let glowColor = 'shadow-blue-500/50';

          const cat = place.category.toLowerCase();

          if (cat.includes('coffee') || cat.includes('cafe')) {
              iconContent = '☕';
              borderColor = 'border-orange-400';
              glowColor = 'shadow-orange-400/50';
          } else if (cat.includes('hotel') || cat.includes('travel') || cat.includes('lodging')) {
              iconContent = '🏨';
              borderColor = 'border-emerald-400';
              glowColor = 'shadow-emerald-400/50';
          } else if (cat.includes('bar') || cat.includes('nightlife') || cat.includes('pub') || cat.includes('lounge')) {
              iconContent = '🍺';
              borderColor = 'border-purple-400';
              glowColor = 'shadow-purple-400/50';
          } else if (cat.includes('lounge')) {
              iconContent = '🍸';
              borderColor = 'border-cyan-400';
              glowColor = 'shadow-cyan-400/50';
          }

          const icon = L.divIcon({
              className: 'amenity-icon',
              html: `<div class="w-6 h-6 bg-slate-950 ${borderColor} border rounded-full flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(0,0,0,0.5)] ${glowColor} hover:scale-125 transition-all cursor-pointer">
                       ${iconContent}
                     </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
          });

          const marker = L.marker([place.coordinates.lat, place.coordinates.lng], { icon })
              .addTo(mapRef.current!)
              .on('click', () => {
                  setSelectedVenue(place);
                  setSelectedFlight(null);
                  setSelectedAirport(null);
              });
          
          amenityMarkersRef.current[place.id] = marker;
      });

      setLoadingAmenities(false);
  };

  // --- 4. NAVIGATION HANDLER ---
  const handleAirportSelect = (airport: Airport) => {
      if (!mapRef.current) return;
      
      setSelectedAirport(airport);
      setSelectedFlight(null); 
      setSelectedVenue(null);
      setMapCenter(airport.coords);
      setShowAirportList(false);
      setLoadingRadar(true);
      
      flightsRef.current = [];
      Object.values(trailsRef.current).forEach((t: L.Polyline) => t.remove());
      trailsRef.current = {};
      positionHistoryRef.current = {};

      mapRef.current.flyTo(airport.coords, 13, { 
          animate: true, 
          duration: 1.5 
      });
      
      highlightAirportZone(airport, mapRef.current);
      loadAmenities(airport.coords);
      
      if (onMapMove) onMapMove({ lat: airport.coords[0], lng: airport.coords[1] });
  };

  const handleFlightClick = (flight: LiveFlight) => {
    if (!flight) return;
    // Always find the freshest data from the ref to ensure coordinates are up to date
    const latest = flightsRef.current.find(f => f.icao24 === flight.icao24) || flight;
    setSelectedFlight(latest);
    setSelectedAirport(null); 
    setSelectedVenue(null);
    
    // Proactively scan for amenities near flight position
    if (latest.latitude && latest.longitude) {
        loadAmenities([latest.latitude, latest.longitude]);
    }
  };
  
  const highlightAirportZone = (airport: Airport, map: L.Map) => {
      if (!zoneLayerRef.current) return;
      zoneLayerRef.current.clearLayers();

      const pulseIcon = L.divIcon({
          className: 'zone-pulse',
          html: '<div class="w-[300px] h-[300px] rounded-full border border-yellow-500/30 bg-yellow-500/5 animate-ping-slow pointer-events-none"></div>',
          iconSize: [300, 300],
          iconAnchor: [150, 150]
      });
      L.marker(airport.coords, { icon: pulseIcon, zIndexOffset: -100 }).addTo(zoneLayerRef.current);

      L.circle(airport.coords, {
          radius: 3000,
          color: '#eab308',
          weight: 1,
          dashArray: '5, 10',
          fillColor: '#eab308',
          fillOpacity: 0.05
      }).addTo(zoneLayerRef.current);
  };

  const toggleFullScreen = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => {
        mapRef.current?.invalidateSize();
    }, 100);
  };

  // --- 5. ANIMATION LOOP ---
  useEffect(() => {
    const animate = (time: number) => {
        if (lastFrameTime.current !== 0) {
            const dt = (time - lastFrameTime.current) / 1000;
            const safeDt = Math.min(dt, 0.5);

            flightsRef.current.forEach(flight => {
                const metersPerDegLat = 111111;
                const metersPerDegLng = 111111 * Math.cos(flight.latitude * (Math.PI / 180));
                
                const speedFactor = 1.0; 
                const vLat = flight.velocity * Math.cos(flight.true_track * (Math.PI / 180)) * speedFactor;
                const vLng = flight.velocity * Math.sin(flight.true_track * (Math.PI / 180)) * speedFactor;

                flight.latitude += (vLat * safeDt) / metersPerDegLat;
                flight.longitude += (vLng * safeDt) / metersPerDegLng;

                const shouldShow = viewFilter === 'ALL' || 
                                 (viewFilter === 'GND' && flight.on_ground) || 
                                 (viewFilter === 'AIR' && !flight.on_ground);
                
                if (!shouldShow) return;

                if (!positionHistoryRef.current[flight.icao24]) {
                    positionHistoryRef.current[flight.icao24] = [];
                }
                const hist = positionHistoryRef.current[flight.icao24];
                hist.push([flight.latitude, flight.longitude]);
                if (hist.length > 30) hist.shift(); 

                if (!trailsRef.current[flight.icao24] && mapRef.current) {
                    trailsRef.current[flight.icao24] = L.polyline(hist, {
                        color: '#64748b', 
                        weight: 2,
                        opacity: 0.4,
                        dashArray: '2, 6', 
                        className: 'trajectory-path'
                    }).addTo(mapRef.current);
                } else if (trailsRef.current[flight.icao24]) {
                    trailsRef.current[flight.icao24].setLatLngs(hist);
                }

                const marker = aircraftMarkersRef.current[flight.icao24];
                if (marker) {
                    marker.setLatLng([flight.latitude, flight.longitude]);
                    const el = marker.getElement();
                    if (el) {
                        const iconDiv = el.querySelector('.plane-svg-container') as HTMLElement;
                        if (iconDiv) {
                            iconDiv.style.transform = `rotate(${flight.true_track}deg)`;
                        }
                    }
                }
            });
        }
        lastFrameTime.current = time;
        animFrameId.current = requestAnimationFrame(animate);
    };
    animFrameId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameId.current);
  }, [viewFilter]);

  // --- 6. RENDER AIRCRAFT MARKERS ---
  useEffect(() => {
    if (!mapRef.current) return;

    const visibleFlights = flightsRef.current.filter(f => {
        if (viewFilter === 'ALL') return true;
        if (viewFilter === 'AIR') return !f.on_ground;
        if (viewFilter === 'GND') return f.on_ground;
        return true;
    });

    const visibleIds = new Set(visibleFlights.map(f => f.icao24));

    visibleFlights.forEach(flight => {
        const isSelected = selectedFlight?.icao24 === flight.icao24;
        const scale = Math.min(1.2, Math.max(0.8, flight.altitude / 10000 + 0.5));
        
        const getIconHtml = (selected: boolean) => `
            <div class="relative w-8 h-8 flex items-center justify-center group cursor-pointer" style="transform: scale(${scale})">
                <div class="plane-svg-container transition-all duration-500 ease-out will-change-transform" style="transform: rotate(${flight.true_track}deg)">
                    <svg viewBox="0 0 24 24" fill="${selected ? '#3b82f6' : '#94a3b8'}" stroke="none" class="w-full h-full drop-shadow-md hover:fill-blue-400 transition-colors">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                </div>
                ${selected ? '<div class="absolute -inset-4 border border-blue-500 rounded-full animate-ping opacity-50"></div>' : ''}
            </div>
        `;

        const existingMarker = aircraftMarkersRef.current[flight.icao24];

        if (!existingMarker) {
            const icon = L.divIcon({
                className: 'aircraft-icon',
                html: getIconHtml(isSelected),
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([flight.latitude, flight.longitude], { icon, zIndexOffset: 100 })
                .addTo(mapRef.current!)
                .on('click', () => handleFlightClick(flight));

            aircraftMarkersRef.current[flight.icao24] = marker;
        } else {
            const icon = L.divIcon({ 
                className: 'aircraft-icon', 
                html: getIconHtml(isSelected), 
                iconSize: [32, 32], 
                iconAnchor: [16, 16] 
            });
            existingMarker.setIcon(icon);
            existingMarker.setZIndexOffset(isSelected ? 1000 : 100);
            // Re-bind click listener with current flight closure data
            existingMarker.off('click').on('click', () => handleFlightClick(flight));
        }
    });

    Object.keys(aircraftMarkersRef.current).forEach(id => {
        if (!visibleIds.has(id)) {
            const marker = aircraftMarkersRef.current[id];
            if (marker) {
                marker.remove();
                delete aircraftMarkersRef.current[id];
            }
            const trail = trailsRef.current[id];
            if (trail) {
                trail.remove();
                delete trailsRef.current[id];
            }
        }
    });
  }, [selectedFlight, flightsRef.current.length, viewFilter, radarTick]);

  // --- 7. EXTERNAL SEARCH SYNC ---
  useEffect(() => {
      if (searchQuery && flightsRef.current.length > 0) {
          const target = flightsRef.current.find(f => 
              f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) || 
              f.icao24.includes(searchQuery.toLowerCase())
          );
          if (target) {
              handleFlightClick(target);
              if (mapRef.current) mapRef.current.setView([target.latitude, target.longitude], 13, { animate: true });
          }
      }
  }, [searchQuery]);

  const filteredAirports = US_AIRPORTS.filter(a => 
      a.code.includes(airportSearch.toUpperCase()) || 
      a.name.toLowerCase().includes(airportSearch.toLowerCase()) ||
      a.city.toLowerCase().includes(airportSearch.toLowerCase())
  );

  return (
    <div className={`${isExpanded ? 'fixed inset-0 w-screen h-screen z-[9999] rounded-none' : 'relative w-full h-[400px] lg:h-full rounded-lg border border-green-900/50 shadow-[0_0_40px_rgba(0,0,0,0.8)]'} bg-slate-950 overflow-hidden border-glow group transition-all duration-500`}>
      <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />
      
      {/* HUD Styles & Effects */}
      <style>{`
        @keyframes flow { to { stroke-dashoffset: -12; } }
        .trajectory-path { animation: flow 1s linear infinite; }
        @keyframes ping-slow {
             0% { transform: scale(0.8); opacity: 0.3; }
             100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-slow { animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .tactical-grid {
            background-image: 
                linear-gradient(rgba(34, 197, 94, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.05) 1px, transparent 1px);
            background-size: 50px 50px;
        }
      `}</style>

      {/* Fullscreen HUD Overlays */}
      <AnimatePresence>
        {isExpanded && (
          <>
            <MotionDiv 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 tactical-grid pointer-events-none z-[5]"
            />
            
            {/* Tactical Corners */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-blue-500/40 pointer-events-none z-10" />
            <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-blue-500/40 pointer-events-none z-10" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-blue-500/40 pointer-events-none z-10" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-blue-500/40 pointer-events-none z-10" />

            {/* Tactical HUD Header */}
            <MotionDiv 
              initial={{ y: -50 }} 
              animate={{ y: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-8 px-6 py-2 bg-slate-950/80 border border-slate-700 rounded-full backdrop-blur-md z-20 shadow-2xl"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">TRAFFIC: <span className="text-emerald-400">{flightsRef.current.length}</span></span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-mono font-bold text-slate-200">SECTOR: <span className="text-yellow-400">{selectedAirport?.code || 'SCANNING'}</span></span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono font-bold text-slate-200">SYSTEM: <span className="text-blue-400">READY</span></span>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loadingRadar && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] px-4 py-1 bg-black/60 backdrop-blur rounded-full border border-green-900/50 flex items-center gap-2">
             <Radar className="w-3 h-3 text-green-500 animate-spin" />
             <span className="text-[10px] font-mono text-green-400">ACQUIRING_SAT_FEED...</span>
          </div>
      )}

      {/* --- MAP CONTROLS (Filter) --- */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        <div className="flex bg-slate-900/90 border border-slate-700 rounded-lg p-1 gap-1 backdrop-blur-md shadow-lg">
           {(['ALL', 'AIR', 'GND'] as const).map((mode) => (
             <button
               key={mode}
               onClick={() => setViewFilter(mode)}
               className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                 viewFilter === mode 
                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                 : 'text-slate-400 hover:text-white hover:bg-slate-800'
               }`}
             >
               {mode}
             </button>
           ))}
        </div>
      </div>
      
      {/* --- SECTOR SELECTOR & FULLSCREEN (Top Right) --- */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2">
         <div className="flex items-center gap-2">
            <button
                onClick={toggleFullScreen}
                className={`flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-600 rounded-lg text-xs font-mono text-slate-200 hover:border-blue-500 hover:text-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all backdrop-blur-md ${isExpanded ? 'bg-red-900/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''}`}
                title={isExpanded ? "Exit Fullscreen (Esc)" : "Fullscreen (F)"}
            >
                {isExpanded ? (
                    <>
                        <Minimize2 className="w-3 h-3" />
                        <span className="font-bold">EXIT FULLSCREEN</span>
                    </>
                ) : (
                    <Maximize2 className="w-4 h-4" />
                )}
            </button>

             <button 
               onClick={() => setShowAirportList(!showAirportList)}
               className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-600 rounded-lg text-xs font-mono text-slate-200 hover:border-blue-500 hover:text-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all backdrop-blur-md"
             >
                 <Globe className="w-3 h-3" />
                 <span className="hidden sm:inline">NAVIGATE SECTOR</span>
                 <ChevronDown className={`w-3 h-3 transition-transform ${showAirportList ? 'rotate-180' : ''}`} />
             </button>
         </div>
         
         <AnimatePresence>
            {showAirportList && (
                <MotionDiv 
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="w-72 bg-slate-950/95 border border-slate-700 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl"
                >
                    <div className="p-2 border-b border-slate-800 bg-slate-900/50">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="SEARCH AIRPORT CODE OR CITY..." 
                                value={airportSearch}
                                onChange={(e) => setAirportSearch(e.target.value)}
                                className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1.5 pl-7 text-[10px] font-mono text-white focus:border-blue-500 outline-none uppercase"
                                autoFocus
                            />
                            <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-500" />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {filteredAirports.map(airport => (
                            <button
                                key={airport.code}
                                onClick={() => handleAirportSelect(airport)}
                                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-900/20 hover:text-blue-400 border-l-2 border-transparent hover:border-blue-500 transition-colors group"
                            >
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-bold font-mono group-hover:text-white flex items-center gap-2">
                                        {airport.code} 
                                        <span className="text-[9px] text-slate-500 font-normal">{airport.state}</span>
                                    </span>
                                    <span className="text-[9px] text-slate-500 truncate w-full">{airport.name}</span>
                                </div>
                                <Crosshair className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>
                        ))}
                    </div>
                </MotionDiv>
            )}
         </AnimatePresence>
      </div>

      {/* --- CENTRAL HEADER / OVERLAY --- */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence mode="wait">
            {selectedFlight ? (
                <MotionDiv
                    key="flight-card"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="pointer-events-auto bg-slate-900/95 border border-blue-500/50 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden w-full border-l-4"
                >
                    <div className="px-4 py-2 bg-blue-950/40 border-b border-blue-900/30 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                             <Plane className="w-4 h-4 text-blue-400" />
                             <span className="font-bold text-white tracking-wider">{selectedFlight.callsign}</span>
                         </div>
                         <button onClick={() => setSelectedFlight(null)} className="text-slate-500 hover:text-white transition-colors">
                             <X className="w-4 h-4" />
                         </button>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">ALTITUDE</div>
                            <div className="text-sm font-mono text-blue-300">{Math.round(selectedFlight.altitude)}m</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">SPEED</div>
                            <div className="text-sm font-mono text-blue-300">{Math.round(selectedFlight.velocity)}m/s</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">TRACK</div>
                            <div className="text-sm font-mono text-blue-300">{Math.round(selectedFlight.true_track)}°</div>
                        </div>
                    </div>
                </MotionDiv>
            ) : selectedAirport ? (
                <MotionDiv
                    key="airport-card"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="pointer-events-auto bg-slate-900/95 border border-yellow-500/50 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden w-full border-l-4"
                >
                    <div className="px-4 py-2 bg-yellow-950/40 border-b border-yellow-900/30 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-yellow-400" />
                            <span className="font-bold text-white tracking-wider">{selectedAirport.code}</span>
                            <span className="text-[10px] text-slate-400">{selectedAirport.city.toUpperCase()}</span>
                        </div>
                        <button onClick={() => setSelectedAirport(null)} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-3 text-center">
                        {loadingAmenities ? (
                            <div className="text-xs font-mono text-yellow-500 animate-pulse flex items-center justify-center gap-2">
                                <Search className="w-3 h-3" /> SCANNING AMENITIES...
                            </div>
                        ) : (
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                                SECTOR SECURE. IDENTIFIED {Object.keys(amenityMarkersRef.current).length} ACTIVE AMENITY NODES.
                            </div>
                        )}
                    </div>
                </MotionDiv>
            ) : selectedVenue ? (
                <MotionDiv
                    key="venue-card"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="pointer-events-auto bg-slate-900/95 border border-purple-500/50 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden w-full border-l-4"
                >
                    <div className="px-4 py-2 bg-purple-950/40 border-b border-purple-900/30 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-purple-400" />
                            <span className="font-bold text-white tracking-wider">{selectedVenue.name}</span>
                        </div>
                        <button onClick={() => setSelectedVenue(null)} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-3">
                        <p className="text-xs text-slate-300 mb-1">{selectedVenue.address}</p>
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                            <span>{selectedVenue.category}</span>
                            <span className="text-yellow-500">{selectedVenue.rating} ★</span>
                        </div>
                    </div>
                </MotionDiv>
            ) : null}
        </AnimatePresence>
      </div>

      {/* --- ZOOM & TACTICAL CONTROLS --- */}
      <div className="absolute bottom-16 right-4 z-[400] flex flex-col gap-1">
         <button 
           onClick={handleHome} 
           className="p-2 bg-slate-900/90 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors mb-2 shadow-lg"
           title="Home (Recenter)"
         >
            <Home className="w-4 h-4" />
         </button>
         
         <div className="flex flex-col bg-slate-900/90 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
            <button onClick={handleZoomIn} className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-700 mx-2"></div>
            <button onClick={handleZoomOut} className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                <ZoomOut className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Bottom Grid Coordinates */}
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-none text-green-600/60 font-mono text-[10px] bg-black/60 px-3 py-1 rounded-full border border-green-900/30 backdrop-blur hidden sm:flex items-center gap-2">
          <LocateFixed className="w-3 h-3 text-green-500" />
          <span className="tracking-widest">GRID: {mapCenter[0].toFixed(4)} | {mapCenter[1].toFixed(4)}</span>
      </div>

      {/* Live Status Indicator */}
      <div className="absolute bottom-4 right-4 z-[400] pointer-events-none flex items-center gap-3 bg-black/60 px-3 py-1 rounded-full border border-blue-900/30 backdrop-blur">
         <div className="flex items-center gap-2 text-blue-400 text-[10px] font-mono uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
            LIVE_UPSTREAM
         </div>
         <div className="h-3 w-px bg-slate-700" />
         <span className="text-[10px] font-mono text-slate-500">{new Date().toLocaleTimeString([], { hour12: false })}</span>
      </div>

      {/* Aesthetic Overlays */}
      <div className="scanlines z-[500] pointer-events-none opacity-20"></div>
      {isExpanded && <div className="absolute inset-0 z-[600] pointer-events-none border-[12px] border-black/40 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />}
    </div>
  );
}