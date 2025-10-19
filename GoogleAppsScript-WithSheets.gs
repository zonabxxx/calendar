/** 
 * Advanced Calendar Manager with Google Sheets Integration
 * Vytvára kalendáre na základe tabuľky
 */

// ============================================================================
// KONFIGURÁCIA - NASTAVTE SVOJE ID TABUĽKY
// ============================================================================

// Získajte ID z URL tabuľky:
// https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
//                                      ^^^^^^^^ toto je ID
const SPREADSHEET_ID = '1PBshy6yISpduJNlqgNJM_ZoKFBK2coxoY2fVkJ9Hjxk';
const SHEET_NAME = 'Zamestnanci'; // Názov listu v tabuľke

// ============================================================================
// HTTP HANDLERS
// ============================================================================

function doGet(e) {
  // Bezpečnostná kontrola
  if (!e || !e.parameter) {
    return jsonOut({
      ok: true,
      message: 'Advanced Calendar API with Sheets Integration',
      user: Session.getActiveUser().getEmail(),
      endpoints: {
        listCalendars: '?action=getCalendars',
        getEvents: '?action=getEvents&allCalendars=true',
        syncFromSheet: '?action=syncFromSheet',
        getSheetData: '?action=getSheetData'
      }
    });
  }
  
  const action = e.parameter.action;
  
  if (action === 'getCalendars') {
    return listCalendars();
  } else if (action === 'getEvents') {
    return getEvents(e.parameter);
  } else if (action === 'deleteEvent') {
    return deleteEvent(e.parameter);
  } else if (action === 'syncFromSheet') {
    return syncCalendarsFromSheet();
  } else if (action === 'getSheetData') {
    return getSheetData();
  }
  
  return jsonOut({
    ok: true,
    message: 'Advanced Calendar API with Sheets Integration',
    user: Session.getActiveUser().getEmail(),
    endpoints: {
      listCalendars: '?action=getCalendars',
      getEvents: '?action=getEvents&allCalendars=true',
      syncFromSheet: '?action=syncFromSheet',
      getSheetData: '?action=getSheetData'
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

// ============================================================================
// GOOGLE SHEETS INTEGRATION
// ============================================================================

/**
 * Načíta dáta z Google Sheets tabuľky
 * 
 * Tabuľka by mala mať stĺpce:
 * A: Meno (napr. "Juraj Martinkovych")
 * B: Email (napr. "juraj@firma.sk")
 * C: Pozícia (napr. "CEO")
 * D: Farba (napr. "blue", "red", "green")
 */
function getSheetData() {
  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'VLOŽTE_ID_VAŠEJ_TABUĽKY') {
      return jsonOut({
        ok: false,
        error: 'SPREADSHEET_ID nie je nastavené v scripte!',
        hint: 'Upravte SPREADSHEET_ID na začiatku scriptu'
      });
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return jsonOut({
        ok: false,
        error: `Sheet "${SHEET_NAME}" nebol nájdený`,
        hint: 'Skontrolujte názov listu v tabuľke'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0]; // Prvý riadok = hlavička
    const rows = data.slice(1); // Zvyšok = dáta
    
    const employees = rows
      .filter(row => row[0]) // Preskočiť prázdne riadky
      .map(row => ({
        name: row[0] || '',
        email: row[1] || '',
        position: row[2] || '',
        color: row[3] || 'blue'
      }));
    
    return jsonOut({
      ok: true,
      employees: employees,
      count: employees.length,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString(),
      hint: 'Skontrolujte či máte prístup k tabuľke a či je ID správne'
    });
  }
}

/**
 * Vytvorí kalendáre pre všetkých zamestnancov z tabuľky
 */
function syncCalendarsFromSheet() {
  try {
    // Načítaj dáta z tabuľky
    const sheetData = JSON.parse(getSheetData().getContent());
    
    if (!sheetData.ok) {
      return jsonOut(sheetData);
    }
    
    const employees = sheetData.employees;
    const results = [];
    
    // Pre každého zamestnanca
    employees.forEach(emp => {
      try {
        const calendarName = `${emp.name} - ${emp.position}`;
        
        // Skontroluj či kalendár už existuje
        const existingCals = CalendarApp.getAllOwnedCalendars();
        let calendar = existingCals.find(cal => cal.getName() === calendarName);
        
        if (calendar) {
          // Kalendár už existuje
          results.push({
            name: emp.name,
            email: emp.email,
            calendar: calendarName,
            calendarId: calendar.getId(),
            status: 'already_exists',
            color: calendar.getColor()
          });
        } else {
          // Vytvor nový kalendár
          calendar = CalendarApp.createCalendar(calendarName, {
            summary: `Kalendár pre ${emp.name}`,
            location: emp.position,
            timeZone: Session.getScriptTimeZone()
          });
          
          // Nastav farbu
          const colorMap = {
            'blue': CalendarApp.Color.BLUE,
            'red': CalendarApp.Color.RED,
            'green': CalendarApp.Color.GREEN,
            'orange': CalendarApp.Color.ORANGE,
            'purple': CalendarApp.Color.PURPLE,
            'yellow': CalendarApp.Color.YELLOW,
            'pink': CalendarApp.Color.PINK,
            'cyan': CalendarApp.Color.CYAN
          };
          
          const color = colorMap[emp.color.toLowerCase()] || CalendarApp.Color.BLUE;
          calendar.setColor(color);
          
          // Ak je zadaný email, zdieľaj kalendár
          if (emp.email && emp.email.includes('@')) {
            try {
              calendar.addEditor(emp.email);
            } catch (e) {
              // Email neexistuje alebo nemá Google účet
            }
          }
          
          results.push({
            name: emp.name,
            email: emp.email,
            calendar: calendarName,
            calendarId: calendar.getId(),
            status: 'created',
            color: calendar.getColor()
          });
        }
      } catch (error) {
        results.push({
          name: emp.name,
          email: emp.email,
          status: 'error',
          error: error.toString()
        });
      }
    });
    
    return jsonOut({
      ok: true,
      message: 'Synchronizácia dokončená',
      results: results,
      created: results.filter(r => r.status === 'created').length,
      existing: results.filter(r => r.status === 'already_exists').length,
      errors: results.filter(r => r.status === 'error').length
    });
    
  } catch (error) {
    return jsonOut({
      ok: false,
      error: error.toString()
    });
  }
}

// ============================================================================
// CALENDAR FUNCTIONS (rovnaké ako predtým)
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

function testGetSheetData() {
  const result = getSheetData();
  Logger.log(result.getContent());
  return result;
}

function testSyncCalendars() {
  const result = syncCalendarsFromSheet();
  Logger.log(result.getContent());
  return result;
}

