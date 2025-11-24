
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, MapPin, X, Clock, Trash2 } from 'lucide-react';
import { fetchCitySuggestions } from '../services/aqiService';
import { CitySuggestion } from '../types';

interface SearchBarProps {
  onSearch: (city: string) => void;
  onLocationSearch: () => void;
  isLoading: boolean;
  recentSearches: string[];
  onClearRecent: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onLocationSearch, 
  isLoading, 
  recentSearches, 
  onClearRecent 
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0); // Track latest request ID

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string, requestId: number) => {
    try {
      const results = await fetchCitySuggestions(query);
      
      // Critical: Only update state if this is still the most recent request
      if (requestId === requestRef.current) {
        setSuggestions(results);
        setIsSuggesting(false);
        if (results.length > 0) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
      }
    } catch (e) {
      if (requestId === requestRef.current) {
         setIsSuggesting(false);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setSelectedIndex(-1); // Reset selection on typing

    // Clear previous debounce immediately
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Hide if empty or too short
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSuggesting(false);
      return;
    }

    // Show loading skeleton for immediate feedback
    // We only set this if we are actually planning to search
    setIsSuggesting(true);
    setShowSuggestions(true);

    // Debounce to 500ms (Aggressive) to reduce API calls for fast typers
    debounceTimeout.current = setTimeout(() => {
      // Increment request ID to invalidate older requests
      const currentRequestId = ++requestRef.current;
      fetchSuggestions(value.trim(), currentRequestId);
    }, 500); 
  };

  const handleSelectSuggestion = (city: string) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    requestRef.current++; // Invalidate pending requests
    
    setInput(city);
    setShowSuggestions(false);
    onSearch(city);
    setSelectedIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    requestRef.current++; // Invalidate pending requests
    
    if (input.trim()) {
      setShowSuggestions(false);
      setSuggestions([]);
      onSearch(input.trim());
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex].name);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const clearInput = () => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    requestRef.current++;
    
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSuggesting(false);
    setSelectedIndex(-1);
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30';
    if (aqi <= 100) return 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/30';
    if (aqi <= 150) return 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/30';
    if (aqi <= 200) return 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30';
    return 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30';
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-2xl mx-auto relative z-50 flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
            )}
          </div>
          
          <input
            type="text"
            className="block w-full pl-12 pr-28 py-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-lg hover:bg-white dark:hover:bg-slate-800/60 font-medium"
            placeholder="Search city (e.g. Mumbai, Delhi)..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if((suggestions.length > 0 || isSuggesting) && input.length >= 2) setShowSuggestions(true); }}
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />

          {input && !isLoading && (
             <button
               type="button"
               onClick={clearInput}
               className="absolute right-20 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
             >
               <X size={16} />
             </button>
          )}

          <div className="absolute inset-y-0 right-2 flex items-center gap-1 z-10">
              <button
                type="button"
                onClick={onLocationSearch}
                disabled={isLoading}
                className="p-2.5 bg-slate-100/50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-xl transition-all border border-transparent hover:border-indigo-500/30 active:scale-95"
                title="Use current location"
              >
                <MapPin className="h-5 w-5" />
              </button>
          </div>
        </div>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !input && (
        <div className="flex items-center gap-2 flex-wrap px-2 animate-in fade-in slide-in-from-top-1">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mr-1">Recent:</span>
          {recentSearches.map((city) => (
            <button
              key={city}
              onClick={() => onSearch(city)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-lg text-xs text-slate-600 dark:text-slate-300 transition-all active:scale-95"
            >
              <Clock size={10} className="text-slate-400" />
              {city}
            </button>
          ))}
          <button
             onClick={onClearRecent}
             className="ml-auto p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
             title="Clear history"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-[60px] left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
           {isSuggesting ? (
             <div className="py-3 px-1 space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="mx-2 px-4 py-2 rounded-lg flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3 w-full">
                       <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>
                       <div className="h-4 bg-slate-200 dark:bg-slate-700/30 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
            suggestions.length > 0 ? (
              <ul className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      className={`w-full text-left px-5 py-3 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors flex items-center justify-between group ${
                        index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200' : ''
                      }`}
                      onClick={() => handleSelectSuggestion(suggestion.name)}
                    >
                      <div className="flex items-center gap-3">
                        <Search className={`w-4 h-4 text-slate-400 dark:text-slate-500 ${
                          index === selectedIndex ? 'text-indigo-500 dark:text-indigo-400' : 'group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                        }`} />
                        <span>{suggestion.name}</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border text-xs font-semibold ${getAqiColor(suggestion.aqi)}`}>
                         <span>AQI</span>
                         <span>{suggestion.aqi}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 px-6 text-slate-500 dark:text-slate-400 text-sm text-center">
                No matching cities found
              </div>
            )
           )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
