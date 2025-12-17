import React, { useEffect, useState } from 'react';
import { CloudRain, Wind, Droplets, Eye } from 'lucide-react';
import { getWeather, WeatherData } from '../services/weatherService';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    getWeather().then(setWeather);
  }, []);

  if (!weather) return <div className="text-[10px] text-slate-500 font-mono animate-pulse">LOADING_ENV_DATA...</div>;

  return (
    <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-900/50 border border-slate-700/50 rounded-full backdrop-blur-md">
      <div className="flex items-center gap-2">
        <CloudRain className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-bold text-slate-200">{weather.temp}°F</span>
      </div>
      <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-slate-400 border-l border-slate-700 pl-3">
         <span className="uppercase text-blue-300">{weather.condition}</span>
         <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" /> {weather.windSpeed}KN
         </div>
         <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3" /> {weather.humidity}%
         </div>
      </div>
    </div>
  );
}