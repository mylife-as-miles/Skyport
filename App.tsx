import React, { useState, useEffect } from 'react';
import { Plane, Radio, Menu, Map as MapIcon, Sparkles, Search } from 'lucide-react';
import CyberMap from './components/CyberMap';
import ChatInterface from './components/ChatInterface';
import PlaceCard from './components/PlaceCard';
import WeatherWidget from './components/WeatherWidget';
import { ChatMessage, Venue, MapCommand, LiveFlight } from './types';
import { sendUserMessage } from './services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: 'init',
        role: 'assistant',
        content: "Welcome to SkyPort AI. I am initialized and tracking live flights in the global airspace. How can I assist with your journey today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [recommendations, setRecommendations] = useState<Venue[]>([]);
  
  // Lifted Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // AI Map Control
  const [latestMapCommand, setLatestMapCommand] = useState<MapCommand | undefined>(undefined);

  const handleSendMessage = async (text: string) => {
    // Add User Message
    const userMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Get AI Response
    try {
        const response = await sendUserMessage(text, currentLocation);
        setMessages(prev => [...prev, response]);
        
        // If the AI found attachments (places), update the recommendation panel
        if (response.attachments && response.attachments.length > 0) {
            setRecommendations(response.attachments);
        }

        // If the AI sent a map command, update the state to trigger CyberMap
        if (response.command) {
            setLatestMapCommand(response.command);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsTyping(false);
    }
  };

  const handleFlightSelect = async (flight: LiveFlight) => {
      // Construct a prompt for the AI to analyze the selected flight
      const prompt = `Analyze flight ${flight.callsign} (ICAO: ${flight.icao24}).
      Status: ${flight.status || 'Unknown'}.
      Altitude: ${Math.round(flight.altitude)}m.
      Speed: ${Math.round(flight.velocity)}m/s.
      Heading: ${Math.round(flight.true_track)}°.
      Vertical Rate: ${flight.vertical_rate || 0}m/s.

      Explain its likely route (if inferable from heading/location), current behavior (climbing/descending), and any signs of holding patterns or diversion based on this telemetry. Keep it brief and "tactical".`;

      // We send this as a system/hidden prompt, but display the result as an assistant message.
      setIsTyping(true);
      try {
          const response = await sendUserMessage(prompt, { lat: flight.latitude, lng: flight.longitude });
          setMessages(prev => [...prev, response]);
      } catch (e) {
          console.error("Flight analysis failed", e);
      } finally {
          setIsTyping(false);
      }
  };

  const handlePlaceSelect = (venue: Venue) => {
      if (venue.coordinates) {
          setLatestMapCommand({
              type: 'FLY_TO',
              target: {
                  lat: venue.coordinates.lat,
                  lng: venue.coordinates.lng,
                  label: venue.name
              },
              zoom: 16
          });
      }
  };

  const handleFlightSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setGlobalSearchQuery(searchInput);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-blue-900 selection:text-white pb-6 overflow-x-hidden relative flex flex-col">
      
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
        style={{ 
            backgroundImage: 'linear-gradient(#1e3a8a 1px, transparent 1px), linear-gradient(90deg, #1e3a8a 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
        }}>
      </div>
      
      {/* Header */}
      <header className="relative z-[100] border-b border-blue-900/30 bg-slate-950/80 backdrop-blur-md sticky top-0 shadow-lg shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-1.5 sm:p-2 bg-blue-950/30 border border-blue-500/50 rounded shadow-[0_0_15px_rgba(59,130,246,0.2)]">
               <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold tracking-[0.1em] text-white flex items-center gap-1 sm:gap-2 leading-none">
                SKYPORT<span className="text-blue-500">_AI</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-blue-400 font-mono tracking-widest hidden sm:block mt-1 uppercase">Global Travel Assistant</p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
             <form onSubmit={handleFlightSearch} className="relative group">
                 <input 
                    type="text" 
                    placeholder="TRACK FLIGHT (e.g. UA205)" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all uppercase placeholder-slate-600"
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
             </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
             <div className="hidden sm:block">
                <WeatherWidget />
             </div>
             
             <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors md:hidden"
             >
                <Menu className="w-5 h-5 text-slate-400" />
             </button>

             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-full">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 uppercase">NET: <span className="text-emerald-400">SECURE</span></span>
             </div>
          </div>
        </div>

        {/* Mobile Search & Menu Drawer */}
        <AnimatePresence>
            {mobileMenuOpen && (
                <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:hidden border-t border-slate-800 bg-slate-950/95 overflow-hidden"
                >
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleFlightSearch} className="relative group">
                            <input 
                                type="text" 
                                placeholder="TRACK FLIGHT (e.g. UA205)" 
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </form>
                        <div className="flex justify-between items-center px-1">
                            <WeatherWidget />
                            <span className="text-xs font-mono text-emerald-400">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>
      </header>

      {/* Main Layout */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col lg:grid lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Col: Map & Places */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0 order-1 lg:order-none">
           
           {/* Map Section */}
           <div className="flex-1 min-h-[400px] lg:min-h-0 relative rounded-2xl overflow-hidden border border-blue-900/30 shadow-2xl bg-slate-950">
               <CyberMap 
                 passengers={[]} 
                 searchQuery={globalSearchQuery}
                 onMapMove={setCurrentLocation}
                 aiCommand={latestMapCommand}
                 onFlightSelect={handleFlightSelect}
               />
               
               {/* Overlay Title */}
               <div className="absolute top-4 left-4 lg:left-1/2 lg:-translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700 z-[400] pointer-events-none hidden sm:block">
                   <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                       <MapIcon className="w-3 h-3 text-blue-400" />
                       <span className="uppercase tracking-wider">Tactical Airspace Feed</span>
                   </div>
               </div>
           </div>

           {/* Recommendations Strip */}
           <div className="h-auto lg:h-48 shrink-0 flex flex-col">
               <div className="flex items-center gap-2 mb-3">
                   <Sparkles className="w-4 h-4 text-yellow-400" />
                   <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Nearby Recommendations</h3>
               </div>
               
               <div className="flex-1 min-h-[160px]">
                 {recommendations.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         <AnimatePresence>
                             {recommendations.map((venue, i) => (
                                 <MotionDiv
                                   key={venue.id}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: i * 0.1 }}
                                 >
                                     <PlaceCard venue={venue} onClick={() => handlePlaceSelect(venue)} />
                                 </MotionDiv>
                             ))}
                         </AnimatePresence>
                     </div>
                 ) : (
                     <div className="h-full flex flex-col items-center justify-center bg-slate-900/30 border border-slate-800 border-dashed rounded-lg text-slate-500 p-8">
                         <p className="text-xs font-mono uppercase">Awaiting neural query...</p>
                         <p className="text-[10px] mt-2 opacity-60 text-center">Ask the assistant to find restaurants, hotels, or lounges.</p>
                     </div>
                 )}
               </div>
           </div>
        </div>

        {/* Right Col: Chat */}
        <div className="lg:col-span-4 h-[600px] lg:h-full min-h-0 order-2 lg:order-none mb-10 lg:mb-0">
            <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isTyping={isTyping} 
            />
        </div>

      </main>
    </div>
  );
}
