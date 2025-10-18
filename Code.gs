// 📅 Google Calendar MCP Bridge - Google Apps Script
// Tento kód musí byť nasadený v Google Apps Script

function doGet(e) {
  const action = e.parameter.action;
  
  // Ak nie je action, vráťme základné info
  if (!action) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Google Calendar MCP Bridge is running',
      version: '1.0.0',
      availableActions: ['getEvents', 'createEvent', 'updateEvent', 'deleteEvent'],
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    let result;
    
    switch(action) {
      case 'getEvents':
        result = getEvents(e.parameter);
        break;
      case 'createEvent':
        result = createEvent(e.parameter);
        break;
      case 'updateEvent':
        result = updateEvent(e.parameter);
        break;
      case 'deleteEvent':
        result = deleteEvent(e.parameter);
        break;
      default:
        result = {
          error: 'Unknown action: ' + action,
          availableActions: ['getEvents', 'createEvent', 'updateEvent', 'deleteEvent']
        };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      message: error.message,
      stack: error.stack,
      action: action
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getEvents(params) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    
    // Nastavenie časového rozsahu
    const now = new Date();
    const daysAhead = params.daysAhead ? parseInt(params.daysAhead) : 30;
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    // Ak sú zadané timeMin a timeMax, použijeme ich
    const startTime = params.timeMin ? new Date(params.timeMin) : now;
    const endTime = params.timeMax ? new Date(params.timeMax) : endDate;
    
    // Získanie udalostí
    const events = calendar.getEvents(startTime, endTime);
    const maxResults = parseInt(params.maxResults) || 10;
    
    // Formátovanie udalostí
    const eventList = events.slice(0, maxResults).map(event => {
      return {
        id: event.getId(),
        summary: event.getTitle(),
        description: event.getDescription() || '',
        location: event.getLocation() || '',
        start: {
          dateTime: event.getStartTime().toISOString(),
          timeZone: calendar.getTimeZone()
        },
        end: {
          dateTime: event.getEndTime().toISOString(),
          timeZone: calendar.getTimeZone()
        },
        created: event.getDateCreated().toISOString(),
        creator: {
          email: calendar.getId()
        }
      };
    });
    
    return {
      success: true,
      events: eventList,
      count: eventList.length,
      totalFound: events.length,
      calendarName: calendar.getName(),
      calendarId: calendar.getId()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Chyba pri získavaní udalostí'
    };
  }
}

function createEvent(params) {
  try {
    // Validácia povinných parametrov
    if (!params.summary) {
      return {
        success: false,
        error: 'Missing required parameter: summary'
      };
    }
    
    if (!params.startTime || !params.endTime) {
      return {
        success: false,
        error: 'Missing required parameters: startTime and endTime'
      };
    }
    
    const calendar = CalendarApp.getDefaultCalendar();
    
    // Vytvorenie udalosti
    const event = calendar.createEvent(
      params.summary,
      new Date(params.startTime),
      new Date(params.endTime),
      {
        description: params.description || '',
        location: params.location || ''
      }
    );
    
    return {
      success: true,
      message: 'Udalosť bola úspešne vytvorená',
      event: {
        id: event.getId(),
        summary: event.getTitle(),
        description: event.getDescription(),
        location: event.getLocation(),
        start: event.getStartTime().toISOString(),
        end: event.getEndTime().toISOString()
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Chyba pri vytváraní udalosti'
    };
  }
}

function updateEvent(params) {
  try {
    if (!params.eventId) {
      return {
        success: false,
        error: 'Missing required parameter: eventId'
      };
    }
    
    const calendar = CalendarApp.getDefaultCalendar();
    const event = calendar.getEventById(params.eventId);
    
    if (!event) {
      return {
        success: false,
        error: 'Event not found',
        eventId: params.eventId
      };
    }
    
    // Aktualizácia len zadaných polí
    if (params.summary) {
      event.setTitle(params.summary);
    }
    
    if (params.description !== undefined) {
      event.setDescription(params.description);
    }
    
    if (params.location !== undefined) {
      event.setLocation(params.location);
    }
    
    if (params.startTime && params.endTime) {
      event.setTime(new Date(params.startTime), new Date(params.endTime));
    }
    
    return {
      success: true,
      message: 'Udalosť bola úspešne aktualizovaná',
      event: {
        id: event.getId(),
        summary: event.getTitle(),
        description: event.getDescription(),
        location: event.getLocation(),
        start: event.getStartTime().toISOString(),
        end: event.getEndTime().toISOString()
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Chyba pri aktualizácii udalosti'
    };
  }
}

function deleteEvent(params) {
  try {
    if (!params.eventId) {
      return {
        success: false,
        error: 'Missing required parameter: eventId'
      };
    }
    
    const calendar = CalendarApp.getDefaultCalendar();
    const event = calendar.getEventById(params.eventId);
    
    if (!event) {
      return {
        success: false,
        error: 'Event not found',
        eventId: params.eventId
      };
    }
    
    const eventTitle = event.getTitle();
    event.deleteEvent();
    
    return {
      success: true,
      message: 'Udalosť "' + eventTitle + '" bola úspešne zmazaná',
      eventId: params.eventId
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Chyba pri mazaní udalosti'
    };
  }
}

// Test funkcia - môžete ju spustiť manuálne v editore
function testGetEvents() {
  const result = getEvents({ maxResults: 5 });
  Logger.log(JSON.stringify(result, null, 2));
}

