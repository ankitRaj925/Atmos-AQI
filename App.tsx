
import React, { useState, useEffect } from 'react';
import { AqiData } from './types';
import { fetchAqiForCity, fetchAqiForLocation } from './services/aqiService';
import SearchBar from './components/SearchBar';
import AqiDisplay from './components/AqiDisplay';
import PollutantChart from './components/PollutantChart';
import InfoCard from './components/InfoCard';
import ActivityGuide from './components/ActivityGuide';
import SkeletonLoader from './components/SkeletonLoader';
import AiAssistant from './components/AiAssistant';
import { MapPin, Wind, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AqiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Initial load and theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load recent searches from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('atmos_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches");
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const addToRecent = (city: string) => {
    const cityTitle = city.charAt(0).toUpperCase() + city.slice(1);
    const updated = [cityTitle, ...recentSearches.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('atmos_recent_searches', JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('atmos_recent_searches');
  };

  const handleSearch = async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAqiForCity(city);
      setData(result);
      addToRecent(result.city);
    } catch (err: any) {
      console.error(err);
      setError("Unable to retrieve AQI data. Please check the city name or try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await fetchAqiForLocation(latitude, longitude);
          setData(result);
          // Don't add location coordinates to recent list, only names if they are clean, 
          // but usually location search result name is good to add.
          if (!result.city.includes('Loc:')) {
             addToRecent(result.city);
          }
        } catch (err: any) {
          console.error(err);
          setError("Unable to retrieve AQI data for your location.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
           setError("Location permission denied. Please enable location services or search by city name.");
        } else {
           setError("Unable to retrieve your location.");
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-300">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-300/30 dark:bg-indigo-900/20 rounded-full blur-[160px] opacity-40 transition-colors duration-500" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-300/20 dark:bg-emerald-900/10 rounded-full blur-[140px] opacity-30 transition-colors duration-500" />
        <div className="absolute top-[40%] left-[20%] w-[20%] h-[20%] bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-[100px] opacity-20 transition-colors duration-500" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 max-w-6xl flex flex-col min-h-screen">
        
        {/* Top Controls */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full transition-all duration-300 border bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 shadow-sm backdrop-blur-md"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Header - Z-Index 50 to ensure search suggestions float above content */}
        <header className="flex flex-col items-center mb-16 text-center relative z-50">
          <div className="inline-flex items-center gap-3 mb-6 relative group">
             <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
             <div className="relative p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
               <Wind className="text-white w-8 h-8" />
             </div>
             <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-indigo-600 to-slate-500 dark:from-white dark:via-indigo-100 dark:to-slate-400 brand-font tracking-tight pb-1">
               Atmos
             </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mb-10 leading-relaxed font-medium dark:font-normal">
             Monitor air quality in real-time. Protect your health with accurate data and actionable insights for any location.
          </p>
          
          <SearchBar 
            onSearch={handleSearch} 
            onLocationSearch={handleLocationSearch} 
            isLoading={loading}
            recentSearches={recentSearches}
            onClearRecent={clearRecent}
          />
        </header>

        {/* Content Area - Lower Z-Index */}
        {loading && (
           <div className="relative z-0">
             <SkeletonLoader />
           </div>
        )}

        {error && !loading && (
          <div className="relative z-0 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-red-600 dark:text-red-300 max-w-md mx-auto backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {data && !loading && !error && (
          <div className="space-y-6 animate-fade-in-up pb-12 relative z-0">
            {/* Top Section: Main AQI Display */}
            <AqiDisplay data={data} />
            
            {/* Lifestyle & Activity Guide */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              <ActivityGuide aqi={data.aqi} />
            </div>

            {/* Bottom Grid: Chart & Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[420px]">
               <PollutantChart pollutants={data.pollutants} />
               <InfoCard advice={data.healthAdvice} sources={data.sourceUrls} />
            </div>

            {/* Footer with Service Info */}
            <div className="mt-8 text-center pt-8 border-t border-slate-200 dark:border-white/5">
              <p className="text-xs text-slate-500 dark:text-slate-600 flex items-center justify-center gap-2">
                <MapPin size={12} />
                <span>Data retrieved for <strong>{data.city}</strong>. Cached locally.</span>
              </p>
            </div>
          </div>
        )}

        {!data && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 pointer-events-none mt-10 md:mt-0 relative z-0">
               <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                 <div className="relative w-64 h-64 border border-slate-200 dark:border-white/5 rounded-full flex items-center justify-center bg-white/5 dark:bg-transparent">
                    <div className="w-48 h-48 border border-slate-200 dark:border-white/5 rounded-full flex items-center justify-center">
                       <MapPin className="w-12 h-12 text-slate-400 dark:text-slate-700" />
                    </div>
                 </div>
               </div>
               <p className="text-slate-500 dark:text-slate-600 mt-8 font-medium">Ready to scout the skies.</p>
            </div>
        )}
      </div>

      {/* AI Assistant Integration */}
      <AiAssistant aqiData={data} />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(99, 102, 241, 0.2);
          border-radius: 3px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
