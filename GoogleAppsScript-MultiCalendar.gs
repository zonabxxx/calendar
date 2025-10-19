/** 
 * Multi-Calendar Google Apps Script Bridge
 * Podporuje čítanie a správu viacerých kalendárov
 */

// TEST FUNKCIA - spustite túto pri testovaní v editore
function testGetCalendars() {
  const result = listCalendars();
  Logger.log(result.getContent());
  return result;
}

function testGetAllEvents() {
  const result = getEvents({ maxResults: 10, allCalendars: true });
  Logger.log(result.getContent());
  return result;
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================

function doGet(e) {
  // Bezpečná kontrola parametrov
  if (!e || !e.parameter) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ok',
        message: 'Multi-Calendar Bridge API',
        endpoints: {
          listCalendars: '?action=listCalendars',
          getEvents: '?action=getEvents&calendarId=xxx (or allCalendars=true)',
          updateEvent: '?action=updateEvent&eventId=xxx&calendarId=xxx',
          deleteEvent: '?action=deleteEvent&eventId=xxx&calendarId=xxx'
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = e.parameter.action;
  
  if (action === 'listCalendars') {
    return listCalendars();
  } else if (action === 'getEvents') {
    return getEvents(e.parameter);
  } else if (action === 'updateEvent') {
    return updateEvent(e.parameter);
  } else if (action === 'deleteEvent') {
    return deleteEvent(e.parameter);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action',
      available: ['listCalendars', 'getEvents', 'updateEvent', 'deleteEvent']
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'Missing JSON body' });
    }

    const body = JSON.parse(e.postData.contents);
    
    // Ktorý kalendár?
    const calendarId = body.calendarId || 'primary';
    const cal = CalendarApp.getCalendarById(calendarId);
    
    if (!cal) {
      return jsonOut({ 
        ok: false, 
        error: `Calendar not found: ${calendarId}`,
        hint: 'Use ?action=listCalendars to see available calendars'
      });
    }
    
    const title = body.summary || 'Bez názvu';
    const description = body.description || '';
    const location = body.location || '';
    
    const attendeeEmails = getAttendeeEmails(body.attendees);
    const guestsStr = attendeeEmails.join(',');
    const sendInvites = body.sendInvites !== false;
    
    let event;
    
    // Celodenná vs. časovaná udalosť
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
      calendarId: calendarId,
      calendarName: cal.getName(),
      summary: event.getTitle(),
      start: event.isAllDayEvent() 
        ? { date: body.start.date } 
        : { dateTime: event.getStartTime().toISOString() },
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

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

/**
 * Vráti zoznam všetkých dostupných kalendárov
 */
function listCalendars() {
  try {
    const allCalendars = CalendarApp.getAllCalendars();
    const ownedCalendars = CalendarApp.getAllOwnedCalendars();
    
    const calendarList = allCalendars.map(cal => {
      const isOwned = ownedCalendars.some(owned => owned.getId() === cal.getId());
      
      return {
        id: cal.getId(),
        name: cal.getName(),
        description: cal.getDescription() || '',
        color: cal.getColor(),
        isOwned: isOwned,
        isHidden: cal.isHidden(),
        isSelected: cal.isSelected(),
        timeZone: cal.getTimeZone()
      };
    });
    
    return jsonOut({
      ok: true,
      calendars: calendarList,
      count: calendarList.length,
      primary: CalendarApp.getDefaultCalendar().getId()
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

/**
 * Získa udalosti z jedného alebo všetkých kalendárov
 */
function getEvents(params) {
  try {
    const maxResults = params && params.maxResults ? parseInt(params.maxResults) : 10;
    const daysAhead = params && params.daysAhead ? parseInt(params.daysAhead) : 30;
    const allCalendars = params && params.allCalendars === 'true';
    const calendarId = params && params.calendarId;
    
    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    let calendars = [];
    
    if (allCalendars) {
      // Získaj udalosti zo všetkých kalendárov
      calendars = CalendarApp.getAllCalendars().filter(cal => cal.isSelected());
    } else if (calendarId) {
      // Špecifický kalendár
      const cal = CalendarApp.getCalendarById(calendarId);
      if (!cal) {
        return jsonOut({ 
          ok: false, 
          error: `Calendar not found: ${calendarId}` 
        });
      }
      calendars = [cal];
    } else {
      // Default kalendár
      calendars = [CalendarApp.getDefaultCalendar()];
    }
    
    // Získaj udalosti zo všetkých vybraných kalendárov
    const allEvents = [];
    
    calendars.forEach(cal => {
      const events = cal.getEvents(now, endDate);
      
      events.forEach(event => {
        const guests = event.getGuestList();
        const attendees = guests.map(guest => ({
          email: guest.getEmail(),
          name: guest.getName() || guest.getEmail(),
          status: guest.getGuestStatus().toString()
        }));
        
        allEvents.push({
          id: event.getId(),
          calendarId: cal.getId(),
          calendarName: cal.getName(),
          calendarColor: cal.getColor(),
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
          creator: event.getCreators()[0] || '',
          isAllDay: event.isAllDayEvent()
        });
      });
    });
    
    // Zoriaď podľa času
    allEvents.sort((a, b) => {
      return new Date(a.start.dateTime) - new Date(b.start.dateTime);
    });
    
    // Obmedz počet
    const limitedEvents = allEvents.slice(0, maxResults);
    
    return jsonOut({
      ok: true,
      events: limitedEvents,
      count: limitedEvents.length,
      totalFound: allEvents.length,
      calendarsScanned: calendars.length
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

/**
 * Aktualizuje existujúcu udalosť
 */
function updateEvent(params) {
  try {
    if (!params.eventId) {
      return jsonOut({ ok: false, error: 'eventId is required' });
    }
    if (!params.calendarId) {
      return jsonOut({ ok: false, error: 'calendarId is required' });
    }
    
    const cal = CalendarApp.getCalendarById(params.calendarId);
    if (!cal) {
      return jsonOut({ ok: false, error: 'Calendar not found' });
    }
    
    const event = cal.getEventById(params.eventId);
    if (!event) {
      return jsonOut({ ok: false, error: 'Event not found in this calendar' });
    }
    
    // Aktualizuj políčka
    if (params.summary) event.setTitle(params.summary);
    if (params.description) event.setDescription(params.description);
    if (params.location) event.setLocation(params.location);
    
    if (params.startTime && params.endTime) {
      const start = parseISO(params.startTime);
      const end = parseISO(params.endTime);
      event.setTime(start, end);
    }
    
    return jsonOut({
      ok: true,
      id: event.getId(),
      calendarId: params.calendarId,
      summary: event.getTitle(),
      updated: true
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

/**
 * Zmaže udalosť
 */
function deleteEvent(params) {
  try {
    if (!params.eventId) {
      return jsonOut({ ok: false, error: 'eventId is required' });
    }
    if (!params.calendarId) {
      return jsonOut({ ok: false, error: 'calendarId is required' });
    }
    
    const cal = CalendarApp.getCalendarById(params.calendarId);
    if (!cal) {
      return jsonOut({ ok: false, error: 'Calendar not found' });
    }
    
    const event = cal.getEventById(params.eventId);
    if (!event) {
      return jsonOut({ ok: false, error: 'Event not found in this calendar' });
    }
    
    const title = event.getTitle();
    event.deleteEvent();
    
    return jsonOut({
      ok: true,
      deleted: true,
      eventId: params.eventId,
      calendarId: params.calendarId,
      title: title
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

