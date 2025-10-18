// Príklad Google Apps Script kódu pre kalendár
// Tento kód skopírujte do Google Apps Script editora

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'getEvents':
        return getEvents(e.parameter);
      case 'createEvent':
        return createEvent(e.parameter);
      case 'updateEvent':
        return updateEvent(e.parameter);
      case 'deleteEvent':
        return deleteEvent(e.parameter);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          status: 'ok',
          message: 'Google Calendar Apps Script API is running',
          availableActions: ['getEvents', 'createEvent', 'updateEvent', 'deleteEvent']
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      action: action
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getEvents(params) {
  const calendarId = params.calendarId || 'primary';
  const calendar = CalendarApp.getDefaultCalendar();
  
  const now = new Date();
  const daysAhead = 30;
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  // Ak sú zadané timeMin a timeMax, použijeme ich
  const startTime = params.timeMin ? new Date(params.timeMin) : now;
  const endTime = params.timeMax ? new Date(params.timeMax) : endDate;
  
  const events = calendar.getEvents(startTime, endTime);
  const maxResults = parseInt(params.maxResults) || 10;
  
  const eventList = events.slice(0, maxResults).map(event => ({
    id: event.getId(),
    summary: event.getTitle(),
    description: event.getDescription(),
    start: {
      dateTime: event.getStartTime().toISOString()
    },
    end: {
      dateTime: event.getEndTime().toISOString()
    },
    location: event.getLocation(),
    status: event.getEventType()
  }));
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    events: eventList,
    count: eventList.length
  })).setMimeType(ContentService.MimeType.JSON);
}

function createEvent(params) {
  if (!params.summary || !params.startTime || !params.endTime) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Missing required parameters: summary, startTime, endTime'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const calendar = CalendarApp.getDefaultCalendar();
  
  const event = calendar.createEvent(
    params.summary,
    new Date(params.startTime),
    new Date(params.endTime),
    {
      description: params.description || '',
      location: params.location || ''
    }
  );
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    eventId: event.getId(),
    event: {
      id: event.getId(),
      summary: event.getTitle(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString()
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateEvent(params) {
  if (!params.eventId) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Missing required parameter: eventId'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const calendar = CalendarApp.getDefaultCalendar();
  const event = calendar.getEventById(params.eventId);
  
  if (!event) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Event not found',
      eventId: params.eventId
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Aktualizuj len to, čo je zadané
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
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    eventId: event.getId(),
    event: {
      id: event.getId(),
      summary: event.getTitle(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString()
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

function deleteEvent(params) {
  if (!params.eventId) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Missing required parameter: eventId'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const calendar = CalendarApp.getDefaultCalendar();
  const event = calendar.getEventById(params.eventId);
  
  if (!event) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Event not found',
      eventId: params.eventId
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  event.deleteEvent();
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Event deleted successfully',
    eventId: params.eventId
  })).setMimeType(ContentService.MimeType.JSON);
}

