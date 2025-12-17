import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentLog, LogType } from '../types';
import { Filter, ChevronDown, Archive } from 'lucide-react';

const MotionDiv = motion.div as any;

interface SystemLogsProps {
  logs: AgentLog[];
  onLoadMore?: () => void;
}

export default function SystemLogs({ logs, onLoadMore }: SystemLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'ALL' | LogType>('ALL');
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive, if autoscroll is enabled
  useEffect(() => {
    if (scrollRef.current && isAutoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll, filter]);

  const filteredLogs = logs.filter(log => filter === 'ALL' || log.type === filter);

  return (
    <div className="relative h-full flex flex-col bg-black border border-green-900/50 rounded-lg overflow-hidden border-glow shadow-[0_0_30px_rgba(0,255,0,0.05)]">
      {/* Header */}
      <div className="bg-green-950/20 p-2 border-b border-green-900/50 flex justify-between items-center backdrop-blur-md z-10">
        <h3 className="text-green-500 font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,1)]"></span>
          System Kernel Output
        </h3>
        
        <div className="flex items-center gap-2">
            {onLoadMore && (
                <button 
                    onClick={onLoadMore}
                    className="p-1 hover:bg-green-900/30 rounded text-slate-400 hover:text-green-400 transition-colors"
                    title="Load History"
                >
                    <Archive className="w-3 h-3" />
                </button>
            )}

            {/* Simple Filter Dropdown */}
            <div className="relative group">
                <button className="flex items-center gap-1 text-[10px] font-mono text-green-700 hover:text-green-400 transition-colors uppercase">
                    <Filter className="w-3 h-3" />
                    {filter}
                    <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-24 bg-black border border-green-900 rounded shadow-lg hidden group-hover:block z-50">
                    {['ALL', 'INFO', 'SUCCESS', 'ERROR', 'SYSTEM'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilter(type as any)}
                            className="block w-full text-left px-3 py-1.5 text-[10px] text-slate-400 hover:text-green-400 hover:bg-green-900/20 font-mono"
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            <span className="text-green-900 font-mono text-[10px]">|</span>
            <span className="text-green-700 font-mono text-[10px]">v.2.4.0</span>
        </div>
      </div>

      {/* Log Container */}
      <div 
        ref={scrollRef}
        onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isAtBottom = target.scrollHeight - target.scrollTop >= target.clientHeight - 10;
            setIsAutoScroll(isAtBottom);
        }}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 crt-flicker relative z-10"
      >
        <AnimatePresence initial={false}>
          {filteredLogs.map((log) => (
            <MotionDiv
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2 items-start"
            >
              <span className="text-green-800 shrink-0 select-none text-[10px] pt-0.5">[{log.timestamp}]</span>
              <span className={`break-all leading-tight ${
                log.type === 'ERROR' ? 'text-red-500 text-glow font-bold' : 
                log.type === 'SUCCESS' ? 'text-cyan-400 text-glow font-bold' : 
                log.type === 'YELP_API' ? 'text-emerald-400' :
                log.type === 'SYSTEM' ? 'text-green-400 font-bold' :
                'text-green-500/80'
              }`}>
                {(log.type === 'SUCCESS' || log.type === 'SYSTEM') && <span className="mr-1">{'>>'}</span>}
                {log.message}
              </span>
            </MotionDiv>
          ))}
        </AnimatePresence>
        
        {filteredLogs.length === 0 && (
            <div className="text-green-900 italic text-center mt-10">-- NO LOGS FOUND --</div>
        )}

        {/* Blinking Cursor at bottom */}
        <div className="text-green-500 mt-2 animate-pulse font-bold">_</div>
      </div>

      {/* Overlay Scanlines */}
      <div className="scanlines pointer-events-none absolute inset-0 z-20"></div>
      
      {/* Vignette & Screen Glow */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]"></div>
    </div>
  );
}