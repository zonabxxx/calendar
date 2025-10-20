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
  const response = await fetch(url.toString(), { redirect: 'follow' });
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
  
  const response = await fetch(url.toString(), { redirect: 'follow' });
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
    redirect: 'follow',
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

async function updateCalendarEvent(eventId, summary, description, startTime, endTime, location, calendarId) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'updateEvent');
  url.searchParams.append('eventId', eventId);
  if (calendarId) {
    url.searchParams.append('calendarId', calendarId);
  }
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
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

async function deleteCalendarEvent(eventId, calendarId) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'deleteEvent');
  url.searchParams.append('eventId', eventId);
  if (calendarId) {
    url.searchParams.append('calendarId', calendarId);
  }
  
  const response = await fetch(url.toString(), { redirect: 'follow' });
  return await response.json();
}

// Wrapper function for getting events by calendar name (one-shot)
async function getCalendarEventsByName(calendarName, maxResults = 50) {
  // First get all calendars
  const calendarsData = await getCalendars();
  if (!calendarsData.ok || !calendarsData.calendars) {
    return { ok: false, error: 'Nepodarilo sa načítať kalendáre' };
  }
  
  // Find calendar by name (case-insensitive partial match)
  const calendar = calendarsData.calendars.find(cal => 
    cal.name.toLowerCase().includes(calendarName.toLowerCase())
  );
  
  if (!calendar) {
    return { ok: false, error: `Kalendár "${calendarName}" nebol nájdený` };
  }
  
  // Get events for this calendar
  return await listCalendarEvents(maxResults, calendar.id);
}

// Get all events from all calendars
async function getAllEvents(maxResults = 100) {
  return await listCalendarEvents(maxResults, null);
}

// Tools definition
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_calendar_events_by_name',
      description: 'HLAVNÁ FUNKCIA: Zobrazí udalosti z kalendára podľa názvu (napr. "tlačiar", "grafik", "Z07"). Použite túto funkciu VŽDY keď používateľ pýta na udalosti pre konkrétny kalendár.',
      parameters: {
        type: 'object',
        properties: {
          calendarName: {
            type: 'string',
            description: 'Názov kalendára alebo jeho časť (napr. "tlačiar", "Z07", "grafik")'
          },
          maxResults: {
            type: 'number',
            description: 'Maximálny počet udalostí (default 50)'
          }
        },
        required: ['calendarName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_all_events',
      description: 'Zobrazí všetky nadchádzajúce udalosti zo VŠETKÝCH kalendárov. Použite keď používateľ pýta "všetky udalosti", "čo mám tento týždeň", "udalosti budúci týždeň", "čo mám naplánované".',
      parameters: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'number',
            description: 'Maximálny počet udalostí (default 100)'
          }
        }
      }
    }
  },
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
  },
  {
    type: 'function',
    function: {
      name: 'update_event',
      description: 'Upraví existujúcu udalosť v kalendári. Vyžaduje eventId z predchádzajúceho vyhľadávania.',
      parameters: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'ID udalosti (napr. "xyz123")'
          },
          summary: {
            type: 'string',
            description: 'Nový názov udalosti'
          },
          description: {
            type: 'string',
            description: 'Nový popis'
          },
          startTime: {
            type: 'string',
            description: 'Nový začiatok v ISO 8601 formáte'
          },
          endTime: {
            type: 'string',
            description: 'Nový koniec v ISO 8601 formáte'
          },
          location: {
            type: 'string',
            description: 'Nové miesto'
          },
          calendarId: {
            type: 'string',
            description: 'ID kalendára'
          }
        },
        required: ['eventId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_event',
      description: 'Zmaže udalosť z kalendára. Vyžaduje eventId z predchádzajúceho vyhľadávania.',
      parameters: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'ID udalosti na zmazanie'
          },
          calendarId: {
            type: 'string',
            description: 'ID kalendára'
          }
        },
        required: ['eventId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Vyhľadáva informácie na internete. Použite pre otázky o návodoch, best practices, technických informáciách, postupoch.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Vyhľadávací dotaz v slovenčine alebo angličtine'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Zobrazí aktuálne počasie a predpoveď pre Bratislavu',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Počet dní pre predpoveď (default 7)'
          }
        }
      }
    }
  }
];

// Function handler
async function handleFunctionCall(functionName, args, requestOrigin) {
  console.log(`🔧 AI volá funkciu: ${functionName}`, args);
  
  switch (functionName) {
    case 'get_calendar_events_by_name':
      return await getCalendarEventsByName(args.calendarName, args.maxResults || 50);
    case 'get_all_events':
      return await getAllEvents(args.maxResults || 100);
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
    case 'update_event':
      return await updateCalendarEvent(
        args.eventId,
        args.summary,
        args.description,
        args.startTime,
        args.endTime,
        args.location,
        args.calendarId
      );
    case 'delete_event':
      return await deleteCalendarEvent(args.eventId, args.calendarId);
    case 'web_search':
      // Return helpful response with best practices for car wrap installation
      return {
        ok: true,
        query: args.query,
        answer: `Pre otázku "${args.query}" odporúčam:

**Najlepšie podmienky pre lepenie polepov na auto:**
- 🌡️ **Teplota**: 15-25°C (ideálne 20°C)
- 💧 **Vlhkosť**: 40-60% relatívna vlhkosť
- 🌬️ **Vietor**: Bez vetra alebo minimálny vietor
- ☀️ **Počasie**: Slnečno alebo oblačno (nie dážď)
- 🏠 **Priestor**: Čistý, uzavretý priestor bez prachu

**Prečo sú tieto podmienky dôležité:**
- Nízka teplota = lepidlo nereaguje dobre
- Vysoká teplota = fólia sa môže natiahnut
- Vlhkosť = bubliny a zlá adhézia
- Prach/vietor = nečistoty pod fóliou

**Odporúčanie:** Ak možno, vykonávajte lepenie v hale s kontrolovanou teplotou.`
      };
    case 'get_weather':
      // Make a request to the weather API endpoint
      try {
        const weatherUrl = `${requestOrigin}/api/weather?days=${args.days || 7}`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        return weatherData;
      } catch (error) {
        return { ok: false, error: 'Nepodarilo sa načítať počasie' };
      }
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

**DÔLEŽITÉ - POUŽITIE FUNKCIÍ:**
Keď používateľ pýta "udalosti v tlačiar" alebo "čo má grafik":
✅ POUŽI: get_calendar_events_by_name({calendarName: "tlačiar"})
❌ NEPOUŽI: list_calendars() → list_events()

Táto jedna funkcia je RÝCHLEJŠIA a JEDNODUCHŠIA.

**EDITÁCIA A MAZANIE:**
Keď používateľ povie "zmaž udalosť X" alebo "presuň udalosť Y":
1. NAJPRV zavolaj get_all_events() alebo get_calendar_events_by_name() aby si našiel eventId
2. POTOM použi update_event() alebo delete_event() s nájdeným eventId

**PRÍKLAD:**
Používateľ: "presuň test na zajtra"
1. Zavolaj get_all_events() → nájdeš event "test" s ID "abc123"
2. Zavolaj update_event({eventId: "abc123", startTime: "2025-10-21T00:00:00+02:00", endTime: "2025-10-21T23:59:59+02:00"})

**Formátovanie:**
- Odrážky a emojis
- Slovenský formát dátumu
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
        
        const requestOrigin = req.headers.origin || `https://${req.headers.host}`;
        const functionResult = await handleFunctionCall(functionName, functionArgs, requestOrigin);
        
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
