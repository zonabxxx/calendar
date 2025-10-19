import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4EKi35D4Tuor0YZbtHR4y5vyeNraE8brX1iFlgCtgwffwn-VDtHzsY_WEJwd85fmgIQ/exec';

// Middleware
app.use(cors());
app.use(express.json());

// Optional simple API key check (for ChatGPT Kit)
const API_KEY = process.env.API_KEY || 'calendar-mcp-2025';
app.use((req, res, next) => {
  // Skip auth for health check
  if (req.path === '/') {
    return next();
  }
  
  // Check for API key in header or query
  const providedKey = req.headers['authorization']?.replace('Bearer ', '') || 
                      req.query.api_key;
  
  // Allow requests without key (for compatibility)
  if (!providedKey || providedKey === API_KEY) {
    return next();
  }
  
  res.status(401).json({ error: 'Invalid API key' });
});

// MCP Server Info
const MCP_SERVER_INFO = {
  name: 'google-calendar-mcp',
  version: '1.0.0',
  description: 'MCP Server for Google Calendar access',
  capabilities: {
    tools: true,
    resources: false,
    prompts: false
  }
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Google Calendar MCP Server is running',
    server: MCP_SERVER_INFO
  });
});

// MCP SSE endpoint for real-time communication
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial message
  res.write(`data: ${JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {
      protocolVersion: '2024-11-05',
      serverInfo: MCP_SERVER_INFO,
      capabilities: MCP_SERVER_INFO.capabilities
    }
  })}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    res.end();
  });
});

// MCP Protocol endpoint - Initialize
app.post('/mcp/initialize', (req, res) => {
  res.json({
    protocolVersion: '2024-11-05',
    serverInfo: MCP_SERVER_INFO,
    capabilities: MCP_SERVER_INFO.capabilities
  });
});

// MCP Protocol endpoint - List tools
app.post('/mcp/tools/list', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_calendar_events',
        description: 'Získať udalosti z Google Kalendára',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: {
              type: 'string',
              description: 'ID kalendára (default: primary)',
              default: 'primary'
            },
            timeMin: {
              type: 'string',
              description: 'Minimálny čas (ISO 8601 formát)'
            },
            timeMax: {
              type: 'string',
              description: 'Maximálny čas (ISO 8601 formát)'
            },
            maxResults: {
              type: 'number',
              description: 'Maximálny počet výsledkov',
              default: 10
            }
          }
        }
      },
      {
        name: 'create_calendar_event',
        description: 'Vytvoriť novú udalosť v Google Kalendári',
        inputSchema: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'Názov udalosti',
              required: true
            },
            description: {
              type: 'string',
              description: 'Popis udalosti'
            },
            startTime: {
              type: 'string',
              description: 'Čas začiatku (ISO 8601 formát)',
              required: true
            },
            endTime: {
              type: 'string',
              description: 'Čas konca (ISO 8601 formát)',
              required: true
            },
            calendarId: {
              type: 'string',
              description: 'ID kalendára (default: primary)',
              default: 'primary'
            }
          },
          required: ['summary', 'startTime', 'endTime']
        }
      },
      {
        name: 'update_calendar_event',
        description: 'Aktualizovať existujúcu udalosť',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'ID udalosti',
              required: true
            },
            summary: {
              type: 'string',
              description: 'Nový názov udalosti'
            },
            description: {
              type: 'string',
              description: 'Nový popis udalosti'
            },
            startTime: {
              type: 'string',
              description: 'Nový čas začiatku (ISO 8601 formát)'
            },
            endTime: {
              type: 'string',
              description: 'Nový čas konca (ISO 8601 formát)'
            },
            calendarId: {
              type: 'string',
              description: 'ID kalendára (default: primary)',
              default: 'primary'
            }
          },
          required: ['eventId']
        }
      },
      {
        name: 'delete_calendar_event',
        description: 'Zmazať udalosť z kalendára',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'ID udalosti',
              required: true
            },
            calendarId: {
              type: 'string',
              description: 'ID kalendára (default: primary)',
              default: 'primary'
            }
          },
          required: ['eventId']
        }
      }
    ]
  });
});

// MCP Protocol endpoint - Call tool
app.post('/mcp/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body;

  try {
    let result;

    switch (name) {
      case 'get_calendar_events':
        result = await callGoogleScript('getEvents', args);
        break;
      
      case 'create_calendar_event':
        result = await callGoogleScript('createEvent', args);
        break;
      
      case 'update_calendar_event':
        result = await callGoogleScript('updateEvent', args);
        break;
      
      case 'delete_calendar_event':
        result = await callGoogleScript('deleteEvent', args);
        break;
      
      default:
        return res.status(400).json({
          error: `Unknown tool: ${name}`
        });
    }

    res.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.toString()
    });
  }
});

// Helper function to call Google Apps Script
async function callGoogleScript(action, params) {
  let body;
  
  if (action === 'createEvent') {
    // Pre vytvorenie udalosti použijeme POST s JSON
    body = {
      calendarId: params.calendarId || 'primary',
      summary: params.summary,
      description: params.description || '',
      location: params.location || '',
      start: {},
      end: {},
      sendInvites: params.sendInvites !== false,
      conference: params.conference || false
    };
    
    // Parse start/end time
    if (params.startTime) {
      body.start.dateTime = params.startTime;
    }
    if (params.endTime) {
      body.end.dateTime = params.endTime;
    }
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
    
  } else {
    // Pre ostatné akcie (GET, UPDATE, DELETE) musíme použiť iný prístup
    // Zatiaľ vrátime chybu
    throw new Error(`Action "${action}" is not yet implemented in your Google Apps Script. Only "createEvent" works via POST.`);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Google Calendar MCP Server running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📅 Connected to Google Apps Script`);
});

