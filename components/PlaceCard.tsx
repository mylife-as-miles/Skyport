import React from 'react';
import { Venue } from '../types';
import { MapPin, Star, Navigation, Clock, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface PlaceCardProps {
  venue: Venue;
  onClick: () => void;
}

export default function PlaceCard({ venue, onClick }: PlaceCardProps) {
  return (
    <MotionDiv 
      whileHover={{ scale: 1.02 }}
      className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden group hover:border-blue-500/50 transition-colors cursor-pointer flex flex-col"
      onClick={onClick}
    >
      <div className="relative h-32 overflow-hidden">
         <img 
            src={venue.imageUrl} 
            alt={venue.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
         
         <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-mono text-white border border-white/10">
             {venue.category}
         </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-slate-100 text-sm">{venue.name}</h4>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-900/20 px-1 rounded">{venue.distance}</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
              <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(venue.rating) ? 'fill-yellow-500' : 'text-slate-700'}`} />
                  ))}
              </div>
              <span className="text-xs text-slate-500">({venue.rating})</span>
          </div>

          <div className="space-y-1.5 mt-auto">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span className="truncate">{venue.address}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className={venue.isOpen ? 'text-emerald-400' : 'text-red-400'}>
                          {venue.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                  </div>
                  <span className="text-slate-300 font-mono">{venue.price}</span>
              </div>
          </div>
          
          <button className="mt-3 w-full py-1.5 rounded bg-blue-600/10 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
              <Navigation className="w-3 h-3" /> Navigate
          </button>
      </div>
    </MotionDiv>
  );
}