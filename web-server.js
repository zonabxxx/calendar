import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import duckduckgoSearch from 'duckduckgo-search';

const { search } = duckduckgoSearch;

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

// Redirect root to google-style.html (must be before static middleware)
app.get('/', (req, res) => {
  res.redirect('/google-style.html');
});

app.use(express.static(path.join(__dirname, 'public')));

// Funkcie pre kalendár
async function listCalendarEvents(maxResults = 10, calendarId = null) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'getEvents');
  url.searchParams.append('maxResults', maxResults);
  
  if (calendarId) {
    url.searchParams.append('calendarId', calendarId);
  } else {
    url.searchParams.append('allCalendars', 'true');
  }
  
  const response = await fetch(url.toString());
  return await response.json();
}

async function addCalendarEvent(summary, description, startTime, endTime, location, calendarId) {
  const body = {
    calendarId: calendarId || 'primary', // Ak nie je zadaný, použije primárny
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

async function syncCalendarsFromSheet() {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'syncFromSheet');
  
  const response = await fetch(url.toString());
  return await response.json();
}

async function getSheetData() {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'getSheetData');
  
  const response = await fetch(url.toString());
  return await response.json();
}

// Weather functions
async function getWeather(days = 7) {
  try {
    const response = await fetch(`http://localhost:${PORT}/api/weather?days=${days}`);
    const data = await response.json();
    
    if (!data.ok) {
      return { error: 'Nepodarilo sa načítať počasie' };
    }
    
    // Format response for AI
    const current = data.current;
    const forecast = data.forecast;
    
    return {
      ok: true,
      location: data.location,
      current: {
        temperature: Math.round(current.temperature),
        description: current.description,
        wind: `${Math.round(current.wind_speed * 3.6)} km/h`,
        suitable_for_installation: current.suitable_for_installation
      },
      forecast: forecast.map(day => ({
        date: new Date(day.date).toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' }),
        temperature: Math.round(day.temperature),
        description: day.description,
        wind: `${Math.round(day.wind_speed * 3.6)} km/h`,
        suitable_for_installation: day.suitable_for_installation
      }))
    };
  } catch (error) {
    return { error: `Chyba pri načítavaní počasia: ${error.message}` };
  }
}

// Web Search function
async function webSearch(query, maxResults = 5) {
  try {
    console.log(`🔍 Vyhľadávam: "${query}"`);
    
    const results = await search(query, {
      safeSearch: 'moderate',
      maxResults: maxResults
    });
    
    if (!results || results.length === 0) {
      return {
        ok: false,
        error: 'Nenašli sa žiadne výsledky'
      };
    }
    
    // Format results for AI
    const formattedResults = results.slice(0, maxResults).map((result, index) => ({
      position: index + 1,
      title: result.title,
      snippet: result.body || result.description || '',
      url: result.href || result.url
    }));
    
    return {
      ok: true,
      query: query,
      results: formattedResults,
      count: formattedResults.length
    };
  } catch (error) {
    console.error('Chyba pri vyhľadávaní:', error);
    return {
      ok: false,
      error: `Chyba pri vyhľadávaní: ${error.message}`
    };
  }
}

