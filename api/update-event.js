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
    const { eventId, calendarId, summary, description, start, end, location } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'eventId je povinný' 
      });
    }
    
    // Build URL with parameters
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.append('action', 'updateEvent');
    url.searchParams.append('eventId', eventId);
    if (calendarId) {
      url.searchParams.append('calendarId', calendarId);
    }
    
    // Build update body
    const updateBody = {};
    if (summary) updateBody.summary = summary;
    if (description) updateBody.description = description;
    if (start) updateBody.start = { dateTime: start };
    if (end) updateBody.end = { dateTime: end };
    if (location) updateBody.location = location;
    
    // Call Google Apps Script
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify(updateBody)
    });
    
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Chyba pri úprave udalosti'
    });
  }
}

