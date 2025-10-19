# 🗓️ Multi-Calendar Setup Guide

## 📋 Krok 1: Vytvorte Google Apps Script

### A. Otvorte Apps Script Editor
1. Ísť na: https://script.google.com
2. Kliknúť **"New project"**
3. Pomenovať projekt: **"Multi-Calendar Bridge"**

### B. Vložte kód
1. Vymazať existujúci kód
2. Skopírovať **CELÝ** obsah súboru `GoogleAppsScript-MultiCalendar.gs`
3. Vložiť do editora
4. **Ctrl+S** (uložiť)

---

## 🚀 Krok 2: Deploy ako Web App

### A. Nasaďte projekt
1. Kliknúť **"Deploy"** → **"New deployment"**
2. Kliknúť na ⚙️ vedľa "Select type"
3. Vybrať **"Web app"**

### B. Nastavenia:
```
Description: Multi-Calendar API v1
Execute as: Me (váš email)
Who has access: Anyone
```

4. Kliknúť **"Deploy"**
5. **Autorizovať** prístup (povoliť všetky kalendáre)
6. **SKOPÍROVAŤ** Deployment URL (začína `https://script.google.com/macros/s/...`)

---

## ✅ Krok 3: Otestujte API

### A. Test v prehliadači

**Zoznam kalendárov:**
```
https://script.google.com/macros/s/VAŠID/exec?action=listCalendars
```

Uvidíte:
```json
{
  "ok": true,
  "calendars": [
    {
      "id": "juraj@firma.sk",
      "name": "Juraj Martinkovych",
      "color": "#9fe1e7",
      "isOwned": true
    },
    {
      "id": "peter@firma.sk", 
      "name": "Peter Novák",
      "color": "#f83a22",
      "isOwned": false
    },
    ...
  ],
  "count": 5,
  "primary": "juraj@firma.sk"
}
```

**Udalosti zo všetkých kalendárov:**
```
https://script.google.com/macros/s/VAŠID/exec?action=getEvents&allCalendars=true&maxResults=20
```

---

## 🎯 Krok 4: Nastavte Web Server

### A. Upravte `.env` súbor

```bash
nano .env
```

Pridajte/upravte:
```
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/VAŠID/exec
OPENAI_API_KEY=sk-proj-...váš-kľúč...
PORT=3001
```

### B. Reštartujte server

```bash
# Zastavte starý server (Ctrl+C v termináli kde beží)
# Potom spustite nový:
npm run web
```

---

## 📊 Ako to funguje

### 1. **Jeden kalendár na zamestnanca**
```
📅 Juraj Martinkovych (modrý)
📅 Peter Novák (červený)  
📅 Zuzana Horváthová (zelený)
📅 Martin Kováč (oranžový)
📅 Anna Nováková (fialový)
```

### 2. **Udalosti majú farbu kalendára**
- Udalosť od Juraja = modrá hranica
- Udalosť od Petra = červená hranica
- atď.

### 3. **API Endpoints**

#### Zoznam kalendárov:
```javascript
GET ?action=listCalendars
```

#### Všetky udalosti:
```javascript
GET ?action=getEvents&allCalendars=true&maxResults=50
```

#### Udalosti jedného zamestnanca:
```javascript
GET ?action=getEvents&calendarId=peter@firma.sk&maxResults=10
```

#### Pridať udalosť do konkrétneho kalendára:
```javascript
POST /
Body: {
  "calendarId": "peter@firma.sk",
  "summary": "Stretnutie s klientom",
  "start": { "dateTime": "2025-10-21T14:00:00+02:00" },
  "end": { "dateTime": "2025-10-21T15:00:00+02:00" }
}
```

---

## 🎨 Web Rozhranie

Po reštarte servera uvidíte:
- ✅ Všetky kalendáre naraz
- 🎨 Každý kalendár má svoju farbu
- 👤 Názov zamestnanca pri každej udalosti
- 📋 Zoznam / 📅 Týždeň / 🗓️ Mesiac view
- 🔍 Filtrovanie podľa kalendára (pridám to ďalej)

---

## 🔒 Oprávnenia

**Čo musíte povoliť:**
1. ✅ Prístup k všetkým kalendárom
2. ✅ Čítanie udalostí
3. ✅ Vytváranie/úprava/mazanie udalostí
4. ✅ Zdieľanie cez web

**Bezpečnosť:**
- URL je verejná, ale iba vy ju poznáte
- Nikto iný ju nemôže uhádnuť (obsahuje náhodný token)

---

## 📱 Príklad štruktúry

```
Firma s 5 zamestnancami:
├─ 📅 Juraj (CEO) - modrý kalendár
│  ├─ Stretnutie s investormi
│  └─ Board meeting
├─ 📅 Peter (Sales) - červený kalendár  
│  ├─ Demo pre klienta A
│  └─ Call s klientom B
├─ 📅 Zuzana (Marketing) - zelený kalendár
│  ├─ Kampane planning
│  └─ Social media review
├─ 📅 Martin (Dev) - oranžový kalendár
│  ├─ Sprint planning
│  └─ Code review
└─ 📅 Anna (HR) - fialový kalendár
   ├─ Interview kandidát 1
   └─ Team building organizácia
```

---

## 🚀 Ready?

1. ✅ Skopírujte kód do Apps Script
2. ✅ Deploy ako Web App
3. ✅ Skopírujte URL do `.env`
4. ✅ Reštartujte server
5. ✅ Otvorte http://localhost:3001

**Uvidíte všetky kalendáre naraz!** 🎉