async function getWeatherForDate(dateStr) {
  try {
    // Parse date
    let targetDate = new Date();
    
    if (dateStr.toLowerCase() === 'tomorrow' || dateStr.toLowerCase() === 'zajtra') {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (dateStr.toLowerCase() === 'monday' || dateStr.toLowerCase() === 'pondelok') {
      const daysUntilMonday = (1 - targetDate.getDay() + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + daysUntilMonday);
    } else {
      targetDate = new Date(dateStr);
    }
    
    // Get forecast
    const weatherData = await getWeather(14);
    
    if (!weatherData.ok) {
      return weatherData;
    }
    
    // Find weather for specific date
    const targetDateStr = targetDate.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' });
    const dayWeather = weatherData.forecast.find(day => day.date === targetDateStr);
    
    if (!dayWeather) {
      return {
        ok: false,
        error: `Nemám predpoveď počasia pre ${targetDateStr}. Prognóza je k dispozícii iba na najbližších 7-14 dní.`
      };
    }
    
    return {
      ok: true,
      date: targetDateStr,
      weather: dayWeather
    };
  } catch (error) {
    return { error: `Chyba pri spracovaní dátumu: ${error.message}` };
  }
}

// Nástroje pre ChatGPT
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_calendar_events_by_name',
      description: 'Nájde kalendár podľa názvu (napr. "tlačiar", "grafik") a vypíše z neho všetky udalosti. Toto je ONE-SHOT funkcia - zavolá list_calendars aj list_events naraz!',
      parameters: {
        type: 'object',
        properties: {
          calendarName: {
            type: 'string',
            description: 'Názov kalendára/pozície, ktorú hľadáš (napr. "tlačiar", "grafik", "obchodník")'
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
      name: 'add_event_by_calendar_name',
      description: 'Pridá udalosť do kalendára podľa názvu pozície (napr. "lepič", "tlačiar"). ONE-SHOT funkcia - sama nájde kalendár a pridá udalosť!',
      parameters: {
        type: 'object',
        properties: {
          calendarName: {
            type: 'string',
            description: 'Názov pozície/kalendára (napr. "lepič", "grafik", "obchodník")'
          },
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
            description: 'Začiatok v ISO 8601 formáte (napr. 2025-10-26T10:00:00+02:00). Ak používateľ povie "1,2 hodiny", vypočítaj endTime.'
          },
          endTime: {
            type: 'string',
            description: 'Koniec v ISO 8601 formáte. Ak používateľ povie trvanie (napr. 1,2h), vypočítaj z startTime.'
          },
          location: {
            type: 'string',
            description: 'Miesto konania'
          }
        },
        required: ['calendarName', 'summary', 'startTime', 'endTime']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'Zobrazí zoznam udalostí z Google Kalendára. Ak používateľ pýta na konkrétny kalendár (napr. "tlačiar", "grafik"), použi radšej get_calendar_events_by_name!',
      parameters: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'number',
            description: 'Maximálny počet udalostí (default 10)'
          },
          calendarId: {
            type: 'string',
            description: 'ID kalendára, z ktorého chceš načítať udalosti.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_event',
      description: 'Pridá novú udalosť do Google Kalendára. DÔLEŽITÉ: Ak používateľ špecifikuje osobu/pozíciu (napr. "obchodník", "grafik", "tlačiar"), použi radšej add_event_by_calendar_name!',
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
            description: 'Začiatok v ISO 8601 formáte (napr. 2025-10-20T14:00:00+02:00)'
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
            description: 'ID kalendára do ktorého pridať udalosť. Ak nie je špecifikované, použije sa primárny kalendár.'
          }
        },
        required: ['summary', 'startTime', 'endTime']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_calendars',
      description: 'Zobrazí zoznam všetkých kalendárov. ⚠️ DÔLEŽITÉ: Keď používateľ pýta "vypiš udalosti na X", MUSÍŠ po získaní zoznamu IHNEĎ zavolať list_events() s calendarId! NEZASTAVUJ SA a nereaguj textom!',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'sync_calendars_from_sheet',
      description: 'Vytvorí kalendáre pre všetkých zamestnancov z Google Sheets tabuľky. Automaticky načíta zoznam ľudí a pre každého vytvorí osobný kalendár.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_sheet_employees',
      description: 'Zobrazí zoznam zamestnancov z Google Sheets tabuľky pred vytvorením kalendárov',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Zobrazí aktuálne počasie a predpoveď pre Bratislavu. Použite keď používateľ pýta "aké je počasie", "bude pršať", "môžem montovať" atď.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Počet dní pre predpoveď (default 7, max 14)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_weather_for_date',
      description: 'Zistí počasie pre konkrétny dátum (napr. pondelok, zajtra, 25. október)',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Dátum v ISO formáte (YYYY-MM-DD) alebo relatívny (napr. "tomorrow", "monday")'
          }
        },
        required: ['date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Vyhľadáva informácie na internete pomocou DuckDuckGo. Použite pre otázky o návodoch, best practices, technických informáciách, inštalačných postupoch, atď.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Vyhľadávací dotaz v slovenčine alebo angličtine'
          },
          maxResults: {
            type: 'number',
            description: 'Maximálny počet výsledkov (default 5, max 10)'
          }
        },
        required: ['query']
      }
    }
  }
];

