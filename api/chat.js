import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const conversations = new Map();

// Helper functions
async function getCalendars() {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'getCalendars');
  const response = await fetch(url.toString());
  return await response.json();
}

async function listCalendarEvents(maxResults = 10, calendarId = null) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'getEvents');
  url.searchParams.append('maxResults', maxResults);
  
  if (calendarId) {
    url.searchParams.append('calendarId', calendarId);
  } else {
    url.searchParams.append('allCalendars', 'true');
  }
  
  url.searchParams.append('daysAhead', '60');
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  return {
    ok: data.ok,
    events: data.events || [],
    count: data.events ? data.events.length : 0
  };
}

async function addCalendarEvent(summary, description, startTime, endTime, location, calendarId) {
  const response = await fetch(`${GOOGLE_SCRIPT_URL}${calendarId ? `?calendarId=${calendarId}` : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      location
    })
  });
  return await response.json();
}

// Tools definition
const tools = [
  {
    type: 'function',
    function: {
      name: 'list_calendars',
      description: 'Zobrazí zoznam všetkých kalendárov',
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
      description: 'Zobrazí udalosti z kalendára',
      parameters: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'number',
            description: 'Maximálny počet udalostí (default 50)'
          },
          calendarId: {
            type: 'string',
            description: 'ID kalendára'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_event',
      description: 'Pridá novú udalosť do kalendára',
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
            description: 'Začiatok v ISO 8601 formáte (napr. 2025-10-28T09:00:00+02:00)'
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
            description: 'ID kalendára'
          }
        },
        required: ['summary', 'startTime', 'endTime']
      }
    }
  }
];

// Function handler
async function handleFunctionCall(functionName, args) {
  console.log(`🔧 AI volá funkciu: ${functionName}`, args);
  
  switch (functionName) {
    case 'list_calendars':
      return await getCalendars();
    case 'list_events':
      return await listCalendarEvents(args.maxResults || 50, args.calendarId);
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

export default async function handler(req, res) {
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

    let messages = conversations.get(sessionId) || [
      {
        role: 'system',
        content: `Si asistent pre správu Google Kalendára. Pomáhaš používateľovi:
- Zobraziť udalosti z kalendára  
- Pridávať nové udalosti
- Odpovedať na otázky o kalendári

**Formátovanie:**
- Odrážky a emojis
- Slovenský formát dátumu
- Ak používateľ povie "3 hodiny", vypočítaj endTime = startTime + 3h
- Formát času: ISO 8601 s timezone (napr. 2025-10-28T09:00:00+02:00)

Komunikuj v slovenčine priateľsky.
Dnešný dátum je ${new Date().toLocaleDateString('sk-SK')}.`
      }
    ];

    messages.push({
      role: 'user',
      content: message
    });

    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      tools: tools,
      tool_choice: 'auto'
    });

    let responseMessage = response.choices[0].message;
    const functionCalls = [];

    // Handle function calls
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
        model: 'gpt-4o',
        messages: messages
      });

      responseMessage = response.choices[0].message;
    }

    messages.push(responseMessage);
    conversations.set(sessionId, messages);

    res.status(200).json({
      response: responseMessage.content,
      functionCalls: functionCalls
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}
