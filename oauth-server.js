import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ============================================================================
// PASSPORT CONFIGURATION
// ============================================================================

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/callback',
    accessType: 'offline',
    prompt: 'consent'
  },
  (accessToken, refreshToken, profile, done) => {
    const user = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0]?.value,
      accessToken,
      refreshToken
    };
    return done(null, user);
  }
));

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

// ============================================================================
// GOOGLE CALENDAR FUNCTIONS
// ============================================================================

async function getCalendarClient(user) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

async function listUserCalendars(user) {
  try {
    const calendar = await getCalendarClient(user);
    const response = await calendar.calendarList.list();
    
    return {
      ok: true,
      calendars: response.data.items.map(cal => ({
        id: cal.id,
        name: cal.summary,
        description: cal.description || '',
        color: cal.backgroundColor,
        primary: cal.primary || false,
        accessRole: cal.accessRole,
        timeZone: cal.timeZone
      })),
      count: response.data.items.length
    };
  } catch (error) {
    console.error('Error listing calendars:', error);
    return { ok: false, error: error.message };
  }
}

async function listCalendarEvents(user, calendarId = 'primary', maxResults = 50) {
  try {
    const calendar = await getCalendarClient(user);
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return {
      ok: true,
      events: response.data.items.map(event => ({
        id: event.id,
        calendarId: calendarId,
        summary: event.summary || 'Bez názvu',
        description: event.description || '',
        location: event.location || '',
        start: event.start,
        end: event.end,
        attendees: event.attendees?.map(a => ({
          email: a.email,
          name: a.displayName || a.email,
          status: a.responseStatus
        })) || [],
        creator: event.creator,
        htmlLink: event.htmlLink,
        isAllDay: !!event.start.date
      })),
      count: response.data.items.length
    };
  } catch (error) {
    console.error('Error listing events:', error);
    return { ok: false, error: error.message };
  }
}

async function getAllCalendarEvents(user, maxResults = 50) {
  try {
    const calendarsResult = await listUserCalendars(user);
    if (!calendarsResult.ok) return calendarsResult;

    const allEvents = [];
    
    for (const cal of calendarsResult.calendars) {
      const eventsResult = await listCalendarEvents(user, cal.id, 20);
      if (eventsResult.ok) {
        eventsResult.events.forEach(event => {
          allEvents.push({
            ...event,
            calendarName: cal.name,
            calendarColor: cal.color
          });
        });
      }
    }

    // Sort by start time
    allEvents.sort((a, b) => {
      const timeA = new Date(a.start.dateTime || a.start.date);
      const timeB = new Date(b.start.dateTime || b.start.date);
      return timeA - timeB;
    });

    return {
      ok: true,
      events: allEvents.slice(0, maxResults),
      count: allEvents.length,
      calendarsScanned: calendarsResult.calendars.length
    };
  } catch (error) {
    console.error('Error getting all events:', error);
    return { ok: false, error: error.message };
  }
}

async function createCalendarEvent(user, eventData) {
  try {
    const calendar = await getCalendarClient(user);
    
    const event = {
      summary: eventData.summary,
      description: eventData.description || '',
      location: eventData.location || '',
      start: eventData.start,
      end: eventData.end,
      attendees: eventData.attendees || []
    };

    const response = await calendar.events.insert({
      calendarId: eventData.calendarId || 'primary',
      resource: event,
      sendUpdates: 'all'
    });

    return {
      ok: true,
      event: response.data
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return { ok: false, error: error.message };
  }
}

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.get('/auth/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ]
  })
);

app.get('/auth/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.redirect('/');
  });
});

app.get('/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

app.get('/api/calendars', ensureAuthenticated, async (req, res) => {
  const result = await listUserCalendars(req.user);
  res.json(result);
});

app.get('/api/events', ensureAuthenticated, async (req, res) => {
  const calendarId = req.query.calendarId || 'all';
  const maxResults = parseInt(req.query.maxResults) || 50;

  let result;
  if (calendarId === 'all') {
    result = await getAllCalendarEvents(req.user, maxResults);
  } else {
    result = await listCalendarEvents(req.user, calendarId, maxResults);
  }

  res.json(result);
});

app.post('/api/events', ensureAuthenticated, async (req, res) => {
  const result = await createCalendarEvent(req.user, req.body);
  res.json(result);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    authenticated: req.isAuthenticated(),
    oauth: !!process.env.GOOGLE_CLIENT_ID
  });
});

// ============================================================================
// STATIC PAGES
// ============================================================================

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n🔐 OAuth Calendar Server beží na http://localhost:${PORT}`);
  console.log(`📅 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✅' : '❌'}`);
  console.log(`🔑 Session Secret: ${process.env.SESSION_SECRET ? '✅' : '❌'}\n`);
  
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.log('⚠️  UPOZORNENIE: Nastavte GOOGLE_CLIENT_ID v .env súbore!');
    console.log('📖 Návod: OAUTH-SETUP.md\n');
  }
});

