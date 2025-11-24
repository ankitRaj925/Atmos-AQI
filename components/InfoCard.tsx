import React, { useState } from 'react';
import { Heart, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface InfoCardProps {
  advice: string;
  sources: string[];
}

const InfoCard: React.FC<InfoCardProps> = ({ advice, sources }) => {
  const [expanded, setExpanded] = useState(false);

  // Determine which sources to display based on expanded state
  const displayedSources = expanded ? sources : sources.slice(0, 3);
  const hasMore = sources.length > 3;

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 h-full flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-rose-500 rounded-full block"></span>
        Health Advice
      </h3>
      
      <div className="flex items-start gap-4 mb-6 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20">
        <Heart className="w-6 h-6 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-1" />
        <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm md:text-base">
          {advice}
        </p>
      </div>

      <div className="mt-auto">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Data Sources</h4>
        <div className="flex flex-wrap gap-2 items-center">
          {sources.length > 0 ? (
            <>
              {displayedSources.map((url, idx) => {
                let hostname = 'Unknown Source';
                try {
                    hostname = new URL(url).hostname.replace('www.', '');
                } catch (e) {}

                return (
                  <a 
                    key={idx} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs text-indigo-600 dark:text-blue-300 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-slate-600 truncate max-w-[200px]"
                  >
                    <span className="truncate">{hostname}</span>
                    <ExternalLink size={10} />
                  </a>
                );
              })}

              {hasMore && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg text-xs text-slate-500 dark:text-slate-400 transition-colors border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                >
                  <span>{expanded ? 'Show Less' : `+${sources.length - 3} More`}</span>
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </>
          ) : (
             <span className="text-xs text-slate-500 dark:text-slate-400">Aggregated from reliable environmental stations via Google Search.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoCard;