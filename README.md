# Google Calendar MCP Server

MCP Server pre prístup k Google Kalendáru cez Google Apps Script, deploynutý na Vercel.

## 🚀 Rýchly Štart

### Lokálne Testovanie

1. **Inštalácia závislostí:**
```bash
npm install
```

2. **Spustenie servera:**
```bash
npm start
```

Server beží na `http://localhost:3000`

### Testovanie Health Check
```bash
curl http://localhost:3000
```

## 📦 Deployment na Vercel

### Prvý Deployment

1. **Nainštalujte Vercel CLI:**
```bash
npm install -g vercel
```

2. **Prihláste sa do Vercel:**
```bash
vercel login
```

3. **Deployujte projekt:**
```bash
vercel
```

Pri prvom deploymente budete vyzvaní:
- Scope: vyberte váš účet
- Link to existing project? **N** (nie)
- Project name: **google-calendar-mcp** (alebo vlastný názov)
- Directory: **./** (potvrďte)
- Override settings? **N** (nie)

4. **Production deployment:**
```bash
vercel --prod
```

### Následné Deploymenty

Pre ďalšie aktualizácie stačí spustiť:
```bash
vercel --prod
```

## 🔗 Použitie v ChatGPT Kit

Po deploymente na Vercel dostanete URL ako:
```
https://google-calendar-mcp-abcd1234.vercel.app
```

### Pripojenie v ChatGPT Kit:

1. Otvorte ChatGPT Kit MCP nastavenia
2. Kliknite na "Connect to MCP Server"
3. Zadajte údaje:
   - **URL:** `https://vasa-vercel-url.vercel.app`
   - **Label:** `Google Calendar`
   - **Description:** `Prístup k môjmu Google Kalendáru`
   - **Authentication:** Access token / API key (nepovinné)

## 🛠️ Dostupné Nástroje (Tools)

### 1. get_calendar_events
Získa udalosti z kalendára.

**Parametre:**
- `calendarId` (optional): ID kalendára, default "primary"
- `timeMin` (optional): Minimálny čas (ISO 8601)
- `timeMax` (optional): Maximálny čas (ISO 8601)
- `maxResults` (optional): Max počet výsledkov, default 10

### 2. create_calendar_event
Vytvorí novú udalosť.

**Parametre:**
- `summary` (required): Názov udalosti
- `description` (optional): Popis
- `startTime` (required): Začiatok (ISO 8601)
- `endTime` (required): Koniec (ISO 8601)
- `calendarId` (optional): ID kalendára

### 3. update_calendar_event
Aktualizuje existujúcu udalosť.

**Parametre:**
- `eventId` (required): ID udalosti
- `summary` (optional): Nový názov
- `description` (optional): Nový popis
- `startTime` (optional): Nový začiatok
- `endTime` (optional): Nový koniec
- `calendarId` (optional): ID kalendára

### 4. delete_calendar_event
Zmaže udalosť.

**Parametre:**
- `eventId` (required): ID udalosti
- `calendarId` (optional): ID kalendára

## 🔧 Google Apps Script Konfigurácia

Váš Google Apps Script musí implementovať tieto akcie:
- `getEvents`
- `createEvent`
- `updateEvent`
- `deleteEvent`

Príklad Google Apps Script kódu:

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
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
      return ContentService.createTextOutput(JSON.stringify({error: 'Unknown action'}))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

function getEvents(params) {
  const calendarId = params.calendarId || 'primary';
  const calendar = CalendarApp.getCalendarById(calendarId);
  
  const now = new Date();
  const maxResults = parseInt(params.maxResults) || 10;
  const events = calendar.getEvents(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
  
  const eventList = events.slice(0, maxResults).map(event => ({
    id: event.getId(),
    summary: event.getTitle(),
    description: event.getDescription(),
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    location: event.getLocation()
  }));
  
  return ContentService.createTextOutput(JSON.stringify({events: eventList}))
    .setMimeType(ContentService.MimeType.JSON);
}

function createEvent(params) {
  const calendarId = params.calendarId || 'primary';
  const calendar = CalendarApp.getCalendarById(calendarId);
  
  const event = calendar.createEvent(
    params.summary,
    new Date(params.startTime),
    new Date(params.endTime),
    {description: params.description || ''}
  );
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    eventId: event.getId()
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateEvent(params) {
  const calendarId = params.calendarId || 'primary';
  const calendar = CalendarApp.getCalendarById(calendarId);
  const event = calendar.getEventById(params.eventId);
  
  if (!event) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Event not found'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (params.summary) event.setTitle(params.summary);
  if (params.description) event.setDescription(params.description);
  if (params.startTime && params.endTime) {
    event.setTime(new Date(params.startTime), new Date(params.endTime));
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteEvent(params) {
  const calendarId = params.calendarId || 'primary';
  const calendar = CalendarApp.getCalendarById(calendarId);
  const event = calendar.getEventById(params.eventId);
  
  if (!event) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Event not found'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  event.deleteEvent();
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 📝 Deployment Info

- **Google Apps Script URL:** `https://script.google.com/macros/s/AKfycbz4EKi35D4Tuor0YZbtHR4y5vyeNraE8brX1iFlgCtgwffwn-VDtHzsY_WEJwd85fmgIQ/exec`
- **Deployment ID:** `AKfycbz4EKi35D4Tuor0YZbtHR4y5vyeNraE8brX1iFlgCtgwffwn-VDtHzsY_WEJwd85fmgIQ`

## 🧪 Testovanie MCP Endpointov

```bash
# Test Initialize
curl -X POST http://localhost:3000/mcp/initialize \
  -H "Content-Type: application/json" \
  -d '{}'

# List Tools
curl -X POST http://localhost:3000/mcp/tools/list \
  -H "Content-Type: application/json" \
  -d '{}'

# Call Tool
curl -X POST http://localhost:3000/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_calendar_events",
    "arguments": {
      "maxResults": 5
    }
  }'
```

## 🔐 Bezpečnosť

- Google Apps Script musí byť nastavený na "Anyone" access pre tento use case
- Môžete pridať autentifikáciu pridaním API key do environment variables na Vercel
- Pre produkčné použitie odporúčame implementovať OAuth flow

## 📚 Ďalšie Kroky

1. Otestujte lokálne
2. Deployujte na Vercel
3. Skopírujte Vercel URL
4. Pridajte do ChatGPT Kit ako MCP server
5. Začnite používať!

## 🐛 Troubleshooting

**Problem:** Server nefunguje na Vercel
- Skontrolujte logy: `vercel logs`
- Overte že Google Apps Script je publicly accessible

**Problem:** Google Apps Script vracia chybu
- Otestujte Apps Script URL priamo v prehliadači
- Skontrolujte že máte správne permissions na kalendári

**Problem:** ChatGPT Kit sa nepripojí
- Overte že URL je správna (s https://)
- Skontrolujte že server beží (otvorte URL v prehliadači)

## 📞 Support

Pre problémy alebo otázky, skontrolujte:
- Vercel Dashboard: https://vercel.com/dashboard
- Google Apps Script: https://script.google.com

