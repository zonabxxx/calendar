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
    const { eventId, calendarId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ ok: false, error: 'eventId je povinný' });
    }
    
    // Build URL with parameters
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.append('action', 'deleteEvent');
    url.searchParams.append('eventId', eventId);
    if (calendarId) {
      url.searchParams.append('calendarId', calendarId);
    }
    
    // Call Google Apps Script
    const response = await fetch(url.toString(), { redirect: 'follow' });
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Chyba pri mazaní udalosti'
    });
  }
}

