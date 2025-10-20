import fetch from 'node-fetch';

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { calendarId, summary, description, start, end, location } = req.body;
    
    if (!summary || !start || !end) {
      return res.status(400).json({ 
        ok: false, 
        error: 'summary, start a end sú povinné' 
      });
    }
    
    // Build URL with calendarId if provided
    let url = GOOGLE_SCRIPT_URL;
    if (calendarId) {
      const urlObj = new URL(GOOGLE_SCRIPT_URL);
      urlObj.searchParams.append('calendarId', calendarId);
      url = urlObj.toString();
    }
    
    // Call Google Apps Script
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        location
      })
    });
    
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Chyba pri vytváraní udalosti'
    });
  }
}

