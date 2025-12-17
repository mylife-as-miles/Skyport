import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';
import { Send, Bot, User, Cpu, Wifi, Activity, ChevronRight, CornerDownLeft, Terminal } from 'lucide-react';

const MotionDiv = motion.div as any;

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

export default function ChatInterface({ messages, onSendMessage, isTyping }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950/80 border border-slate-800 lg:rounded-2xl rounded-lg overflow-hidden shadow-2xl relative backdrop-blur-xl group">
       {/* Ambient Background Effects */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_40%)] pointer-events-none"></div>
       <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none"></div>
       
       {/* Futuristic Header */}
       <div className="relative bg-slate-900/90 p-4 border-b border-slate-700/50 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center gap-4">
              <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-sm rounded-full opacity-50 animate-pulse"></div>
                  <div className="relative p-2 bg-slate-900 rounded-lg border border-blue-500/50">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                  </div>
              </div>
              
              <div>
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase font-mono">SKYPORT<span className="text-blue-500">_NEURAL</span></h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span className="flex items-center gap-1 text-emerald-400"><Wifi className="w-3 h-3" /> LINK_STABLE</span>
                      <span className="hidden sm:flex items-center gap-1"><Activity className="w-3 h-3 text-blue-400" /> LATENCY: 12ms</span>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-2">
              <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
              <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 uppercase font-mono">Protocol</span>
                  <span className="text-[10px] text-blue-300 font-bold font-mono">v2.4.0-RC</span>
              </div>
          </div>
       </div>

       {/* Messages Area */}
       <div 
         ref={scrollRef}
         className="flex-1 overflow-y-auto p-4 space-y-6 z-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent scroll-smooth"
       >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
                <MotionDiv 
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                    {/* Avatar */}
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border shadow-lg mt-1 ${
                        msg.role === 'user' 
                        ? 'bg-slate-800 border-slate-600' 
                        : 'bg-gradient-to-br from-blue-900 to-slate-900 border-blue-500/30'
                    }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-slate-400" /> : <Cpu className="w-4 h-4 text-blue-400" />}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[10px] font-mono text-slate-500 opacity-70">{msg.timestamp}</span>
                            <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                                msg.role === 'user' ? 'bg-slate-800 text-slate-400' : 'bg-blue-900/30 text-blue-300'
                            }`}>
                                {msg.role === 'user' ? 'CMD_IN' : 'SYS_OUT'}
                            </span>
                        </div>
                        
                        <div className={`relative p-3 sm:p-4 text-sm leading-relaxed shadow-xl backdrop-blur-md ${
                            msg.role === 'user' 
                            ? 'bg-slate-800/80 text-slate-100 border-r-2 border-slate-500 rounded-l-xl rounded-br-sm clip-msg-user' 
                            : 'bg-blue-950/40 text-blue-50 border-l-2 border-blue-500 rounded-r-xl rounded-bl-sm clip-msg-ai'
                        }`}>
                            {/* Decorative Lines */}
                            {msg.role === 'assistant' && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20"></div>
                            )}

                            {msg.content}
                        </div>
                    </div>
                </MotionDiv>
            ))}
          </AnimatePresence>
          
          {/* Futuristic Typing Indicator */}
          {isTyping && (
             <MotionDiv 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex gap-4"
             >
                 <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border bg-blue-900/20 border-blue-500/20">
                    <Terminal className="w-4 h-4 text-blue-400" />
                 </div>
                 <div className="flex items-center gap-1 p-3 rounded-r-xl rounded-bl-sm bg-blue-950/20 border border-blue-500/10 min-w-[80px]">
                    <span className="w-1 h-3 bg-blue-400/80 animate-[pulse_0.6s_infinite]"></span>
                    <span className="text-xs font-mono text-blue-400/70">PROCESSING</span>
                    <span className="flex gap-0.5 ml-1">
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></span>
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    </span>
                 </div>
             </MotionDiv>
          )}
       </div>

       {/* Input Command Line */}
       <div className={`p-3 sm:p-4 bg-slate-900/90 border-t border-slate-700/50 backdrop-blur-xl z-20 transition-colors duration-300 ${isFocused ? 'border-blue-500/30' : ''}`}>
          <form onSubmit={handleSubmit} className="relative group">
              <div className={`absolute inset-0 bg-blue-500/5 rounded-lg transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0'}`}></div>
              
              <div className="relative flex items-center bg-black/60 border border-slate-700 rounded-lg overflow-hidden group-focus-within:border-blue-500/50 group-focus-within:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all">
                  <div className="pl-3 pr-2 text-slate-500">
                      <ChevronRight className={`w-4 h-4 transition-colors ${isFocused ? 'text-blue-400' : ''}`} />
                  </div>
                  <input 
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onFocus={() => setIsFocused(true)}
                     onBlur={() => setIsFocused(false)}
                     placeholder="Enter command or query..."
                     className="w-full bg-transparent border-none py-3 text-sm text-slate-200 focus:ring-0 placeholder-slate-600 font-mono tracking-tight"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="mr-1 p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded transition-colors disabled:opacity-30 disabled:hover:bg-slate-800"
                  >
                      <CornerDownLeft className="w-4 h-4" />
                  </button>
              </div>
          </form>
          
          <div className="mt-2 flex justify-between items-center px-1">
             <div className="flex gap-4">
                 <button className="text-[10px] text-slate-500 hover:text-blue-400 font-mono flex items-center gap-1 transition-colors">
                     <span>[F1]</span> HELP
                 </button>
                 <button className="text-[10px] text-slate-500 hover:text-blue-400 font-mono flex items-center gap-1 transition-colors">
                     <span>[ESC]</span> CLEAR
                 </button>
             </div>
             <div className="text-[9px] text-slate-600 font-mono flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                 ENCRYPTED_CH_24
             </div>
          </div>
       </div>

       {/* Decorative Corner Lines */}
       <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-xl">
           <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-blue-500/50 to-transparent"></div>
           <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-blue-500/50 to-transparent"></div>
       </div>
    </div>
  );
}