// Spracovanie function calls
async function handleFunctionCall(functionName, args) {
  console.log(`🔧 AI volá funkciu: ${functionName}`, args);
  
  switch (functionName) {
    case 'get_calendar_events_by_name':
      // ONE-SHOT funkcia - nájde kalendár a vypíše udalosti
      const calendarsData = await getCalendars();
      if (!calendarsData.ok || !calendarsData.calendars) {
        return { error: 'Nepodarilo sa načítať kalendáre' };
      }
      
      // Nájdi kalendár podľa názvu
      const searchTerm = args.calendarName.toLowerCase();
      const foundCalendar = calendarsData.calendars.find(cal => 
        cal.name.toLowerCase().includes(searchTerm) ||
        cal.summary?.toLowerCase().includes(searchTerm)
      );
      
      if (!foundCalendar) {
        return { 
          error: `Nenašiel som kalendár s názvom "${args.calendarName}"`, 
          availableCalendars: calendarsData.calendars.map(c => c.name)
        };
      }
      
      // Načítaj udalosti z nájdeného kalendára
      const eventsData = await listCalendarEvents(args.maxResults || 50, foundCalendar.id);
      
      return {
        ok: true,
        calendar: {
          id: foundCalendar.id,
          name: foundCalendar.name
        },
        events: eventsData.events || [],
        count: eventsData.count || 0
      };
    
    case 'add_event_by_calendar_name':
      // ONE-SHOT funkcia - nájde kalendár a pridá udalosť
      console.log('🔧 add_event_by_calendar_name:', args);
      
      const calendarsForAdd = await getCalendars();
      if (!calendarsForAdd.ok || !calendarsForAdd.calendars) {
        return { error: 'Nepodarilo sa načítať kalendáre' };
      }
      
      // Nájdi kalendár podľa názvu
      const searchTermAdd = args.calendarName.toLowerCase();
      const foundCalendarAdd = calendarsForAdd.calendars.find(cal => 
        cal.name.toLowerCase().includes(searchTermAdd) ||
        cal.summary?.toLowerCase().includes(searchTermAdd)
      );
      
      if (!foundCalendarAdd) {
        return { 
          error: `Nenašiel som kalendár s názvom "${args.calendarName}"`, 
          availableCalendars: calendarsForAdd.calendars.map(c => c.name)
        };
      }
      
      // Pridaj udalosť do nájdeného kalendára
      const addResult = await addCalendarEvent(
        args.summary,
        args.description || '',
        args.startTime,
        args.endTime,
        args.location || '',
        foundCalendarAdd.id
      );
      
      return {
        ok: addResult.ok || false,
        message: addResult.ok ? `✅ Udalosť "${args.summary}" pridaná do kalendára ${foundCalendarAdd.name}` : 'Chyba pri pridávaní udalosti',
        calendar: foundCalendarAdd.name,
        event: addResult
      };
      
    case 'list_events':
      return await listCalendarEvents(args.maxResults || 10, args.calendarId || null);
    case 'list_calendars':
      return await getCalendars();
    case 'add_event':
      return await addCalendarEvent(
        args.summary,
        args.description,
        args.startTime,
        args.endTime,
        args.location,
        args.calendarId
      );
    case 'sync_calendars_from_sheet':
      return await syncCalendarsFromSheet();
    case 'get_sheet_employees':
      return await getSheetData();
    case 'get_weather':
      return await getWeather(args.days || 7);
    case 'get_weather_for_date':
      return await getWeatherForDate(args.date);
    case 'web_search':
      return await webSearch(args.query, args.maxResults || 5);
    default:
      return { error: 'Neznáma funkcia' };
  }
}

async function getCalendars() {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'getCalendars');
  
  const response = await fetch(url.toString());
  return await response.json();
}

