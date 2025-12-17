import React, { useState } from 'react';
import { PassengerGroup, AgentLog } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, Briefcase, MapPin, Loader2, CheckCircle, AlertOctagon, Star, RefreshCw, XCircle, Play, Terminal, ImageOff } from 'lucide-react';

const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

interface PassengerCardProps {
  group: PassengerGroup;
  logs: AgentLog[];
  onRetry?: (id: string) => void;
  onStop?: (id: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const PassengerCard: React.FC<PassengerCardProps> = ({ group, logs, onRetry, onStop }) => {
  const [showLogs, setShowLogs] = useState(false);

  const getSegmentIcon = () => {
    switch (group.segment) {
      case 'VIP': return <Briefcase className="w-5 h-5 text-purple-400" />;
      case 'FAMILY': return <Users className="w-5 h-5 text-blue-400" />;
      case 'ECONOMY': return <User className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusStyles = () => {
    switch (group.status) {
      case 'STRANDED': 
        return {
          border: 'border-l-red-500',
          bg: 'bg-red-950/10 hover:bg-red-950/20',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      case 'ANALYZING': 
        return {
          border: 'border-l-yellow-500',
          bg: 'bg-yellow-950/10',
          badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
      case 'BOOKED': 
        return {
          border: 'border-l-green-500',
          bg: 'bg-green-950/10 hover:bg-green-950/20',
          badge: 'bg-green-500/20 text-green-400 border-green-500/30'
        };
      case 'FAILED':
        return {
            border: 'border-l-slate-500',
            bg: 'bg-slate-900/50',
            badge: 'bg-slate-700 text-slate-400'
        };
      default: 
        return {
          border: 'border-l-slate-700',
          bg: 'bg-slate-900/50',
          badge: 'bg-slate-800 text-slate-400'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <MotionDiv
      variants={itemVariants}
      layout
      className={`relative p-4 rounded-r-lg border-y border-r border-slate-800 border-l-4 ${styles.border} ${styles.bg} backdrop-blur-sm transition-all duration-300 group`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors">
            {getSegmentIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 tracking-wide text-sm">{group.name}</h3>
                {group.segment === 'VIP' && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded border border-purple-500/20">VIP</span>}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
               <span>ID: {group.id}</span>
               <span className="w-1 h-1 rounded-full bg-slate-700"></span>
               <span>{group.count} PAX</span>
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="text-right flex flex-col items-end gap-1">
             {group.status === 'STRANDED' && (
               <MotionSpan 
                 initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border ${styles.badge}`}
                >
                 <AlertOctagon className="w-3 h-3" /> STRANDED
               </MotionSpan>
             )}
             {group.status === 'ANALYZING' && (
               <MotionSpan 
                 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border ${styles.badge}`}
                >
                 <Loader2 className="w-3 h-3 animate-spin" /> ANALYZING
               </MotionSpan>
             )}
             {group.status === 'BOOKED' && (
               <MotionSpan 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border ${styles.badge}`}
                >
                 <CheckCircle className="w-3 h-3" /> BOOKED
               </MotionSpan>
             )}
             {group.status === 'FAILED' && (
                 <span className="text-xs text-slate-500">Failed</span>
             )}
        </div>
      </div>

      {/* Manual Actions Row */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/50">
          <button 
             onClick={() => setShowLogs(!showLogs)}
             className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 hover:text-green-400 transition-colors"
          >
             <Terminal className="w-3 h-3" />
             {showLogs ? 'HIDE_LOGS' : 'VIEW_LOGS'}
          </button>

          <div className="flex gap-2">
            {['STRANDED', 'FAILED'].includes(group.status) && (
                <button 
                    onClick={() => onRetry?.(group.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-green-900/30 hover:bg-green-900/50 border border-green-500/30 text-[9px] text-green-400 font-mono uppercase tracking-wider transition-colors"
                >
                    <Play className="w-3 h-3" /> Retry
                </button>
            )}
            {group.status === 'ANALYZING' && (
                <button 
                    onClick={() => onStop?.(group.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-[9px] text-red-400 font-mono uppercase tracking-wider transition-colors"
                >
                    <XCircle className="w-3 h-3" /> Halt
                </button>
            )}
        </div>
      </div>

      {/* Logs Section */}
      <AnimatePresence>
        {showLogs && (
            <MotionDiv
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="mt-2 bg-black/50 rounded border border-slate-800 p-2 font-mono text-[9px] text-slate-400 max-h-32 overflow-y-auto">
                    {logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0 last:mb-0">
                            <span className="text-slate-600 mr-2">[{log.timestamp}]</span>
                            <span className={log.type === 'ERROR' ? 'text-red-400' : log.type === 'SUCCESS' ? 'text-green-400' : 'text-slate-300'}>
                                {log.message}
                            </span>
                        </div>
                    )) : (
                        <div className="text-slate-600 italic">No active agent logs.</div>
                    )}
                </div>
            </MotionDiv>
        )}
      </AnimatePresence>

      {/* Venue Details Expansion */}
      <MotionDiv 
        layout
        className="overflow-hidden"
      >
        <AnimatePresence>
            {group.assignedVenue && (
            <MotionDiv 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mt-2 pt-2 border-t border-slate-700/50"
            >
                <div className="flex gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
                    {group.assignedVenue.imageUrl ? (
                        <img 
                            src={group.assignedVenue.imageUrl} 
                            alt="venue" 
                            className="w-16 h-16 rounded-md object-cover border border-slate-700 bg-slate-800"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-md border border-slate-700 bg-slate-800 flex items-center justify-center flex-col gap-1 text-slate-600">
                             <ImageOff className="w-5 h-5" />
                             <span className="text-[7px] uppercase font-mono">No IMG</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-green-400 truncate pr-2">{group.assignedVenue.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{group.assignedVenue.price}</span>
                    </div>
                    
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-500" /> {group.assignedVenue.address}
                    </p>
                    
                    <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] flex items-center gap-1 text-yellow-500 font-medium">
                            <Star className="w-3 h-3 fill-yellow-500" /> {group.assignedVenue.rating}
                        </span>
                        <span className="w-0.5 h-2.5 bg-slate-700"></span>
                        <span className="text-[10px] text-slate-500 font-mono tracking-tight">YELP_MATCH_CONFIRMED</span>
                    </div>
                    </div>
                </div>
            </MotionDiv>
            )}
        </AnimatePresence>
      </MotionDiv>
    </MotionDiv>
  );
};

export default PassengerCard;