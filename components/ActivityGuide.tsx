import React from 'react';
import { PersonStanding, Bike, Wind, DoorOpen } from 'lucide-react';

interface ActivityGuideProps {
  aqi: number;
}

const getActivityStatus = (aqi: number) => {
  // Logic to determine safety of activities
  const isGood = aqi <= 50;
  const isModerate = aqi <= 100;
  const isSensitive = aqi <= 150;
  const isUnhealthy = aqi > 150;

  return [
    {
      label: 'Outdoor Sports',
      icon: PersonStanding,
      allowed: !isUnhealthy,
      warning: isSensitive,
      text: isUnhealthy ? 'Avoid' : isSensitive ? 'Limit' : 'Enjoy'
    },
    {
      label: 'Cycling',
      icon: Bike,
      allowed: !isUnhealthy,
      warning: isSensitive,
      text: isUnhealthy ? 'Avoid' : isSensitive ? 'Light' : 'Go for it'
    },
    {
      label: 'Ventilation',
      icon: DoorOpen,
      allowed: !isSensitive && !isUnhealthy,
      warning: isModerate,
      text: isUnhealthy || isSensitive ? 'Keep Closed' : 'Open Windows'
    },
    {
      label: 'Mask Needed',
      icon: Wind,
      allowed: isUnhealthy || isSensitive, // "Allowed" here means "Yes, wear it"
      warning: isModerate,
      text: isUnhealthy ? 'Required' : isSensitive ? 'Recommended' : 'Not Needed',
      inverse: true // Special handling for mask (Yes is bad context usually, but here Yes means Action Required)
    }
  ];
};

const ActivityGuide: React.FC<ActivityGuideProps> = ({ aqi }) => {
  const activities = getActivityStatus(aqi);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {activities.map((activity, idx) => {
        // Determine colors based on status
        // We now explicitly define hover states to prevent grey artifacts
        let colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20';
        
        if (activity.inverse) {
           // Logic for Mask
           if (activity.text === 'Required') colorClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20';
           else if (activity.text === 'Recommended') colorClass = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20';
        } else {
           // Logic for Sports/Windows
           if (!activity.allowed) colorClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20';
           else if (activity.warning) colorClass = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20';
        }

        return (
          <div 
            key={idx}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-75 ease-out hover:scale-105 cursor-default focus:outline-none focus:ring-0 ${colorClass}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <activity.icon className="w-6 h-6 mb-2 opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">{activity.label}</span>
            <span className="text-sm font-bold">{activity.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityGuide;