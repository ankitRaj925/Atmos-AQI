export enum AqiLevel {
  GOOD = 'Good',
  MODERATE = 'Moderate',
  UNHEALTHY_SENSITIVE = 'Unhealthy for Sensitive Groups',
  UNHEALTHY = 'Unhealthy',
  VERY_UNHEALTHY = 'Very Unhealthy',
  HAZARDOUS = 'Hazardous',
  UNKNOWN = 'Unknown'
}

export interface Pollutant {
  name: string;
  value: number;
  unit: string;
  description?: string;
}

export interface AqiData {
  city: string;
  aqi: number;
  level: AqiLevel;
  dominantPollutant: string;
  pollutants: Pollutant[];
  temperature?: number;
  humidity?: number;
  uvIndex?: number;
  healthAdvice: string;
  lastUpdated: string;
  sourceUrls: string[];
}

export interface CitySuggestion {
  name: string;
  aqi: number;
  country?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isTyping?: boolean;
}