import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Pollutant } from '../types';
import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface PollutantChartProps {
  pollutants: Pollutant[];
}

const getPollutantStatus = (name: string, value: number) => {
  const n = name.toUpperCase();
  
  // Thresholds based on typical EPA/WHO visual guidelines (simplified)
  let safe = 20; 
  let moderate = 50;

  if (n.includes('PM2.5')) { safe = 12; moderate = 35.4; }
  else if (n.includes('PM10')) { safe = 54; moderate = 154; }
  else if (n.includes('O3') || n.includes('OZONE')) { safe = 54; moderate = 85; } // ppb
  else if (n.includes('NO2')) { safe = 53; moderate = 100; } // ppb
  else if (n.includes('SO2')) { safe = 35; moderate = 75; } // ppb
  else if (n.includes('CO')) { safe = 4.4; moderate = 9.4; } // ppm

  // Heuristic adjustment for potential unit differences (e.g. CO in µg/m³ vs ppm)
  if (n.includes('CO') && value > 100) { safe = 4000; moderate = 10000; } 

  let result = { color: '#f43f5e', level: 'Unhealthy', icon: AlertOctagon, safe };
  
  if (value <= safe) {
    result = { color: '#34d399', level: 'Good', icon: CheckCircle, safe };
  } else if (value <= moderate) {
    result = { color: '#fbbf24', level: 'Moderate', icon: AlertTriangle, safe };
  }

  return result;
};

const getPollutantDescription = (name: string, providedDesc?: string) => {
  if (providedDesc) return providedDesc;
  
  const n = name.toUpperCase();
  if (n.includes('PM2.5')) return "Fine particles (<2.5µm) that penetrate deep into lungs and bloodstream.";
  if (n.includes('PM10')) return "Inhalable particles (<10µm) that irritate eyes, nose, and throat.";
  if (n.includes('O3') || n.includes('OZONE')) return "Ground-level ozone; a respiratory irritant formed by sunlight.";
  if (n.includes('NO2')) return "Nitrogen Dioxide; gas from vehicles that inflames lung lining.";
  if (n.includes('SO2')) return "Sulfur Dioxide; from burning fossil fuels, harms respiratory system.";
  if (n.includes('CO')) return "Carbon Monoxide; odorless gas from combustion that reduces oxygen delivery.";
  return "Concentration of this specific air pollutant.";
};

const CustomBarLabel = (props: any) => {
  const { x, y, width, height, index, pollutants } = props;
  const entry = pollutants[index];
  if (!entry) return null;

  const { color, icon: Icon } = getPollutantStatus(entry.name, entry.value);
  
  return (
    <g transform={`translate(${x + width + 8}, ${y + height / 2 - 8})`}>
      <foreignObject width={16} height={16} style={{ overflow: 'visible' }}>
        <Icon size={16} color={color} strokeWidth={2.5} />
      </foreignObject>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { level, color, safe } = getPollutantStatus(data.name, data.value);
    const description = getPollutantDescription(data.name, data.description);
    
    return (
      <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-xl backdrop-blur-sm text-slate-100 z-50 max-w-[240px]">
        <div className="flex justify-between items-start">
           <p className="font-semibold mb-1 text-sm text-slate-300">{data.name}</p>
           <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
             Safe: ≤{safe}
           </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-bold text-white">{data.value}</span>
          <span className="text-xs text-slate-400 font-medium">{data.unit}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2" style={{ color }}>
           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
           <span>{level}</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight border-t border-slate-700 pt-2">
          {description}
        </p>
      </div>
    );
  }
  return null;
};

const PollutantChart: React.FC<PollutantChartProps> = ({ pollutants }) => {
  if (pollutants.length === 0) return null;

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 h-full flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
      <style>{`
        .recharts-wrapper path:focus,
        .recharts-wrapper rect:focus,
        .recharts-wrapper g:focus {
          outline: none !important;
        }
      `}</style>
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-indigo-500 rounded-full block"></span>
          Pollutants
        </h3>
        
        {/* Legend */}
        <div className="flex gap-3 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-700/50">
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-emerald-400"></div> <span>Safe</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-amber-400"></div> <span>Mod</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-rose-500"></div> <span>High</span>
           </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={pollutants} 
            layout="vertical" 
            margin={{ left: 10, right: 35, top: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
              width={50}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'transparent' }} 
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28} activeBar={false}>
              {pollutants.map((entry, index) => {
                const { color } = getPollutantStatus(entry.name, entry.value);
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
              <LabelList dataKey="value" content={(props: any) => <CustomBarLabel {...props} pollutants={pollutants} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
        Concentrations in µg/m³ or ppb. Hover bars for thresholds.
      </p>
    </div>
  );
};

export default PollutantChart;