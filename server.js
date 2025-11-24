
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_ID = 'gemini-2.5-flash';

// Server-side Cache
const cache = {
  aqi: new Map(),
  suggestions: new Map()
};

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Helper to clean JSON response
const extractJson = (text) => {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) return JSON.parse(jsonMatch[1]);
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

// --- Endpoints ---

/**
 * GET /api/aqi
 * Query params: ?city=Name
 */
app.get('/api/aqi', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: 'City is required' });

  // Check Cache
  const cacheKey = city.toLowerCase();
  if (cache.aqi.has(cacheKey)) {
    const { data, timestamp } = cache.aqi.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      console.log(`[Server Cache Hit] ${city}`);
      return res.json(data);
    }
    cache.aqi.delete(cacheKey);
  }

  console.log(`[Server Fetch] Getting AQI for ${city}`);

  try {
    const prompt = `
      Find the current real-time Air Quality Index (AQI) for "${city}".
      I need the specific numeric AQI value, the dominant pollutant, and weather (temp, humidity, UV).
      Also provide a health advice summary.
      Estimate a breakdown of pollutants (PM2.5, PM10, NO2, SO2, CO, O3).
      Add a short description for each pollutant.

      Format as JSON:
      {
        "city": "string (Official Name, Title Case)",
        "aqi": number,
        "dominantPollutant": "string",
        "temperature": number,
        "humidity": number,
        "uvIndex": number,
        "pollutants": [ {"name": "string", "value": number, "unit": "µg/m³", "description": "string"} ],
        "healthAdvice": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const rawData = extractJson(response.text);
    if (!rawData) throw new Error("Failed to parse AI response");

    // Process sources
    const uniqueUrls = [];
    const seenHosts = new Set();
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk) => {
      if (chunk.web?.uri) {
        try {
          const urlStr = chunk.web.uri;
          const hostname = new URL(urlStr).hostname.replace(/^www\./, '');
          if (!seenHosts.has(hostname)) {
            seenHosts.add(hostname);
            uniqueUrls.push(urlStr);
          }
        } catch (e) {}
      }
    });

    const result = {
      ...rawData,
      level: getAqiLevel(rawData.aqi),
      lastUpdated: new Date().toISOString(),
      sourceUrls: uniqueUrls.slice(0, 5)
    };

    // Update Cache
    cache.aqi.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json(result);
  } catch (error) {
    console.error("Error fetching AQI:", error);
    res.status(500).json({ error: 'Failed to fetch AQI data' });
  }
});

/**
 * GET /api/aqi/location
 * Query params: ?lat=...&lon=...
 */
app.get('/api/aqi/location', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Lat/Lon required' });

  console.log(`[Server Fetch] Location: ${lat}, ${lon}`);

  try {
    const prompt = `
      Identify the city at Latitude: ${lat}, Longitude: ${lon}.
      Then find current AQI, pollutants, and weather.
      Format as JSON (same structure as city search).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const rawData = extractJson(response.text);
    if (!rawData) throw new Error("Failed to parse AI response");

    const result = {
      ...rawData,
      level: getAqiLevel(rawData.aqi),
      lastUpdated: new Date().toISOString(),
      sourceUrls: [] // Simplify for location
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching location AQI:", error);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

/**
 * GET /api/suggestions
 * Query params: ?query=...
 */
app.get('/api/suggestions', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);

  const cacheKey = query.toLowerCase();
  if (cache.suggestions.has(cacheKey)) {
    return res.json(cache.suggestions.get(cacheKey));
  }

  try {
    const prompt = `List 3 major Indian cities matching "${query}". JSON array: [{"name": "City", "aqi": 100}]. Proper caps.`;
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
    });
    
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestions = JSON.parse(cleanText);
    
    // Cache suggestions indefinitely (or until server restart) as they don't change fast
    cache.suggestions.set(cacheKey, suggestions);
    
    res.json(suggestions);
  } catch (error) {
    res.json([]);
  }
});

/**
 * POST /api/chat
 * Body: { message, history, aqiContext }
 */
app.post('/api/chat', async (req, res) => {
  const { message, history, aqiContext } = req.body;

  try {
    let systemInstruction = "You are Atmos, an expert AI assistant for Air Quality and Health. Keep answers concise, friendly, and actionable.";
    
    if (aqiContext) {
      systemInstruction += `
        Current Context:
        City: ${aqiContext.city}
        AQI: ${aqiContext.aqi}
        Pollutants: ${aqiContext.pollutants.map(p => p.name + ': ' + p.value).join(', ')}
        Answer specific to this data.
      `;
    }

    // Convert history to Gemini format
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add new message
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

// Utility
const getAqiLevel = (aqi) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
