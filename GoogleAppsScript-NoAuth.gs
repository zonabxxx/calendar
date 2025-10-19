/** 
 * Ultra-Simple Google Calendar Bridge
 * BEZ API kľúča - IBA URL!
 * Každý používateľ si nasadí vlastný script
 */

// ============================================================================
// HTTP HANDLERS
// ============================================================================

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getCalendars') {
    return listCalendars();
  } else if (action === 'getEvents') {
    return getEvents(e.parameter);
  } else if (action === 'deleteEvent') {
    return deleteEvent(e.parameter);
  }
  
  return jsonOut({
    ok: true,
    message: 'Simple Calendar API - Ready!',
    user: Session.getActiveUser().getEmail(),
    endpoints: {
      listCalendars: '?action=getCalendars',
      getEvents: '?action=getEvents&allCalendars=true',
      createEvent: 'POST JSON'
    }
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'Missing JSON body' });
    }

    const body = JSON.parse(e.postData.contents);
    
    const calendarId = body.calendarId || 'primary';
    const cal = CalendarApp.getCalendarById(calendarId);
    
    if (!cal) {
      return jsonOut({ 
        ok: false, 
        error: `Calendar not found: ${calendarId}` 
      });
    }
    
    const title = body.summary || 'Bez názvu';
    const description = body.description || '';
    const location = body.location || '';
    
    let event;
    
    if (body.start && body.start.date) {
      const startDate = new Date(body.start.date + 'T00:00:00');
      event = cal.createAllDayEvent(title, startDate, {
        description,
        location
      });
    } else {
      if (!body.start || !body.start.dateTime) {
        return jsonOut({ 
          ok: false, 
          error: 'Provide start.dateTime or start.date' 
        });
      }
      
      const start = new Date(body.start.dateTime);
      let end = body.end && body.end.dateTime 
        ? new Date(body.end.dateTime) 
        : new Date(start.getTime() + 60 * 60 * 1000);
      
      event = cal.createEvent(title, start, end, {
        description,
        location
      });
    }
    
    return jsonOut({
      ok: true,
      id: event.getId(),
      calendarId: calendarId,
      summary: event.getTitle(),
      start: event.isAllDayEvent() 
        ? { date: body.start.date } 
        : { dateTime: event.getStartTime().toISOString() },
      end: event.isAllDayEvent()
        ? undefined
        : { dateTime: event.getEndTime().toISOString() }
    });
    
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function listCalendars() {
  try {
    const allCalendars = CalendarApp.getAllCalendars();
    
    const calendarList = allCalendars.map(cal => ({
      id: cal.getId(),
      name: cal.getName(),
      description: cal.getDescription() || '',
      color: cal.getColor(),
      isSelected: cal.isSelected(),
      timeZone: cal.getTimeZone()
    }));
    
    return jsonOut({
      ok: true,
      calendars: calendarList,
      count: calendarList.length,
      user: Session.getActiveUser().getEmail()
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

function getEvents(params) {
  try {
    const maxResults = params.maxResults ? parseInt(params.maxResults) : 50;
    const daysAhead = params.daysAhead ? parseInt(params.daysAhead) : 30;
    const allCalendars = params.allCalendars === 'true';
    const calendarId = params.calendarId;
    
    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    let calendars = [];
    
    if (allCalendars) {
      calendars = CalendarApp.getAllCalendars().filter(cal => cal.isSelected());
    } else if (calendarId) {
      const cal = CalendarApp.getCalendarById(calendarId);
      if (!cal) {
        return jsonOut({ ok: false, error: 'Calendar not found' });
      }
      calendars = [cal];
    } else {
      calendars = [CalendarApp.getDefaultCalendar()];
    }
    
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
    
    allEvents.sort((a, b) => {
      return new Date(a.start.dateTime) - new Date(b.start.dateTime);
    });
    
    const limitedEvents = allEvents.slice(0, maxResults);
    
    return jsonOut({
      ok: true,
      events: limitedEvents,
      count: limitedEvents.length,
      totalFound: allEvents.length,
      calendarsScanned: calendars.length,
      user: Session.getActiveUser().getEmail()
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
    if (!params.eventId) {
      return jsonOut({ ok: false, error: 'eventId required' });
    }
    if (!params.calendarId) {
      return jsonOut({ ok: false, error: 'calendarId required' });
    }
    
    const cal = CalendarApp.getCalendarById(params.calendarId);
    if (!cal) {
      return jsonOut({ ok: false, error: 'Calendar not found' });
    }
    
    const event = cal.getEventById(params.eventId);
    if (!event) {
      return jsonOut({ ok: false, error: 'Event not found' });
    }
    
    const title = event.getTitle();
    event.deleteEvent();
    
    return jsonOut({
      ok: true,
      deleted: true,
      eventId: params.eventId,
      title: title
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function testGetCalendars() {
  const result = listCalendars();
  Logger.log(result.getContent());
  return result;
}

function testGetEvents() {
  const result = getEvents({ maxResults: 5, allCalendars: 'true' });
  Logger.log(result.getContent());
  return result;
}

