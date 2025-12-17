import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

const MotionDiv = motion.div as any;

interface TerminalLogProps {
  logs: AgentLog[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black border border-green-500/30 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.15)] overflow-hidden font-mono text-sm relative group">
      
      {/* CRT Scanline & Screen Effects */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
      <div className="absolute inset-0 pointer-events-none z-10 bg-green-500/5 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.5)] z-20"></div>

      {/* Terminal Header */}
      <div className="bg-green-950/20 px-4 py-2 border-b border-green-500/30 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-green-500">
          <Terminal className="w-4 h-4" />
          <span className="font-bold tracking-[0.2em] text-xs uppercase drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">SYSTEM_LOG</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] text-green-700 font-bold tracking-widest">NET_SECURE</span>
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,1)]"></div>
        </div>
      </div>

      {/* Log Stream Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-black relative z-20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-green-800 hover:[&::-webkit-scrollbar-thumb]:bg-green-600"
      >
        <div className="text-green-900/40 text-[10px] mb-4 select-none font-mono">
          {'>'} BOOT_SEQUENCE_INIT... OK<br/>
          {'>'} LOADING_NEURAL_MODULES... OK<br/>
          {'>'} ESTABLISHING_SECURE_LINK... CONNECTED
        </div>

        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <MotionDiv
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 font-mono text-xs"
            >
              <span className="text-green-800 shrink-0 select-none text-[10px] pt-[2px] font-bold opacity-60">[{log.timestamp}]</span>
              <span className="text-green-600 pt-[2px] opacity-70">{'>'}</span>
              <span className={`break-words leading-relaxed tracking-wide flex-1 ${
                log.type === 'ERROR' ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.6)]' :
                log.type === 'SUCCESS' ? 'text-green-400 font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.6)]' :
                log.type === 'YELP_API' ? 'text-emerald-400' :
                'text-green-500/90 shadow-green-500/10'
              }`}>
                {log.message}
              </span>
            </MotionDiv>
          ))}
        </AnimatePresence>
        
        {/* Blinking Block Cursor */}
        <MotionDiv 
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "steps(2)" }}
          className="w-2.5 h-4 bg-green-500 mt-1 inline-block shadow-[0_0_5px_rgba(34,197,94,0.8)]"
        />
      </div>
    </div>
  );
};

export default TerminalLog;