import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { days = 7, lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
    let location = process.env.WEATHER_LOCATION || 'Bratislava,SK';
    
    // Check if API key is set
    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        error: 'WEATHER_API_KEY nie je nastavený'
      });
    }
    
    // Build weather params
    let weatherParams = {};
    if (lat && lon) {
      weatherParams = {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        appid: apiKey,
        units: 'metric',
        lang: 'sk'
      };
    } else {
      weatherParams = {
        q: location,
        appid: apiKey,
        units: 'metric',
        lang: 'sk'
      };
    }
    
    // Real OpenWeatherMap API call
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast`;
    
    const currentParams = new URLSearchParams(weatherParams);
    const forecastParams = new URLSearchParams(weatherParams);
    
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`${currentUrl}?${currentParams}`),
      fetch(`${forecastUrl}?${forecastParams}`)
    ]);
    
    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    
    // Parse current weather
    const current = {
      temperature: Math.round(currentData.main.temp),
      description: currentData.weather[0].description,
      condition: currentData.weather[0].main.toLowerCase(),
      wind_speed: currentData.wind?.speed || 0,
      wind_deg: currentData.wind?.deg || 0,
      suitable_for_installation: !['rain', 'drizzle', 'thunderstorm', 'snow'].includes(currentData.weather[0].main.toLowerCase()) 
        && currentData.main.temp > 0 
        && (currentData.wind?.speed || 0) < 10
    };
    
    // Parse forecast (one per day)
    const forecast = [];
    const processedDates = new Set();
    
    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!processedDates.has(dateKey) && date.getHours() >= 11 && date.getHours() <= 14) {
        forecast.push({
          date: date.toISOString(),
          temperature: Math.round(item.main.temp),
          description: item.weather[0].description,
          condition: item.weather[0].main.toLowerCase(),
          wind_speed: item.wind?.speed || 0,
          wind_deg: item.wind?.deg || 0,
          suitable_for_installation: !['rain', 'drizzle', 'thunderstorm', 'snow'].includes(item.weather[0].main.toLowerCase()) 
            && item.main.temp > 0 
            && (item.wind?.speed || 0) < 10
        });
        processedDates.add(dateKey);
        
        if (forecast.length >= parseInt(days)) break;
      }
    }
    
    res.status(200).json({
      ok: true,
      location: currentData.name || location,
      current,
      forecast
    });
    
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Chyba pri načítavaní počasia'
    });
  }
}

