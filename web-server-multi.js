// Update web-server.js to support multi-calendar
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// CALENDAR FUNCTIONS
// ============================================================================

async function listCalendars() {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'listCalendars');
  
  const response = await fetch(url.toString());
  return await response.json();
}

async function listCalendarEvents(maxResults = 20) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'getEvents');
  url.searchParams.append('allCalendars', 'true');
  url.searchParams.append('maxResults', maxResults);
  
  const response = await fetch(url.toString());
  return await response.json();
}

async function addCalendarEvent(summary, description, startTime, endTime, location, calendarId = 'primary') {
  const body = {
    calendarId: calendarId,
    summary,
    description: description || '',
    location: location || '',
    start: { dateTime: startTime },
    end: { dateTime: endTime }
  };
  
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  return await response.json();
}

// ============================================================================
// CHATGPT TOOLS
// ============================================================================

const tools = [
  {
    type: 'function',
    function: {
      name: 'list_calendars',
      description: 'Zobrazí zoznam všetkých dostupných kalendárov (zamestnancov)',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'Zobrazí zoznam udalostí zo všetkých kalendárov',
      parameters: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'number',
            description: 'Maximálny počet udalostí (default 20)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_event',
      description: 'Pridá novú udalosť do kalendára konkrétneho zamestnanca',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Názov udalosti'
          },
          description: {
            type: 'string',
            description: 'Popis udalosti'
          },
          startTime: {
            type: 'string',
            description: 'Začiatok v ISO 8601 formáte'
          },
          endTime: {
            type: 'string',
            description: 'Koniec v ISO 8601 formáte'
          },
          location: {
            type: 'string',
            description: 'Miesto konania'
          },
          calendarId: {
            type: 'string',
            description: 'Email kalendára (zamestnanca) alebo "primary"'
          }
        },
        required: ['summary', 'startTime', 'endTime']
      }
    }
  }
];

// ============================================================================
// FUNCTION CALL HANDLER
// ============================================================================

async function handleFunctionCall(functionName, args) {
  switch (functionName) {
    case 'list_calendars':
      return await listCalendars();
    case 'list_events':
      return await listCalendarEvents(args.maxResults || 20);
    case 'add_event':
      return await addCalendarEvent(
        args.summary,
        args.description,
        args.startTime,
        args.endTime,
        args.location,
        args.calendarId
      );
    default:
      return { error: 'Neznáma funkcia' };
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

const conversations = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let messages = conversations.get(sessionId) || [
      {
        role: 'system',
        content: `Si asistent pre správu viacerých Google Kalendárov. Pomáhaš používateľovi:
- Zobraziť zoznam kalendárov (zamestnancov)
- Zobraziť udalosti zo všetkých kalendárov
- Pridávať nové udalosti do konkrétneho kalendára

Komunikuj v slovenčine. Keď používateľ chce pridať udalosť, opýtaj sa do ktorého kalendára (ktorému zamestnancovi).
Dátum a čas vždy formátuj ako ISO 8601 s timezone (napr. 2025-10-20T14:00:00+02:00).
Dnešný dátum je ${new Date().toLocaleDateString('sk-SK')}.`
      }
    ];

    messages.push({
      role: 'user',
      content: message
    });

    let response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      tools: tools,
      tool_choice: 'auto'
    });

    let responseMessage = response.choices[0].message;
    const functionCalls = [];

    while (responseMessage.tool_calls) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        functionCalls.push({
          name: functionName,
          args: functionArgs
        });
        
        const functionResult = await handleFunctionCall(functionName, functionArgs);
        
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult)
        });
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages
      });

      responseMessage = response.choices[0].message;
    }

    messages.push(responseMessage);
    conversations.set(sessionId, messages);

    res.json({
      response: responseMessage.content,
      functionCalls: functionCalls
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Chyba pri spracovaní správy',
      details: error.message 
    });
  }
});

app.post('/api/reset', (req, res) => {
  const { sessionId } = req.body;
  conversations.delete(sessionId);
  res.json({ success: true });
});

// Get all calendars
app.get('/api/calendars', async (req, res) => {
  try {
    const data = await listCalendars();
    console.log('Calendars:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Calendars error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const data = await listCalendarEvents(50);
    console.log('Events loaded:', data.count);
    res.json(data);
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    openai: !!process.env.OPENAI_API_KEY,
    calendar: !!process.env.GOOGLE_SCRIPT_URL,
    multiCalendar: true
  });
});

app.listen(PORT, () => {
  console.log(`\n🌐 Multi-Calendar Web Server beží na http://localhost:${PORT}`);
  console.log(`📅 Google Script: ${GOOGLE_SCRIPT_URL ? '✅' : '❌'}`);
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`🗓️  Multi-Calendar Support: ✅\n`);
});