// Mapa konverzácií pre každého používateľa (session)
const conversations = new Map();

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Získaj alebo vytvor konverzáciu
    let messages = conversations.get(sessionId) || [
      {
        role: 'system',
        content: `Si asistent pre správu Google Kalendára, počasia a vyhľadávania informácií. Pomáhaš používateľovi:
- Zobraziť udalosti z kalendára  
- Pridávať nové udalosti
- Vytvárať kalendáre pre zamestnancov z Google Sheets tabuľky
- Odpovedať na otázky o kalendári
- 🌤️ Poskytovať informácie o počasí pre Bratislavu
- 🔍 Vyhľadávať informácie na internete

**🎯 HLAVNÉ PRAVIDLO - ONE-SHOT funkcie:**

**Vypísanie udalostí:**
Keď používateľ pýta "vypiš udalosti na tlačiar" / "udalosti pre grafika":
✅ **POUŽI:** get_calendar_events_by_name({calendarName: "tlačiar"})
❌ **NEPOUŽIVAJ:** list_calendars() → list_events()

**Pridávanie udalostí:**
Keď používateľ povie "pridaj udalosť na lepiča" / "polep auta pre grafika":
✅ **POUŽI:** add_event_by_calendar_name({calendarName: "lepič", summary: "...", startTime: "...", endTime: "...", location: "..."})
❌ **NEPOUŽIVAJ:** list_calendars() → add_event()

**🌤️ Počasie:**
Keď používateľ pýta "aké bude počasie", "bude pršať", "môžem montovať":
✅ **POUŽI:** get_weather() alebo get_weather_for_date({date: "monday"})
- Ak pýta na konkrétny deň → get_weather_for_date
- Ak pýta všeobecne → get_weather
- Vždy spomeň odporúčanie pre montáž (suitable_for_installation)

**🔍 Web Search:**
Keď používateľ pýta "ako...", "najlepšie praktiky...", "návod na...", "poraď mi...":
✅ **POUŽI:** web_search({query: "best practices car wrap installation"})
- Pre technické otázky o inštaláciách, postupoch, návodoch
- Pre rady a best practices (napr. "aká teplota pre lepenie polepov")
- Pre aktuálne informácie (nové techniky, materiály)
- Odpoveď MUSÍ zahŕňať zdroj (URL)

**🕐 Spracovanie času:**
- Ak používateľ povie "1,2 hodiny", vypočítaj: startTime = dnes alebo zadaný dátum, endTime = startTime + 1.2h
- Formát: ISO 8601 s timezone (napr. 2025-10-26T10:00:00+02:00)
- Ak nie je uvedený čas, **opýtaj sa!**

**🤔 KEĎ SI NEISTÝ:**
- Chýba čas alebo dátum? → **Opýtaj sa!**
- Nevieš, ktorý kalendár? → **Opýtaj sa!**
- **NIKDY nevymýšľaj údaje!**

**Mapovanie názvov:** "tlačiar"→Z07, "grafik"→Z05, "obchodník"→Z06, "CEO"→Z01/Z02/Z03, "lepič"→Z12, "monter"→Z14

**Formátovanie:**
- Názov kalendára vždy uvedz
- Odrážky a emojis
- Slovenský formát dátumu
- Čas je už v správnej timezone
- Pri web search vždy uveď zdroj (🔗 URL)

Komunikuj v slovenčine priateľsky.
Dnešný dátum je ${new Date().toLocaleDateString('sk-SK')}.`
      }
    ];

    messages.push({
      role: 'user',
      content: message
    });

    // Volaj ChatGPT
    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      tools: tools,
      tool_choice: 'auto'
    });

    let responseMessage = response.choices[0].message;
    const functionCalls = [];

    // Ak ChatGPT chce zavolať funkciu
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

      // Získaj finálnu odpoveď
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
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

// Reset konverzácie
app.post('/api/reset', (req, res) => {
  const { sessionId } = req.body;
  conversations.delete(sessionId);
  res.json({ success: true });
});

