import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* AQI Display Skeleton */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/30 p-8 h-auto md:h-[250px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm dark:shadow-none">
        <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-1/3">
           <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg"></div>
           <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700/30 rounded-lg"></div>
           <div className="h-24 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-2xl mt-2"></div>
           <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700/30 rounded-full"></div>
        </div>
        
        {/* Circle Chart Skeleton */}
        <div className="relative w-48 h-48 rounded-full border-4 border-slate-200 dark:border-slate-700/20 flex-shrink-0 flex items-center justify-center">
             <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-700/10"></div>
        </div>

        {/* Weather Metrics Skeleton */}
        <div className="flex flex-col gap-4 w-full md:w-auto min-w-[160px]">
            <div className="h-20 w-full bg-slate-100 dark:bg-slate-700/20 rounded-2xl border border-slate-200 dark:border-slate-700/30 p-4 flex gap-3 items-center">
                 <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/40"></div>
                 <div className="flex flex-col gap-2">
                     <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700/30 rounded"></div>
                     <div className="w-12 h-5 bg-slate-200 dark:bg-slate-700/40 rounded"></div>
                 </div>
            </div>
            <div className="h-20 w-full bg-slate-100 dark:bg-slate-700/20 rounded-2xl border border-slate-200 dark:border-slate-700/30 p-4 flex gap-3 items-center">
                 <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/40"></div>
                 <div className="flex flex-col gap-2">
                     <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700/30 rounded"></div>
                     <div className="w-12 h-5 bg-slate-200 dark:bg-slate-700/40 rounded"></div>
                 </div>
            </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[420px]">
        {/* Chart Skeleton */}
        <div className="bg-white/60 dark:bg-slate-800/30 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 h-full flex flex-col gap-4 shadow-sm dark:shadow-none">
           <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg mb-4"></div>
           <div className="flex-1 space-y-4 py-4">
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3 items-center">
                      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700/30 rounded"></div>
                      <div className="h-6 flex-1 bg-slate-100 dark:bg-slate-700/20 rounded-r-lg relative overflow-hidden">
                          <div className="absolute top-0 left-0 bottom-0 bg-slate-200 dark:bg-slate-700/30 rounded-r-lg" style={{ width: `${Math.random() * 60 + 20}%`}}></div>
                      </div>
                  </div>
              ))}
           </div>
        </div>
        
        {/* Info Card Skeleton */}
        <div className="bg-white/60 dark:bg-slate-800/30 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 h-full flex flex-col gap-6 shadow-sm dark:shadow-none">
           <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700/50 rounded-lg"></div>
           <div className="h-32 w-full bg-slate-100 dark:bg-slate-700/20 rounded-2xl border border-slate-200 dark:border-slate-700/30 p-4 space-y-2">
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700/30 rounded"></div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700/30 rounded"></div>
                <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-700/30 rounded"></div>
           </div>
           <div className="mt-auto space-y-3">
               <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700/30 rounded"></div>
               <div className="flex gap-2 flex-wrap">
                   {[...Array(3)].map((_, i) => (
                       <div key={i} className="h-8 w-24 bg-slate-200 dark:bg-slate-700/30 rounded-lg"></div>
                   ))}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;