
import { GoogleGenAI } from "@google/genai";
import { AqiData, AqiLevel, CitySuggestion, ChatMessage } from '../types';
import { getCachedData, setCachedData } from './cacheService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_ID = 'gemini-2.5-flash';

// Helper to determine AQI Level based on value
const getAqiLevel = (aqi: number): AqiLevel => {
  if (aqi <= 50) return AqiLevel.GOOD;
  if (aqi <= 100) return AqiLevel.MODERATE;
  if (aqi <= 150) return AqiLevel.UNHEALTHY_SENSITIVE;
  if (aqi <= 200) return AqiLevel.UNHEALTHY;
  if (aqi <= 300) return AqiLevel.VERY_UNHEALTHY;
  return AqiLevel.HAZARDOUS;
};

// Helper to clean JSON string from Markdown formatting
const cleanJsonString = (text: string): string => {
  return text.replace(/```json\s*|\s*```/g, '').trim();
};

// In-memory request cache for suggestions to prevent flickering
const suggestionCache = new Map<string, CitySuggestion[]>();

/**
 * Fetches AQI data for a given city using Gemini + Google Search Tool.
 */
export const fetchAqiForCity = async (city: string): Promise<AqiData> => {
  const cacheKey = `aqi_${city.toLowerCase()}`;
  const cached = getCachedData<AqiData>(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Returning data for ${city}`);
    return cached;
  }

  const prompt = `
    Find the real-time Air Quality Index (AQI) for "${city}".
    I need the specific numeric AQI value, the dominant pollutant, and weather details (temperature, humidity, UV index).
    Also provide a health advice summary based on the AQI.
    Estimate a breakdown of pollutants (PM2.5, PM10, NO2, SO2, CO, O3) with values.
    Add a short, 1-sentence description for each pollutant explaining what it is.

    IMPORTANT: 
    1. The "city" field in response MUST be the official, properly capitalized name of the city (e.g., if I search "begusarai", return "Begusarai").
    2. Provide at least 3 distinct source URLs.

    Return the data in this strictly valid JSON format:
    {
      "city": "string (Title Case)",
      "aqi": number,
      "dominantPollutant": "string",
      "temperature": number,
      "humidity": number,
      "uvIndex": number,
      "pollutants": [
        { "name": "string", "value": number, "unit": "µg/m³", "description": "string" }
      ],
      "healthAdvice": "string"
    }
  `;

  try {
    // Primary attempt with Search Tool
    // Note: Do NOT use responseMimeType with googleSearch tool
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const jsonText = response.text || "{}";
    const rawData = JSON.parse(cleanJsonString(jsonText));

    // Extract grounding sources
    const uniqueUrls: string[] = [];
    const seenHosts = new Set<string>();
    
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
           try {
             const url = chunk.web.uri;
             const hostname = new URL(url).hostname.replace(/^www\./, '');
             if (!seenHosts.has(hostname)) {
               seenHosts.add(hostname);
               uniqueUrls.push(url);
             }
           } catch (e) {
             // invalid url, skip
           }
        }
      });
    }

    const result: AqiData = {
      city: rawData.city || city.charAt(0).toUpperCase() + city.slice(1),
      aqi: rawData.aqi || 0,
      level: getAqiLevel(rawData.aqi || 0),
      dominantPollutant: rawData.dominantPollutant || "Unknown",
      pollutants: rawData.pollutants || [],
      temperature: rawData.temperature,
      humidity: rawData.humidity,
      uvIndex: rawData.uvIndex,
      healthAdvice: rawData.healthAdvice || "No advice available.",
      lastUpdated: new Date().toISOString(),
      sourceUrls: uniqueUrls.slice(0, 5) // Top 5 unique sources
    };

    setCachedData(cacheKey, result);
    return result;

  } catch (error) {
    console.error("Gemini API Error (Search):", error);
    
    // Fallback: Try without tools if search fails (e.g., region lock or quota)
    try {
      console.log("Attempting fallback without search tool...");
      const fallbackResponse = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt + " \n(Estimate values based on known patterns if real-time data is unavailable).",
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const jsonText = fallbackResponse.text || "{}";
      const rawData = JSON.parse(cleanJsonString(jsonText));
      
      const result: AqiData = {
        city: rawData.city || city,
        aqi: rawData.aqi || 0,
        level: getAqiLevel(rawData.aqi || 0),
        dominantPollutant: rawData.dominantPollutant || "Unknown",
        pollutants: rawData.pollutants || [],
        temperature: rawData.temperature,
        humidity: rawData.humidity,
        uvIndex: rawData.uvIndex,
        healthAdvice: rawData.healthAdvice || "No advice available.",
        lastUpdated: new Date().toISOString(),
        sourceUrls: []
      };
      
      return result;

    } catch (fallbackError) {
      console.error("Gemini Fallback Error:", fallbackError);
      throw new Error("Failed to fetch AQI data. Please try again.");
    }
  }
};

/**
 * Fetches AQI data for a specific geolocation.
 */
export const fetchAqiForLocation = async (lat: number, lon: number): Promise<AqiData> => {
  const prompt = `
    Identify the city or area at Latitude: ${lat}, Longitude: ${lon}.
    Then, find the current Air Quality Index (AQI) and weather for that location.
    
    Return the data in this strictly valid JSON format:
    {
      "city": "string (Official Name)",
      "aqi": number,
      "dominantPollutant": "string",
      "temperature": number,
      "humidity": number,
      "uvIndex": number,
      "pollutants": [
        { "name": "string", "value": number, "unit": "µg/m³", "description": "string" }
      ],
      "healthAdvice": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType cannot be used with tools
      }
    });

    const jsonText = response.text || "{}";
    const rawData = JSON.parse(cleanJsonString(jsonText));

    return {
      city: rawData.city || `Loc: ${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      aqi: rawData.aqi || 0,
      level: getAqiLevel(rawData.aqi || 0),
      dominantPollutant: rawData.dominantPollutant || "Unknown",
      pollutants: rawData.pollutants || [],
      temperature: rawData.temperature,
      humidity: rawData.humidity,
      uvIndex: rawData.uvIndex,
      healthAdvice: rawData.healthAdvice || "No advice available.",
      lastUpdated: new Date().toISOString(),
      sourceUrls: []
    };
  } catch (error) {
    console.error("Gemini Location Error:", error);
    throw new Error("Failed to fetch location data.");
  }
};

/**
 * Fetches city suggestions.
 * Optimized for speed: Checks memory cache first, then API.
 */
export const fetchCitySuggestions = async (query: string): Promise<CitySuggestion[]> => {
  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery.length < 2) return [];

  // 1. Check in-memory cache
  if (suggestionCache.has(cleanQuery)) {
    return suggestionCache.get(cleanQuery)!;
  }

  // 2. Fallback to API (Fast response, no tools)
  const prompt = `
    List 3 major Indian cities matching "${query}". JSON only: [{"name": "City", "aqi": 100}]. Title case.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use Flash for speed
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "[]";
    const suggestions = JSON.parse(cleanJsonString(text));
    
    // Save to cache
    suggestionCache.set(cleanQuery, suggestions);
    
    return suggestions;
  } catch (error) {
    console.error("Suggestion Error:", error);
    return [];
  }
};

/**
 * Sends a chat message to the AI Assistant.
 * Client-side implementation using history.
 */
export const sendChatMessage = async (
  message: string, 
  history: ChatMessage[], 
  aqiContext: AqiData | null
): Promise<string> => {
  try {
    let systemInstruction = "You are Atmos, an expert AI assistant for Air Quality and Health. Keep answers concise, friendly, and actionable.";
    
    if (aqiContext) {
      systemInstruction += `
        Current Context:
        City: ${aqiContext.city}
        AQI: ${aqiContext.aqi}
        Level: ${aqiContext.level}
        Pollutants: ${aqiContext.pollutants.map(p => p.name + ': ' + p.value).join(', ')}
        Answer questions specific to this city's data if asked.
      `;
    }

    // Convert internal message format to Gemini content format
    const contents = history
      .filter(h => h.id !== 'welcome' && !h.isTyping) // Remove welcome and typing indicators
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    // Add the new user message
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return response.text || "I'm having trouble thinking right now.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I am unable to connect to the AI right now.";
  }
};