// Priame volanie kalendára (pre zobrazenie)
app.get('/api/events', async (req, res) => {
  try {
    const data = await listCalendarEvents(20);
    console.log('Calendar response:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    openai: !!process.env.OPENAI_API_KEY,
    calendar: !!process.env.GOOGLE_SCRIPT_URL
  });
});

// Vytvorenie zákazky s automatickým pridelením úloh
app.post('/api/create-order', async (req, res) => {
  try {
    const { name, deadline, tasks } = req.body;
    
    if (!name || !deadline || !tasks || tasks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýbajúce povinné údaje' 
      });
    }
    
    // Načítaj zoznam kalendárov
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.append('action', 'getCalendars');
    
    const calendarsResponse = await fetch(url.toString());
    const calendarsData = await calendarsResponse.json();
    
    if (!calendarsData.ok) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nepodarilo sa načítať kalendáre' 
      });
    }
    
    const calendars = calendarsData.calendars;
    const createdEvents = [];
    const errors = [];
    
    // Pre každú úlohu
    let currentTime = new Date(deadline);
    
    for (const task of tasks.reverse()) {
      // Nájdi zamestnanca s danou pozíciou
      const employeeCalendar = calendars.find(cal => 
        cal.name.toLowerCase().includes(task.position.toLowerCase())
      );
      
      if (!employeeCalendar) {
        errors.push(`Nenašiel sa zamestnanec pre pozíciu: ${task.position}`);
        continue;
      }
      
      // Vypočítaj čas úlohy (spätne od deadline)
      const taskDuration = task.duration * 60 * 60 * 1000; // hodiny na milisekundy
      const taskStart = new Date(currentTime.getTime() - taskDuration);
      
      // Vytvor udalosť v kalendári
      try {
        const eventData = {
          calendarId: employeeCalendar.id,
          summary: `${name} - ${task.label}`,
          description: `Zákazka: ${name}\\nÚloha: ${task.label}\\nTrvanie: ${task.duration}h`,
          start: { dateTime: taskStart.toISOString() },
          end: { dateTime: currentTime.toISOString() },
          location: 'Výroba'
        };
        
        const eventResponse = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
        
        const eventResult = await eventResponse.json();
        
        if (eventResult.ok) {
          createdEvents.push({
            employee: employeeCalendar.name,
            task: task.label,
            start: taskStart,
            end: currentTime
          });
        } else {
          errors.push(`Chyba pri vytváraní úlohy ${task.label}: ${eventResult.error}`);
        }
      } catch (error) {
        errors.push(`Chyba pri vytváraní úlohy ${task.label}: ${error.message}`);
      }
      
      // Posun čas pre ďalšiu úlohu
      currentTime = taskStart;
    }
    
    // Zostaň odpoveď
    let message = `Vytvorené ${createdEvents.length} úloh:\\n\\n`;
    createdEvents.reverse().forEach(ev => {
      const start = new Date(ev.start);
      const end = new Date(ev.end);
      message += `• ${ev.task}\\n  👤 ${ev.employee}\\n  ⏰ ${start.toLocaleString('sk-SK')} - ${end.toLocaleString('sk-SK')}\\n\\n`;
    });
    
    if (errors.length > 0) {
      message += `\\n⚠️ Chyby:\\n${errors.join('\\n')}`;
    }
    
    res.json({
      success: true,
      message: message,
      created: createdEvents.length,
      errors: errors.length
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Vytvorenie zákazky s výberom kalendárov (advanced)
app.post('/api/create-order-advanced', async (req, res) => {
  try {
    const { name, deadline, tasks } = req.body;
    
    if (!name || !deadline || !tasks || tasks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýbajúce povinné údaje' 
      });
    }
    
    const createdEvents = [];
    const errors = [];
    
    // Vypočítaj celkové trvanie všetkých procesov
    const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
    
    // Termín dokončenia posledného procesu
    const finalDeadline = new Date(deadline);
    
    // Vypočítaj začiatok prvého procesu (deadline - celková dĺžka)
    const totalDurationMs = totalDuration * 60 * 60 * 1000;
    const firstProcessStart = new Date(finalDeadline.getTime() - totalDurationMs);
    
    // Plánuj procesy sekvenčne (každý začína hneď po predošlom)
    let currentTime = firstProcessStart;
    
    for (const task of tasks) {
      try {
        const taskDuration = task.duration * 60 * 60 * 1000; // hodiny na milisekundy
        const taskEnd = new Date(currentTime.getTime() + taskDuration);
        
        // Vytvor udalosť
        const eventData = {
          calendarId: task.calendarId,
          summary: `${name} - ${task.description}`,
          description: `📦 Zákazka: ${name}\\n📝 Proces: ${task.description}\\n⏱️ Trvanie: ${task.duration}h\\n👤 Pridelené: ${task.calendarName}\\n\\n⚠️ Tento proces musí byť dokončený pred začatím ďalšieho procesu!`,
          start: { dateTime: currentTime.toISOString() },
          end: { dateTime: taskEnd.toISOString() },
          location: 'Výroba'
        };
        
        const eventResponse = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
        
        const eventResult = await eventResponse.json();
        
        if (eventResult.ok) {
          createdEvents.push({
            calendar: task.calendarName,
            process: task.description,
            start: currentTime,
            end: taskEnd,
            duration: task.duration
          });
        } else {
          errors.push(`Chyba pri vytváraní "${task.description}": ${eventResult.error}`);
        }
      } catch (error) {
        errors.push(`Chyba pri vytváraní "${task.description}": ${error.message}`);
      }
      
      // Posun čas pre ďalší proces (začína hneď po skončení tohto)
      currentTime = new Date(currentTime.getTime() + task.duration * 60 * 60 * 1000);
    }
    
    // Zostav odpoveď
    let message = `Zákazka "${name}" bola vytvorená!\\n\\n`;
    message += `⏰ Začiatok výroby: ${firstProcessStart.toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' })}\\n`;
    message += `🏁 Dokončenie: ${finalDeadline.toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' })}\\n`;
    message += `⏱️ Celková dĺžka: ${totalDuration}h\\n\\n`;
    message += `📊 ${createdEvents.length} procesov (sekvenčne - na seba nadväzujúce):\\n\\n`;
    
    createdEvents.forEach((ev, idx) => {
      const start = new Date(ev.start);
      const end = new Date(ev.end);
      message += `${idx + 1}. ${ev.process}\\n`;
      message += `   👤 ${ev.calendar}\\n`;
      message += `   🕐 ${start.toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' })} → ${end.toLocaleString('sk-SK', { timeStyle: 'short' })}\\n`;
      message += `   ⏱️ ${ev.duration}h\\n`;
      if (idx < createdEvents.length - 1) {
        message += `   ⬇️ Musí byť hotové pred začatím ďalšieho procesu\\n`;
      }
      message += `\\n`;
    });
    
    if (errors.length > 0) {
      message += `\\n⚠️ Chyby (${errors.length}):\\n${errors.join('\\n')}`;
    }
    
    res.json({
      success: true,
      message: message,
      created: createdEvents.length,
      errors: errors.length,
      timeline: {
        start: firstProcessStart,
        end: finalDeadline,
        totalHours: totalDuration
      }
    });
    
  } catch (error) {
    console.error('Create order advanced error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// AI Optimalizátor rozvrhu - použije OpenAI na inteligentné plánovanie
app.post('/api/optimize-schedule', async (req, res) => {
  try {
    const { tasks, deadline, workingHours = { start: 8, end: 17 } } = req.body;
    
    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Žiadne procesy na optimalizáciu' 
      });
    }
    
    // Načítaj všetky kalendáre
    const calendarsUrl = new URL(GOOGLE_SCRIPT_URL);
    calendarsUrl.searchParams.append('action', 'getCalendars');
    const calendarsResponse = await fetch(calendarsUrl.toString());
    const calendarsData = await calendarsResponse.json();
    
    if (!calendarsData.ok) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nepodarilo sa načítať kalendáre' 
      });
    }
    
    // Načítaj existujúce udalosti z všetkých kalendárov
    const eventsUrl = new URL(GOOGLE_SCRIPT_URL);
    eventsUrl.searchParams.append('action', 'getEvents');
    eventsUrl.searchParams.append('allCalendars', 'true');
    eventsUrl.searchParams.append('maxResults', '200');
    eventsUrl.searchParams.append('daysAhead', '30');
    
    const eventsResponse = await fetch(eventsUrl.toString());
    const eventsData = await eventsResponse.json();
    
    const existingEvents = eventsData.ok ? eventsData.events : [];
    
    // Priprav dáta pre AI
    const now = new Date();
    const finalDeadline = deadline ? new Date(deadline) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Zoznam voľných slotov pre každý kalendár
    const availabilityByCalendar = {};
    
    for (const task of tasks) {
      const calendarEvents = existingEvents.filter(e => e.calendarId === task.calendarId);
      
      // Vytvor zoznam obsadených časov
      const busySlots = calendarEvents.map(e => ({
        start: e.start.dateTime,
        end: e.end.dateTime,
        title: e.summary || e.title
      }));
      
      availabilityByCalendar[task.calendarId] = {
        calendarName: task.calendarName,
        busySlots: busySlots
      };
    }
    
    // Pýtaj AI na optimálny plán
    const aiPrompt = `Si expert na plánovanie výroby. Máš nasledujúce procesy, ktoré treba naplánovať:

**PROCESY:**
${tasks.map((t, idx) => `${idx + 1}. ${t.description} (${t.duration}h) - pridelené: ${t.calendarName} (ID: ${t.calendarId})`).join('\n')}

**TERMÍN DOKONČENIA:** ${finalDeadline.toLocaleString('sk-SK')}
**PRACOVNÉ HODINY:** ${workingHours.start}:00 - ${workingHours.end}:00 (Po-Pia)
**AKTUÁLNY ČAS:** ${now.toLocaleString('sk-SK')}

**OBSADENOSŤ KALENDÁROV:**
${Object.entries(availabilityByCalendar).map(([id, data]) => 
  `\n${data.calendarName}:\n${data.busySlots.length > 0 ? data.busySlots.map(s => `  - ${new Date(s.start).toLocaleString('sk-SK')} - ${new Date(s.end).toLocaleString('sk-SK')}: ${s.title}`).join('\n') : '  (žiadne udalosti)'}`
).join('\n')}

**ÚLOHA:**
1. Analyzuj závislosti medzi procesmi (napr. "grafika" musí byť pred "tlač", "tlač" pred "lepenie")
2. Nájdi optimálne časy pre každý proces
3. Vyhni sa kolíziám s existujúcimi udalosťami
4. Minimalizuj čakacie časy
5. Dodržuj pracovné hodiny a preskakuj víkendy
6. Označ ktoré procesy môžu bežať paralelne (rôzne kalendáre)

**ODPOVEĎ (JSON):**
{
  "reasoning": "Tvoje zdôvodnenie postupnosti a časovania",
  "schedule": [
    {
      "processIndex": 0,
      "calendarId": "...",
      "suggestedStart": "2025-10-20T08:00:00",
      "suggestedEnd": "2025-10-20T12:00:00",
      "dependsOn": null,
      "canRunParallel": false,
      "reasoning": "Prečo práve tento čas"
    }
  ],
  "warnings": ["Možné problémy alebo odporúčania"]
}`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Si expert na výrobné plánovanie. Analyzuješ závislosti medzi procesmi a navrhneš optimálny časový rozvrh. Odpovieš iba validným JSON.'
        },
        {
          role: 'user',
          content: aiPrompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const aiPlan = JSON.parse(aiResponse.choices[0].message.content);
    
    // Spracuj AI odpoveď
    const optimizedPlan = [];
    
    for (const scheduledItem of aiPlan.schedule) {
      const task = tasks[scheduledItem.processIndex];
      
      optimizedPlan.push({
        ...task,
        suggestedStart: scheduledItem.suggestedStart,
        suggestedEnd: scheduledItem.suggestedEnd,
        dependsOn: scheduledItem.dependsOn,
        canRunParallel: scheduledItem.canRunParallel,
        reasoning: scheduledItem.reasoning,
        alternatives: [] // AI zatiaľ neposkytuje alternatívy
      });
    }
    
    // Vypočítaj štatistiky
    const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0);
    const plannedStart = optimizedPlan[0]?.suggestedStart;
    const plannedEnd = optimizedPlan[optimizedPlan.length - 1]?.suggestedEnd;
    
    res.json({
      success: true,
      plan: optimizedPlan,
      aiReasoning: aiPlan.reasoning,
      warnings: aiPlan.warnings || [],
      stats: {
        totalProcesses: tasks.length,
        totalHours: totalDuration,
        plannedStart: plannedStart,
        plannedEnd: plannedEnd,
        workingHours: workingHours
      },
      message: `🤖 AI optimalizovala ${tasks.length} procesov. ${aiPlan.reasoning}`
    });
    
  } catch (error) {
    console.error('AI Optimize schedule error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint pre vytvorenie udalosti (obchádza CORS)
app.post('/api/create-event', async (req, res) => {
  try {
    const { calendarId, summary, description, start, end, location } = req.body;
    
    const url = new URL(GOOGLE_SCRIPT_URL);
    if (calendarId) {
      url.searchParams.append('calendarId', calendarId);
    }
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary,
        description,
        start,
        end,
        location
      })
    });
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Delete event endpoint
app.post('/api/delete-event', async (req, res) => {
  try {
    const { eventId, calendarId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({
        ok: false,
        error: 'eventId is required'
      });
    }
    
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.append('action', 'deleteEvent');
    url.searchParams.append('eventId', eventId);
    if (calendarId) {
      url.searchParams.append('calendarId', calendarId);
    }
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    res.json(data);
    
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { days = 7, lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
    let location = process.env.WEATHER_LOCATION || 'Bratislava,SK';
    
    // Check if API key is set
    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        error: 'WEATHER_API_KEY nie je nastavený v .env súbore. Zaregistrujte sa na https://openweathermap.org/api'
      });
    }
    
    // If lat/lon provided, use coordinates instead of city name
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
      suitable_for_installation: !['rain', 'drizzle', 'thunderstorm', 'snow'].includes(currentData.weather[0].main.toLowerCase()) && currentData.main.temp > 0 && (currentData.wind?.speed || 0) < 10
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
          suitable_for_installation: !['rain', 'drizzle', 'thunderstorm', 'snow'].includes(item.weather[0].main.toLowerCase()) && item.main.temp > 0 && (item.wind?.speed || 0) < 10
        });
        processedDates.add(dateKey);
        
        if (forecast.length >= parseInt(days)) break;
      }
    }
    
    res.json({
      ok: true,
      location: currentData.name || `${lat}, ${lon}`,
      current,
      forecast
    });
    
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Geolocation endpoint (get location from IP)
app.get('/api/geolocation', async (req, res) => {
  try {
    // Use ipapi.co for free IP geolocation
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // For localhost, use default location
    if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.includes('::ffff:127.0.0.1')) {
      return res.json({
        ok: true,
        city: 'Bratislava',
        country: 'SK',
        latitude: 48.1486,
        longitude: 17.1077,
        source: 'default'
      });
    }
    
    // Call ipapi.co
    const response = await fetch(`https://ipapi.co/${clientIp}/json/`);
    const data = await response.json();
    
    if (data.city && data.latitude && data.longitude) {
      res.json({
        ok: true,
        city: data.city,
        country: data.country_code,
        latitude: data.latitude,
        longitude: data.longitude,
        source: 'ip'
      });
    } else {
      // Fallback to default
      res.json({
        ok: true,
        city: 'Bratislava',
        country: 'SK',
        latitude: 48.1486,
        longitude: 17.1077,
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('Geolocation error:', error);
    // Return default location on error
    res.json({
      ok: true,
      city: 'Bratislava',
      country: 'SK',
      latitude: 48.1486,
      longitude: 17.1077,
      source: 'error-fallback'
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🌐 Web Server beží na http://localhost:${PORT}`);
  console.log(`📅 Kalendár: ${GOOGLE_SCRIPT_URL ? '✅' : '❌'}`);
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}\n`);
});

