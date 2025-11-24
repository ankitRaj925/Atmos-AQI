
import React from 'react';
import { AqiData, AqiLevel } from '../types';
import { Wind, Thermometer, Droplets, Sun, AlertTriangle } from 'lucide-react';

interface AqiDisplayProps {
  data: AqiData;
}

const getColorForLevel = (level: AqiLevel) => {
  switch (level) {
    case AqiLevel.GOOD: return { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500/20 to-emerald-900/10' };
    case AqiLevel.MODERATE: return { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30', gradient: 'from-yellow-500/20 to-yellow-900/10' };
    case AqiLevel.UNHEALTHY_SENSITIVE: return { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', gradient: 'from-orange-500/20 to-orange-900/10' };
    case AqiLevel.UNHEALTHY: return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30', gradient: 'from-red-500/20 to-red-900/10' };
    case AqiLevel.VERY_UNHEALTHY: return { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', gradient: 'from-purple-500/20 to-purple-900/10' };
    case AqiLevel.HAZARDOUS: return { bg: 'bg-rose-900', text: 'text-rose-700 dark:text-rose-600', border: 'border-rose-700/30', gradient: 'from-rose-900/40 to-rose-950/40' };
    default: return { bg: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30', gradient: 'from-gray-500/20 to-gray-900/10' };
  }
};

const AqiDisplay: React.FC<AqiDisplayProps> = ({ data }) => {
  const styles = getColorForLevel(data.level);
  const percentage = Math.min((data.aqi / 300) * 100, 100);
  const isHighUV = data.uvIndex !== undefined && data.uvIndex >= 8;

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 ${styles.border} bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-6 md:p-8 transition-all duration-500`}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-30 dark:opacity-50 pointer-events-none`} />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left: Score & Status */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 pr-0">{data.city}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}</p>
          
          <div className="flex items-baseline gap-1">
             <span className={`text-7xl md:text-8xl font-black tracking-tighter ${styles.text}`}>
              {data.aqi}
            </span>
             <span className="text-slate-400 dark:text-slate-500 font-medium text-lg">AQI</span>
          </div>
         
          <div className={`mt-2 inline-flex items-center px-4 py-1.5 rounded-full border ${styles.border} bg-white/50 dark:bg-slate-900/40`}>
            <span className={`font-semibold text-sm md:text-base ${styles.text}`}>{data.level}</span>
          </div>
        </div>

        {/* Center: Circular Progress (Visual Candy) */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0 mx-auto md:mx-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-200 dark:text-slate-700/50"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={502} // 2 * pi * 80
              strokeDashoffset={502 - (502 * percentage) / 100}
              className={`${styles.text} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 p-2">
             <Wind className={`w-6 h-6 md:w-8 md:h-8 mb-1 ${styles.text}`} />
             <span className="text-[10px] md:text-xs uppercase tracking-wider font-semibold opacity-70">Dominant</span>
             <span className="font-bold text-sm md:text-base text-center leading-tight max-w-[75%] break-words">
               {data.dominantPollutant}
             </span>
          </div>
        </div>

        {/* Right: Weather Context */}
        <div className="flex flex-col gap-3 w-full md:w-auto min-w-[140px] md:min-w-[160px] md:pt-12">
           
           <div className="flex flex-row md:flex-col gap-3 justify-center md:justify-start">
              {/* Temp Card */}
              <div className="bg-white/50 dark:bg-slate-900/40 rounded-2xl p-3 md:p-4 border border-slate-200 dark:border-slate-700/50 flex items-center gap-3 flex-1 md:flex-initial transition-transform duration-75 ease-out hover:scale-105 cursor-default">
                  <div className="p-2 bg-blue-100 dark:bg-slate-800 rounded-full text-blue-500 dark:text-blue-400 shrink-0">
                    <Thermometer size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Temp</p>
                    <p className="text-base md:text-lg font-semibold text-slate-800 dark:text-white truncate">
                      {data.temperature !== undefined ? `${data.temperature}°C` : 'N/A'}
                    </p>
                  </div>
              </div>
              
              {/* Humidity Card */}
              <div className="bg-white/50 dark:bg-slate-900/40 rounded-2xl p-3 md:p-4 border border-slate-200 dark:border-slate-700/50 flex items-center gap-3 flex-1 md:flex-initial transition-transform duration-75 ease-out hover:scale-105 cursor-default">
                  <div className="p-2 bg-cyan-100 dark:bg-slate-800 rounded-full text-cyan-500 dark:text-cyan-400 shrink-0">
                    <Droplets size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Humidity</p>
                    <p className="text-base md:text-lg font-semibold text-slate-800 dark:text-white truncate">
                      {data.humidity !== undefined ? `${data.humidity}%` : 'N/A'}
                    </p>
                  </div>
              </div>

              {/* UV Index Card */}
              <div className={`rounded-2xl p-3 md:p-4 border flex items-center gap-3 flex-1 md:flex-initial transition-all duration-75 ease-out hover:scale-105 cursor-default ${
                isHighUV 
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/50' 
                  : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/50'
              }`}>
                  <div className={`p-2 rounded-full shrink-0 transition-colors ${
                    isHighUV 
                      ? 'bg-rose-100 dark:bg-rose-800 text-rose-500 dark:text-rose-300' 
                      : 'bg-amber-100 dark:bg-slate-800 text-amber-500 dark:text-amber-400'
                  }`}>
                    {isHighUV ? <AlertTriangle size={18} className="md:w-5 md:h-5" /> : <Sun size={18} className="md:w-5 md:h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] md:text-xs uppercase tracking-wide ${isHighUV ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>UV Index</p>
                    <p className={`text-base md:text-lg font-semibold truncate ${isHighUV ? 'text-rose-700 dark:text-rose-200' : 'text-slate-800 dark:text-white'}`}>
                      {data.uvIndex !== undefined ? data.uvIndex : 'N/A'}
                    </p>
                  </div>
              </div>
           </div>

           {/* UV Warning Banner */}
           {isHighUV && (
             <div className="relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/30 animate-in fade-in slide-in-from-top-2 ring-1 ring-rose-400/50">
                <AlertTriangle size={20} className="shrink-0 fill-rose-400/20 text-white" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-rose-100 opacity-90 tracking-wider">Warning</span>
                  <span className="text-xs font-bold leading-none mt-0.5">High UV Levels</span>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default AqiDisplay;
