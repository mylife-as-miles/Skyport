import React from 'react';
import { Play, Pause, XCircle, Zap, Shield, Settings, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface AgentControlPanelProps {
  onStartAll: () => void;
  onHaltAll: () => void;
  isProcessing: boolean;
  aggressiveness: number;
  setAggressiveness: (val: number) => void;
  autoRetry: boolean;
  setAutoRetry: (val: boolean) => void;
}

export default function AgentControlPanel({ 
  onStartAll, 
  onHaltAll, 
  isProcessing,
  aggressiveness,
  setAggressiveness,
  autoRetry,
  setAutoRetry
}: AgentControlPanelProps) {

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 backdrop-blur-md shadow-lg relative overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
          <Settings className="w-3 h-3 text-blue-400" />
          Agent Command Center
        </h3>
        <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
             <span className="text-[9px] text-blue-400 font-mono">ONLINE</span>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="space-y-4">
        
        {/* Aggressiveness Slider */}
        <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono uppercase">
                <span>Search Aggressiveness</span>
                <span className="text-blue-400">{aggressiveness}%</span>
            </div>
            <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={aggressiveness}
                    onChange={(e) => setAggressiveness(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <MotionDiv 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                    style={{ width: `${aggressiveness}%` }}
                />
            </div>
        </div>

        {/* Global Actions */}
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={onStartAll}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-900/20 hover:bg-green-900/40 border border-green-500/30 text-green-400 text-[10px] font-mono uppercase tracking-wider rounded transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Zap className="w-3 h-3" /> Deploy All
            </button>
            <button 
                onClick={onHaltAll}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase tracking-wider rounded transition-all active:scale-95"
            >
                <XCircle className="w-3 h-3" /> Halt All
            </button>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <Shield className="w-3 h-3 text-slate-500" /> Auto-Retry Failed
            </span>
            <button 
                onClick={() => setAutoRetry(!autoRetry)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${autoRetry ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
                <MotionDiv 
                    className="w-3 h-3 bg-white rounded-full shadow-sm"
                    animate={{ x: autoRetry ? 16 : 0 }}
                />
            </button>
        </div>
      </div>

      {/* Decor */}
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-500/10 blur-xl rounded-full pointer-events-none"></div>
    </div>
  );
}