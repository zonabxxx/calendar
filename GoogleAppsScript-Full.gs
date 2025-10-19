/** 
 * Google Apps Script - Calendar Bridge
 * Podporuje CREATE a GET udalostí
 */

// TEST FUNKCIA - spustite túto pri testovaní v editore
function testGetEvents() {
  const result = getEvents({ maxResults: 5, daysAhead: 30 });
  Logger.log(result.getContent());
  return result;
}

function doGet(e) {
  // Bezpečná kontrola parametrov
  if (!e || !e.parameter) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ok',
        message: 'Google Calendar Bridge API',
        usage: 'Use GET with ?action=getEvents to read, or POST to create events'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = e.parameter.action;
  
  if (action === 'getEvents') {
    return getEvents(e.parameter);
  } else if (action === 'updateEvent') {
    return updateEvent(e.parameter);
  } else if (action === 'deleteEvent') {
    return deleteEvent(e.parameter);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Available actions: getEvents, updateEvent, deleteEvent',
      usage: '?action=getEvents or ?action=updateEvent&eventId=xxx or ?action=deleteEvent&eventId=xxx'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'Missing JSON body' });
    }

    const body = JSON.parse(e.postData.contents);
    const calendarId = body.calendarId || 'primary';
    const cal = CalendarApp.getDefaultCalendar();
    
    const title = body.summary || 'Bez názvu';
    const description = body.description || '';
    const location = body.location || '';
    
    const attendeeEmails = getAttendeeEmails(body.attendees);
    const guestsStr = attendeeEmails.join(',');
    const sendInvites = body.sendInvites !== false;
    
    let event;
    if (body.start && body.start.date) {
      const startDate = new Date(body.start.date + 'T00:00:00');
      let endDate;
      if (body.end && body.end.date) {
        endDate = new Date(new Date(body.end.date + 'T00:00:00').getTime() - 24*60*60*1000);
      }
      
      const opts = { description, location, guests: guestsStr, sendInvites };
      
      if (endDate && endDate > startDate) {
        event = cal.createAllDayEvent(title, startDate, endDate, opts);
      } else {
        event = cal.createAllDayEvent(title, startDate, opts);
      }
    } else {
      if (!body.start || !body.start.dateTime) {
        return jsonOut({ ok: false, error: 'Provide start.dateTime or start.date' });
      }
      const start = parseISO(body.start.dateTime);
      let end = body.end && body.end.dateTime ? parseISO(body.end.dateTime) : null;
      if (!end) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }
      
      const opts = { description, location, guests: guestsStr, sendInvites };
      event = cal.createEvent(title, start, end, opts);
    }
    
    const out = {
      ok: true,
      id: event.getId(),
      summary: event.getTitle(),
      start: event.isAllDayEvent() ? { date: body.start.date } : { dateTime: event.getStartTime().toISOString() },
      end: event.isAllDayEvent()
        ? (body.end && body.end.date ? { date: body.end.date } : undefined)
        : { dateTime: event.getEndTime().toISOString() },
      location: event.getLocation()
    };
    
    return jsonOut(out);
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function getEvents(params) {
  try {
    const cal = CalendarApp.getDefaultCalendar();
    const maxResults = params && params.maxResults ? parseInt(params.maxResults) : 10;
    const daysAhead = params && params.daysAhead ? parseInt(params.daysAhead) : 30;
    
    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    const events = cal.getEvents(now, endDate);
    
    const eventList = events.slice(0, maxResults).map(event => {
      const guests = event.getGuestList();
      const attendees = guests.map(guest => ({
        email: guest.getEmail(),
        name: guest.getName() || guest.getEmail(),
        status: guest.getGuestStatus().toString()
      }));
      
      return {
        id: event.getId(),
        summary: event.getTitle(),
        description: event.getDescription() || '',
        location: event.getLocation() || '',
        start: {
          dateTime: event.getStartTime().toISOString()
        },
        end: {
          dateTime: event.getEndTime().toISOString()
        },
        created: event.getDateCreated().toISOString(),
        attendees: attendees,
        creator: event.getCreators()[0] || ''
      };
    });
    
    return jsonOut({
      ok: true,
      events: eventList,
      count: eventList.length,
      calendarName: cal.getName()
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

function updateEvent(params) {
  try {
    if (!params || !params.eventId) {
      return jsonOut({
        ok: false,
        error: 'Missing required parameter: eventId'
      });
    }
    
    const cal = CalendarApp.getDefaultCalendar();
    const event = cal.getEventById(params.eventId);
    
    if (!event) {
      return jsonOut({
        ok: false,
        error: 'Event not found',
        eventId: params.eventId
      });
    }
    
    // Update len zadané polia
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
      event.setTime(parseISO(params.startTime), parseISO(params.endTime));
    }
    
    return jsonOut({
      ok: true,
      message: 'Udalosť bola úspešne aktualizovaná',
      event: {
        id: event.getId(),
        summary: event.getTitle(),
        start: event.getStartTime().toISOString(),
        end: event.getEndTime().toISOString()
      }
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

function deleteEvent(params) {
  try {
    if (!params || !params.eventId) {
      return jsonOut({
        ok: false,
        error: 'Missing required parameter: eventId'
      });
    }
    
    const cal = CalendarApp.getDefaultCalendar();
    const event = cal.getEventById(params.eventId);
    
    if (!event) {
      return jsonOut({
        ok: false,
        error: 'Event not found',
        eventId: params.eventId
      });
    }
    
    const eventTitle = event.getTitle();
    event.deleteEvent();
    
    return jsonOut({
      ok: true,
      message: 'Udalosť "' + eventTitle + '" bola úspešne zmazaná',
      eventId: params.eventId
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

// Helper functions
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseISO(s) {
  if (!s) {
    throw new Error('Date string is required');
  }
  const date = new Date(s);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format: ' + s);
  }
  return date;
}

function getAttendeeEmails(attendees) {
  if (!attendees || !Array.isArray(attendees)) return [];
  return attendees
    .map(a => (typeof a === 'string' ? a : (a && a.email)))
    .filter(Boolean);
}

