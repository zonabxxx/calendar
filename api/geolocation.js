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
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    
    // For localhost or unknown IP, return default location
    if (clientIP === 'unknown' || clientIP.includes('127.0.0.1') || clientIP.includes('::1')) {
      return res.status(200).json({
        ok: true,
        city: 'Bratislava',
        country: 'SK',
        latitude: 48.1486,
        longitude: 17.1077
      });
    }
    
    // Try to get location from IP
    const response = await fetch(`https://ipapi.co/${clientIP}/json/`);
    const data = await response.json();
    
    if (data.error) {
      // Fallback to default
      return res.status(200).json({
        ok: true,
        city: 'Bratislava',
        country: 'SK',
        latitude: 48.1486,
        longitude: 17.1077
      });
    }
    
    res.status(200).json({
      ok: true,
      city: data.city || 'Bratislava',
      country: data.country_code || 'SK',
      latitude: data.latitude || 48.1486,
      longitude: data.longitude || 17.1077
    });
    
  } catch (error) {
    console.error('Geolocation error:', error);
    // Return default location on error
    res.status(200).json({
      ok: true,
      city: 'Bratislava',
      country: 'SK',
      latitude: 48.1486,
      longitude: 17.1077
    });
  }
}

