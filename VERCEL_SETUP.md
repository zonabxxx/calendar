# 🎉 DEPLOYMENT ÚSPEŠNÝ!

## ✅ Čo je hotové:

1. ✅ Kód je na GitHub: https://github.com/zonabxxx/calendar
2. ✅ Projekt je nasadený na Vercel
3. ✅ Automatický deployment z GitHubu je nastavený

## 🔐 DÔLEŽITÉ: Vypnúť Deployment Protection

Váš Vercel projekt má zapnutú autentifikáciu. Pre MCP server musíme povoliť verejný prístup:

### Spôsob 1: Cez Vercel Dashboard (ODPORÚČANÉ)

1. Otvorte: https://vercel.com/dashboard
2. Nájdite projekt **calendar-mcp**
3. Prejdite na **Settings** → **Deployment Protection**
4. Vypnite **"Vercel Authentication"** (prepnite na OFF)
5. Uložte zmeny

### Spôsob 2: Cez Vercel CLI

```bash
cd "/Users/polepime.sk/Documents/cursor_workspace/google calndar juraj"
vercel env add VERCEL_AUTOMATION_BYPASS_SECRET production
# Zadajte ľubovoľný secret (napr. random string)
```

## 📍 Váš MCP Server URL

**Production URL:** https://calendar-5puj8krq6-jurajs-projects-9233898f.vercel.app

Po vypnutí deployment protection budete môcť používať:

### Test endpointy:
```bash
# Health check
curl https://calendar-5puj8krq6-jurajs-projects-9233898f.vercel.app

# List MCP tools
curl -X POST https://calendar-5puj8krq6-jurajs-projects-9233898f.vercel.app/mcp/tools/list \\
  -H "Content-Type: application/json" \\
  -d '{}'

# Vytvorenie udalosti
curl -X POST https://calendar-5puj8krq6-jurajs-projects-9233898f.vercel.app/mcp/tools/call \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "create_calendar_event",
    "arguments": {
      "summary": "Test z Vercel",
      "startTime": "2025-10-22T15:00:00+02:00",
      "endTime": "2025-10-22T16:00:00+02:00"
    }
  }'
```

## 🔗 Pripojenie v ChatGPT Kit MCP

Po vypnutí deployment protection:

1. Otvorte ChatGPT Kit
2. Nájdite "Connect to MCP Server"
3. Zadajte:
   - **URL:** `https://calendar-5puj8krq6-jurajs-projects-9233898f.vercel.app`
   - **Label:** `Google Calendar`
   - **Description:** `Môj Google Kalendár`
   - **Authentication:** Nechajte prázdne
4. Kliknite **Connect**

## 🔄 Automatické Deploymenty

Každý push na GitHub main vetvu automaticky deployuje na Vercel!

```bash
# Urobte zmenu v kóde
git add .
git commit -m "Update"
git push origin main
# Automaticky sa deployuje na Vercel!
```

## 📊 Monitoring

- **Dashboard:** https://vercel.com/dashboard
- **Logy:** `vercel logs --prod`
- **Status:** `vercel ls`

---

## ⚠️ PRVÝ KROK: Vypnite Deployment Protection!

Otvorte: https://vercel.com/dashboard a nájdite projekt **calendar-mcp** → Settings → Deployment Protection → **OFF**

