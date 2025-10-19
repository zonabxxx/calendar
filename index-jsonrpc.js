import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxjYJ1UlHZfzlQdVgesiRnSNHp2OKxZR9NedxVbWHq_ar7TzbjYc1Uq3b1blAtso4-NRg/exec';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// Handle OPTIONS preflight
app.options('*', cors());

const MCP_SERVER_INFO = {
  name: 'google-calendar-mcp',
  version: '1.0.0',
  protocolVersion: '2024-11-05',
  capabilities: {
    tools: {}
  }
};

const TOOLS = [
  {
    name: 'list_events',
    description: '📅 Zobrazí zoznam udalostí z kalendára. Použite keď chce používateľ vidieť/zobraziť/vypísať udalosti.',
    inputSchema: {
      type: 'object',
      properties: {
        output_text: { 
          type: 'string', 
          description: 'Požiadavka na udalosti' 
        }
      },
      required: []
    }
  },
  {
    name: 'add_event',
    description: '➕ Pridá novú udalosť do kalendára. Použite VÝHRADNE keď chce používateľ vytvoriť/pridať/naplánovať NOVÚ udalosť.',
    inputSchema: {
      type: 'object',
      properties: {
        output_text: { 
          type: 'string', 
          description: 'Popis novej udalosti' 
        }
      },
      required: []
    }
  },
  {
    name: 'modify_event',
    description: '✏️ Upraví existujúcu udalosť. Potrebujete eventId.',
    inputSchema: {
      type: 'object',
      properties: {
        output_text: { 
          type: 'string', 
          description: 'ID udalosti a zmeny' 
        }
      },
      required: []
    }
  },
  {
    name: 'remove_event',
    description: '🗑️ Zmaže udalosť. Potrebujete eventId.',
    inputSchema: {
      type: 'object',
      properties: {
        output_text: { 
          type: 'string', 
          description: 'ID udalosti' 
        }
      },
      required: []
    }
  }
];

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Google Calendar MCP Server',
    ...MCP_SERVER_INFO
  });
});

// MCP JSON-RPC endpoint
app.post('/', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  if (jsonrpc !== '2.0') {
    return res.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32600, message: 'Invalid Request' }
    });
  }

  try {
    let result;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: MCP_SERVER_INFO.protocolVersion,
          serverInfo: {
            name: MCP_SERVER_INFO.name,
            version: MCP_SERVER_INFO.version
          },
          capabilities: MCP_SERVER_INFO.capabilities
        };
        break;

      case 'tools/list':
        result = { tools: TOOLS };
        break;

      case 'tools/call':
        const { name, arguments: args } = params;
        if (name === 'add_event') {
          const gcalResult = await createGoogleCalendarEvent(args);
          result = {
            content: [{ type: 'text', text: JSON.stringify(gcalResult, null, 2) }]
          };
        } else if (name === 'list_events') {
          const events = await getGoogleCalendarEvents(args);
          result = {
            content: [{ type: 'text', text: JSON.stringify(events, null, 2) }]
          };
        } else if (name === 'modify_event') {
          const updateResult = await updateGoogleCalendarEvent(args);
          result = {
            content: [{ type: 'text', text: JSON.stringify(updateResult, null, 2) }]
          };
        } else if (name === 'remove_event') {
          const deleteResult = await deleteGoogleCalendarEvent(args);
          result = {
            content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }]
          };
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    res.json({ jsonrpc: '2.0', id, result });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: error.message }
    });
  }
});

async function createGoogleCalendarEvent(params) {
  // Ak máme output_text, použijeme default hodnoty
  let summary, description, startTime, endTime, location;
  
  if (params.output_text) {
    // Parsujeme output_text alebo použijeme default
    summary = params.summary || params.output_text.substring(0, 100) || 'Nová udalosť';
    description = params.description || params.output_text || '';
    
    // Default časy (o hodinu od teraz)
    const now = new Date();
    startTime = params.startTime || new Date(now.getTime() + 60*60*1000).toISOString();
    endTime = params.endTime || new Date(now.getTime() + 2*60*60*1000).toISOString();
    location = params.location || '';
  } else {
    summary = params.summary || 'Nová udalosť';
    description = params.description || '';
    startTime = params.startTime || new Date().toISOString();
    endTime = params.endTime || new Date(Date.now() + 60*60*1000).toISOString();
    location = params.location || '';
  }

  const body = {
    calendarId: 'primary',
    summary: summary,
    description: description,
    location: location,
    start: { dateTime: startTime },
    end: { dateTime: endTime },
    sendInvites: true
  };

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return await response.json();
}

async function getGoogleCalendarEvents(params) {
  try {
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.append('action', 'getEvents');
    url.searchParams.append('maxResults', params.maxResults || '10');
    url.searchParams.append('daysAhead', params.daysAhead || '30');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Chyba pri načítavaní udalostí z Google Calendar'
    };
  }
}

async function updateGoogleCalendarEvent(params) {
  try {
    // Parsujeme output_text na získanie eventId a zmien
    // Pre teraz použijeme placeholder - v budúcnosti môžeme pridať AI parsing
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.append('action', 'updateEvent');
    
    // Defaultné hodnoty ak nemáme konkrétne dáta
    url.searchParams.append('eventId', params.eventId || 'unknown');
    if (params.summary) url.searchParams.append('summary', params.summary);
    if (params.description) url.searchParams.append('description', params.description);
    if (params.startTime) url.searchParams.append('startTime', params.startTime);
    if (params.endTime) url.searchParams.append('endTime', params.endTime);
    if (params.location) url.searchParams.append('location', params.location);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Chyba pri aktualizácii udalosti. Potrebujete poskytnúť eventId.'
    };
  }
}

async function deleteGoogleCalendarEvent(params) {
  try {
    // Parsujeme output_text na získanie eventId
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.append('action', 'deleteEvent');
    url.searchParams.append('eventId', params.eventId || params.output_text || 'unknown');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Chyba pri mazaní udalosti. Potrebujete poskytnúť eventId.'
    };
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Google Calendar MCP Server running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📅 Connected to Google Apps Script`);
});

