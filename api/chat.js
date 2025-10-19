import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// In-memory conversation storage (for demo - in production use a database)
const conversations = new Map();

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
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // System prompt
    let messages = conversations.get(sessionId) || [
      {
        role: 'system',
        content: `Si asistent pre správu Google Kalendára, počasia a vyhľadávania informácií.
        
Komunikuj v slovenčine priateľsky.
Dnešný dátum je ${new Date().toLocaleDateString('sk-SK')}.`
      }
    ];

    messages.push({
      role: 'user',
      content: message
    });

    // Call ChatGPT
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages
    });

    const responseMessage = response.choices[0].message;
    messages.push(responseMessage);
    conversations.set(sessionId, messages);

    res.status(200).json({
      response: responseMessage.content
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}

